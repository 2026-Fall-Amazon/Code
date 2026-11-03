"""Create private club notifications, RSVP reminders, and weekly email digests."""
import hashlib
import logging
import os
from datetime import datetime, timedelta, timezone

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

dynamodb = boto3.resource("dynamodb")
ses = boto3.client("ses", region_name=os.environ.get("AWS_REGION"))

notifications = dynamodb.Table(os.environ["NOTIFICATION_TABLE_NAME"])
preferences = dynamodb.Table(os.environ["PREFERENCE_TABLE_NAME"])
announcements = dynamodb.Table(os.environ["ANNOUNCEMENT_TABLE_NAME"])
events = dynamodb.Table(os.environ["EVENT_TABLE_NAME"])
memberships = dynamodb.Table(os.environ["MEMBERSHIP_TABLE_NAME"])
club_roles = dynamodb.Table(os.environ["CLUB_ROLE_TABLE_NAME"])
clubs = dynamodb.Table(os.environ["CLUB_TABLE_NAME"])
rsvps = dynamodb.Table(os.environ["RSVP_TABLE_NAME"])

MEMBERS_BY_CLUB_INDEX = "membershipsByClubId"
RSVPS_BY_EVENT_INDEX = "rSVPSByEventId"  # Amplify's generated name for RSVP's eventId index
NOTIFICATIONS_BY_USER_INDEX = "byUser"
NOTIFICATIONS_BY_EMAIL_STATUS_INDEX = "byEmailStatus"
SES_FROM_EMAIL = os.environ.get("SES_FROM_EMAIL", "").strip()


def lambda_handler(event, context):
    field_name = event.get("fieldName") or (event.get("info") or {}).get("fieldName")
    if field_name == "setNotificationRead":
        return set_notification_read(event)
    if field_name == "markAllNotificationsRead":
        return mark_all_notifications_read(event)

    job = event.get("job", "dispatch")
    if job == "digest":
        send_weekly_digests()
    else:
        dispatch_recent_updates()
        dispatch_event_reminders()
        retry_pending_emails()
    return True


def set_notification_read(event):
    user_id = caller_id(event)
    args = event.get("arguments") or {}
    notification_id = args.get("notificationId")
    if not notification_id:
        raise Exception("Notification ID is required.")

    now = now_iso()
    if args.get("isRead"):
        expression = "SET readAt = :now, updatedAt = :now"
        values = {":now": now, ":user": user_id}
    else:
        expression = "REMOVE readAt"
        values = {":user": user_id}
    try:
        notifications.update_item(
            Key={"id": notification_id},
            UpdateExpression=expression,
            ConditionExpression="userId = :user",
            ExpressionAttributeValues=values,
        )
    except ClientError as error:
        if error.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise Exception("That notification is not available.")
        raise
    return True


def mark_all_notifications_read(event):
    user_id = caller_id(event)
    now = now_iso()
    for item in query_all(
        notifications,
        IndexName=NOTIFICATIONS_BY_USER_INDEX,
        KeyConditionExpression=Key("userId").eq(user_id),
    ):
        if item.get("inApp", True) and not item.get("readAt"):
            notifications.update_item(
                Key={"id": item["id"]},
                UpdateExpression="SET readAt = :now, updatedAt = :now",
                ConditionExpression="userId = :user",
                ExpressionAttributeValues={":now": now, ":user": user_id},
            )
    return True


def dispatch_recent_updates():
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(minutes=7)).isoformat(timespec="milliseconds").replace("+00:00", "Z")

    for announcement in scan_all(announcements):
        if announcement.get("createdAt", "") >= cutoff:
            fan_out_club_update(
                announcement,
                kind="announcement",
                title=announcement.get("title") or "New club announcement",
                body=announcement.get("body") or "Your club posted a new announcement.",
                in_app_key="inAppAnnouncements",
                email_key="emailAnnouncements",
                target=f"/clubs/{announcement['clubId']}?announcement={announcement['id']}",
                source_version=announcement.get("createdAt", ""),
            )

    for item in scan_all(events):
        created_at = parse_time(item.get("createdAt"))
        updated_at = parse_time(item.get("updatedAt"))
        if not created_at:
            continue

        if created_at >= now - timedelta(minutes=7):
            fan_out_club_update(
                item,
                kind="event",
                title="New club event",
                body=item.get("title") or "Your club posted a new event.",
                in_app_key="inAppEvents",
                email_key="emailEvents",
                target=f"/clubs/{item['clubId']}?event={item['id']}",
                source_version=item.get("createdAt", ""),
            )
        elif updated_at and updated_at >= now - timedelta(minutes=7) and updated_at > created_at + timedelta(seconds=2):
            if item.get("status") == "cancelled":
                kind = "event_cancelled"
                title = "Event cancelled"
                body = item.get("title") or "A club event was cancelled."
            else:
                kind = "event_updated"
                title = "Event details changed"
                body = item.get("title") or "A club event was updated."
            fan_out_club_update(
                item,
                kind=kind,
                title=title,
                body=body,
                in_app_key="inAppEvents",
                email_key="emailEvents",
                target=f"/clubs/{item['clubId']}?event={item['id']}",
                source_version=item.get("updatedAt", ""),
            )


