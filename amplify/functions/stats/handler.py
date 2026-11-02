import os

import boto3
from boto3.dynamodb.conditions import Key

# At most this many ids per request, to keep each call fast and cheap
MAX_IDS = 100

# Table names are passed in by backend.ts
dynamodb = boto3.resource("dynamodb")
membership_table = dynamodb.Table(os.environ["MEMBERSHIP_TABLE_NAME"])
rsvp_table = dynamodb.Table(os.environ["RSVP_TABLE_NAME"])

# Default index names Amplify gives the clubId / eventId indexes
MEMBERSHIP_BY_CLUB_INDEX = "membershipsByClubId"
RSVP_BY_EVENT_INDEX = "rSVPSByEventId"


def lambda_handler(event, context):
    """
    Count members per club or RSVPs per event.

    Input (from AppSync):
        event["fieldName"]  "clubMemberCounts" or "eventRsvpCounts"
        event["arguments"]  {"clubIds": [...]} or {"eventIds": [...]}

    Returns:
        [{"id": ..., "count": ...}] in the same order as the ids
    """

    field = event.get("fieldName")
    args = event.get("arguments") or {}

    if field == "clubMemberCounts":
        return count_each(args.get("clubIds"), membership_table, MEMBERSHIP_BY_CLUB_INDEX, "clubId")
    if field == "eventRsvpCounts":
        return count_each(args.get("eventIds"), rsvp_table, RSVP_BY_EVENT_INDEX, "eventId")

    raise Exception(f"Unknown operation: {field}")


def count_each(ids, table, index_name, key_name):
    ids = list(dict.fromkeys(ids or []))  # drop repeats, keep order
    if len(ids) > MAX_IDS:
        raise Exception(f"Ask for at most {MAX_IDS} ids at a time.")

    return [{"id": item_id, "count": count_people(table, index_name, key_name, item_id)} for item_id in ids]


def count_people(table, index_name, key_name, item_id):
    """Count distinct owners, so a duplicate join or RSVP counts once."""
    owners = set()
    kwargs = {
        "IndexName": index_name,
        "KeyConditionExpression": Key(key_name).eq(item_id),
        "ProjectionExpression": "#o",
        "ExpressionAttributeNames": {"#o": "owner"},
    }
    while True:
        response = table.query(**kwargs)
        for item in response.get("Items", []):
            # Amplify stores owners as "<sub>::<username>"; the sub identifies the person
            owners.add((item.get("owner") or "").split("::")[0])
        if "LastEvaluatedKey" not in response:
            return len(owners - {""})
        kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