def dispatch_event_reminders():
    now = datetime.now(timezone.utc)
    start = now + timedelta(hours=23, minutes=55)
    end = now + timedelta(hours=24, minutes=5)
    for event in scan_all(events):
        if event.get("status") == "cancelled":
            continue
        starts_at = parse_time(event.get("startsAt"))
        if not starts_at or not start <= starts_at <= end:
            continue

        for rsvp in query_all(
            rsvps,
            IndexName=RSVPS_BY_EVENT_INDEX,
            KeyConditionExpression=Key("eventId").eq(event["id"]),
        ):
            user_id = owner_sub(rsvp.get("owner"))
            if not user_id:
                continue
            club_name = club_name_for(event.get("clubId"))
            create_user_notification(
                user_id=user_id,
                resource={**event, "_clubName": club_name},
                kind="event_reminder",
                title="Event tomorrow",
                body=f"{event.get('title', 'Your event')} from {club_name} starts in about a day.",
                target=f"/clubs/{event['clubId']}?event={event['id']}",
                source_version="24-hours-before",
                in_app_key="inAppReminders",
                email_key="emailReminders",
            )


def fan_out_club_update(resource, *, kind, title, body, in_app_key, email_key, target, source_version):
    club_id = resource.get("clubId")
    if not club_id:
        return
    resource = {**resource, "_clubName": club_name_for(club_id)}
    recipient_ids = {
        owner_sub(member.get("owner"))
        for member in query_all(
            memberships,
            IndexName=MEMBERS_BY_CLUB_INDEX,
            KeyConditionExpression=Key("clubId").eq(club_id),
        )
    }
    recipient_ids.update(
        role.get("userId")
        for role in query_all(
            club_roles,
            KeyConditionExpression=Key("clubId").eq(club_id),
        )
    )
    for user_id in recipient_ids:
        if user_id:
            create_user_notification(
                user_id=user_id,
                resource=resource,
                kind=kind,
                title=title,
                body=body,
                target=target,
                source_version=source_version,
                in_app_key=in_app_key,
                email_key=email_key,
            )


def create_user_notification(*, user_id, resource, kind, title, body, target, source_version, in_app_key, email_key):
    preference = preferences.get_item(Key={"userId": user_id}).get("Item") or {}
    in_app = preference.get(in_app_key, True)
    send_email = bool(preference.get(email_key, False)) and bool(preference.get("email"))
    browser_alert = bool(preference.get("browserAlerts", False))
    keep_for_digest = bool(preference.get("weeklyDigest", False)) and bool(preference.get("email"))
    if not in_app and not send_email and not keep_for_digest and not browser_alert:
        return

    event_id = resource.get("id") or resource.get("eventId")
    digest = hashlib.sha256(f"{user_id}:{kind}:{event_id}:{source_version}".encode()).hexdigest()
    now = now_iso()
    item = {
        "id": digest,
        "__typename": "Notification",
        "userId": user_id,
        "kind": kind,
        "title": title[:160],
        "body": body[:500],
        "clubId": resource["clubId"],
        "clubName": resource.get("_clubName") or resource.get("clubName") or club_name_for(resource["clubId"]),
        "resourceId": event_id,
        "target": target,
        "occurredAt": now,
        "createdAt": now,
        "updatedAt": now,
        "inApp": bool(in_app),
        "emailAttempts": 0,
    }
    if send_email:
        item["emailStatus"] = "pending"

    try:
        notifications.put_item(Item=item, ConditionExpression="attribute_not_exists(id)")
    except ClientError as error:
        if error.response["Error"]["Code"] != "ConditionalCheckFailedException":
            raise


def send_weekly_digests():
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=7)
    for preference in scan_all(preferences):
        email = preference.get("email")
        if not preference.get("weeklyDigest") or not email:
            continue
        last_digest = parse_time(preference.get("lastDigestAt"))
        if last_digest and last_digest > now - timedelta(days=6, hours=23):
            continue

        user_id = preference.get("userId")
        if not user_id:
            continue
        recent = [
            item for item in query_all(
                notifications,
                IndexName=NOTIFICATIONS_BY_USER_INDEX,
                KeyConditionExpression=Key("userId").eq(user_id) & Key("occurredAt").gte(
                    cutoff.isoformat(timespec="milliseconds").replace("+00:00", "Z")
                ),
            )
        ]
        if not recent:
            continue
        recent.sort(key=lambda item: item.get("occurredAt", ""), reverse=True)
        lines = [f"• {item.get('title', 'Club update')}: {item.get('body', '')}" for item in recent[:25]]
        if send_email_message(email, "Your weekly club updates", "\n".join(lines), "/notifications"):
            preferences.update_item(
                Key={"userId": user_id},
                UpdateExpression="SET lastDigestAt = :now, updatedAt = :now",
                ExpressionAttributeValues={":now": now_iso()},
            )


def retry_pending_emails():
    if not SES_FROM_EMAIL:
        return
    for item in query_all(
        notifications,
        IndexName=NOTIFICATIONS_BY_EMAIL_STATUS_INDEX,
        KeyConditionExpression=Key("emailStatus").eq("pending"),
    ):
        preference = preferences.get_item(Key={"userId": item.get("userId")}).get("Item") or {}
        email = preference.get("email")
        email_key = {
            "announcement": "emailAnnouncements",
            "event": "emailEvents",
            "event_updated": "emailEvents",
            "event_cancelled": "emailEvents",
            "event_reminder": "emailReminders",
        }.get(item.get("kind"))
        if not email or not email_key or not preference.get(email_key):
            notifications.update_item(
                Key={"id": item["id"]},
                UpdateExpression="REMOVE emailStatus",
            )
            continue
        sent = send_email_message(email, item.get("title", "Club update"), item.get("body", ""), item.get("target", "/notifications"))
        attempts = int(item.get("emailAttempts", 0)) + 1
        if sent:
            status = "sent"
        elif attempts >= 6:
            status = "failed"
        else:
            status = "pending"
        notifications.update_item(
            Key={"id": item["id"]},
            UpdateExpression="SET emailStatus = :status, emailAttempts = :attempts, updatedAt = :now",
            ExpressionAttributeValues={":status": status, ":attempts": attempts, ":now": now_iso()},
        )


def send_email_message(to, subject, body, target):
    if not SES_FROM_EMAIL:
        logger.info("SES_FROM_EMAIL is unset; skipped email to %s", to)
        return False
    base_url = os.environ.get("APP_BASE_URL", "").rstrip("/")
    link = f"{base_url}{target}" if base_url else target
    try:
        ses.send_email(
            Source=SES_FROM_EMAIL,
            Destination={"ToAddresses": [to]},
            Message={
                "Subject": {"Data": subject[:160], "Charset": "UTF-8"},
                "Body": {"Text": {"Data": f"{body}\n\nOpen the app: {link}", "Charset": "UTF-8"}},
            },
        )
        return True
    except ClientError:
        logger.exception("SES could not send a notification email")
        return False


def caller_id(event):
    identity = event.get("identity") or {}
    user_id = identity.get("sub") or (identity.get("claims") or {}).get("sub")
    if not user_id:
        raise Exception("You need to be signed in.")
    return user_id


def owner_sub(owner):
    return (owner or "").split("::", 1)[0]


def club_name_for(club_id):
    if not club_id:
        return "your club"
    club = clubs.get_item(Key={"id": club_id}).get("Item") or {}
    return club.get("name") or "your club"


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def parse_time(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (AttributeError, TypeError, ValueError):
        return None


def query_all(table, **kwargs):
    items = []
    while True:
        response = table.query(**kwargs)
        items.extend(response.get("Items", []))
        if "LastEvaluatedKey" not in response:
            return items
        kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]


def scan_all(table, **kwargs):
    items = []
    while True:
        response = table.scan(**kwargs)
        items.extend(response.get("Items", []))
        if "LastEvaluatedKey" not in response:
            return items
        kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
