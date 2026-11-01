import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr, Key
from botocore.exceptions import ClientError

# Limits shared with the frontend (features/discover/feedStore.ts)
MAX_BODY_LENGTH = 2000
MAX_IMAGES = 4
IMAGE_PREFIX = "post-images/"

# Table and bucket names are passed in by backend.ts
dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

post_table = dynamodb.Table(os.environ["POST_TABLE_NAME"])
post_like_table = dynamodb.Table(os.environ["POST_LIKE_TABLE_NAME"])
club_role_table = dynamodb.Table(os.environ["CLUB_ROLE_TABLE_NAME"])
membership_table = dynamodb.Table(os.environ["MEMBERSHIP_TABLE_NAME"])
user_profile_table = dynamodb.Table(os.environ["USER_PROFILE_TABLE_NAME"])
BUCKET_NAME = os.environ["STORAGE_BUCKET_NAME"]

# Default index name Amplify gives Membership's clubId index
MEMBERSHIP_BY_CLUB_INDEX = "membershipsByClubId"


def lambda_handler(event, context):
    """
    Entry point for every Discover query and mutation.

    Input (from AppSync):
        event["fieldName"]  which operation was called
        event["arguments"]  the operation's arguments
        event["identity"]   the signed-in caller (sub, groups, claims)

    Raising an exception returns its message to the app as a GraphQL error.
    """

    handlers = {
        "createPost": create_post,
        "updatePost": update_post,
        "deletePost": delete_post,
        "toggleLike": toggle_like,
        "setPostingAccess": set_posting_access,
        "listClubMembers": list_club_members,
    }

    handler = handlers.get(event.get("fieldName"))
    if handler is None:
        raise Exception(f"Unknown operation: {event.get('fieldName')}")

    caller = Caller(event.get("identity") or {})
    return to_json(handler(caller, event.get("arguments") or {}))


# ------------------------------------------------------------------
# Operations
# ------------------------------------------------------------------

def create_post(caller, args):
    club_id = args["clubId"]
    body = clean_body(args.get("body"))
    image_keys = clean_image_keys(args.get("imageKeys"))

    if role_of(club_id, caller.sub) is None:
        raise Exception("You can't post for this club.")
    if not body and not image_keys:
        raise Exception("Write something or add an image.")

    now = now_iso()
    post = {
        "id": str(uuid.uuid4()),
        "__typename": "Post",
        "clubId": club_id,
        "authorId": caller.sub,
        "authorName": display_name(caller),
        "body": body,
        "imageKeys": image_keys,
        "likeCount": 0,
        "postedAt": now,
        "feed": "ALL",
        "createdAt": now,
        "updatedAt": now,
    }
    post_table.put_item(Item=post)
    return post


def update_post(caller, args):
    post = get_post(args["postId"])
    require_can_modify(caller, post)

    body = clean_body(args.get("body"))
    if not body and not post.get("imageKeys"):
        raise Exception("A post needs text or an image.")

    now = now_iso()
    response = post_table.update_item(
        Key={"id": post["id"]},
        UpdateExpression="SET #body = :body, editedAt = :now, updatedAt = :now",
        ConditionExpression="attribute_exists(#id)",
        ExpressionAttributeNames={"#body": "body", "#id": "id"},
        ExpressionAttributeValues={":body": body, ":now": now},
        ReturnValues="ALL_NEW",
    )
    return response["Attributes"]


def delete_post(caller, args):
    post = get_post(args["postId"])
    if not caller.is_admin:
        require_can_modify(caller, post)

    post_table.delete_item(Key={"id": post["id"]})

    # Clean up the post's likes and images
    likes = query_all(
        post_like_table,
        KeyConditionExpression=Key("postId").eq(post["id"]),
        ProjectionExpression="postId, userId",
    )
    with post_like_table.batch_writer() as batch:
        for like in likes:
            batch.delete_item(Key={"postId": like["postId"], "userId": like["userId"]})

    image_keys = [k for k in post.get("imageKeys") or [] if is_post_image_key(k)]
    if image_keys:
        s3.delete_objects(
            Bucket=BUCKET_NAME,
            Delete={"Objects": [{"Key": k} for k in image_keys], "Quiet": True},
        )

    return post["id"]


def toggle_like(caller, args):
    post_id = args["postId"]
    like_key = {"postId": post_id, "userId": caller.sub}
    already_liked = "Item" in post_like_table.get_item(
        Key={"postId": post_id, "userId": caller.sub}
    )

    # The like record and the post's count change together, or not at all.
    # (This client takes plain Python values; boto3 converts them for DynamoDB.)
    if already_liked:
        like_op = {
            "Delete": {
                "TableName": post_like_table.name,
                "Key": like_key,
                "ConditionExpression": "attribute_exists(postId)",
            }
        }
        delta = -1
    else:
        now = now_iso()
        like_op = {
            "Put": {
                "TableName": post_like_table.name,
                "Item": {
                    **like_key,
                    "__typename": "PostLike",
                    "createdAt": now,
                    "updatedAt": now,
                },
                "ConditionExpression": "attribute_not_exists(postId)",
            }
        }
        delta = 1

    count_op = {
        "Update": {
            "TableName": post_table.name,
            "Key": {"id": post_id},
            "UpdateExpression": "SET likeCount = if_not_exists(likeCount, :zero) + :delta",
            "ConditionExpression": "attribute_exists(#id)",
            "ExpressionAttributeNames": {"#id": "id"},
            "ExpressionAttributeValues": {
                ":zero": 0,
                ":delta": delta,
            },
        }
    }

    try:
        dynamodb.meta.client.transact_write_items(TransactItems=[like_op, count_op])
    except ClientError as error:
        if error.response["Error"]["Code"] == "TransactionCanceledException":
            # Either the post is gone or a double-click raced us
            get_post(post_id)
            raise Exception("Please try again.")
        raise

    like_count = get_post(post_id).get("likeCount", 0)
    return {"postId": post_id, "liked": not already_liked, "likeCount": like_count}


def set_posting_access(caller, args):
    club_id = args["clubId"]
    user_id = args["userId"]
    can_post = args["canPost"]

    if role_of(club_id, caller.sub) != "leader":
        raise Exception("Only club leaders can change who can post.")
    if role_of(club_id, user_id) == "leader":
        raise Exception("Leaders can't be changed here.")

    if can_post:
        if user_id not in member_ids(club_id):
            raise Exception("That person isn't a member of this club.")
        now = now_iso()
        club_role_table.put_item(
            Item={
                "clubId": club_id,
                "userId": user_id,
                "role": "poster",
                "__typename": "ClubRole",
                "createdAt": now,
                "updatedAt": now,
            },
            # Never overwrite a leader, even if one was added in the meantime
            ConditionExpression=Attr("role").not_exists() | Attr("role").ne("leader"),
        )
    else:
        try:
            club_role_table.delete_item(
                Key={"clubId": club_id, "userId": user_id},
                ConditionExpression=Attr("role").eq("poster"),
            )
        except ClientError as error:
            # Already not a poster: nothing to do
            if error.response["Error"]["Code"] != "ConditionalCheckFailedException":
                raise

    return True


def list_club_members(caller, args):
    club_id = args["clubId"]

    if role_of(club_id, caller.sub) != "leader" and not caller.is_admin:
        raise Exception("Only club leaders can see the member list.")

    roles = {
        r["userId"]: r.get("role")
        for r in query_all(club_role_table, KeyConditionExpression=Key("clubId").eq(club_id))
    }
    user_ids = member_ids(club_id) | set(roles)
    names = display_names()

    members = [
        {"userId": uid, "name": names.get(uid, "Club member"), "role": roles.get(uid)}
        for uid in user_ids
    ]
    # Leaders first, then posters, then everyone else, alphabetically
    order = {"leader": 0, "poster": 1}
    members.sort(key=lambda m: (order.get(m["role"], 2), m["name"].lower()))
    return members


# ------------------------------------------------------------------
# Permissions
# ------------------------------------------------------------------

class Caller:
    """The signed-in user, taken from the Cognito token AppSync verified."""

    def __init__(self, identity):
        self.sub = identity.get("sub")
        if not self.sub:
            raise Exception("You need to be signed in.")
        self.groups = identity.get("groups") or []
        self.claims = identity.get("claims") or {}
        self.is_admin = "ADMINS" in self.groups


def role_of(club_id, user_id):
    item = club_role_table.get_item(Key={"clubId": club_id, "userId": user_id}).get("Item")
    return item.get("role") if item else None


def require_can_modify(caller, post):
    """Leaders can change any post in their club. Posters can change their own."""
    role = role_of(post["clubId"], caller.sub)
    if role == "leader":
        return
    if role == "poster" and post.get("authorId") == caller.sub:
        return
    raise Exception("You don't have permission to change this post.")


# ------------------------------------------------------------------
# Lookups
# ------------------------------------------------------------------

def get_post(post_id):
    post = post_table.get_item(Key={"id": post_id}).get("Item")
    if post is None:
        raise Exception("That post no longer exists.")
    return post


def owner_sub(owner):
    """Amplify stores owners as "<sub>::<username>". Return just the sub."""
    return (owner or "").split("::")[0]


def member_ids(club_id):
    memberships = query_all(
        membership_table,
        IndexName=MEMBERSHIP_BY_CLUB_INDEX,
        KeyConditionExpression=Key("clubId").eq(club_id),
    )
    return {owner_sub(m.get("owner")) for m in memberships if m.get("owner")}


def display_names():
    """Map of user sub -> display name from UserProfile.

    UserProfile has no index on owner, so this scans the table.
    Fine for a campus MVP; add an index if it gets large.
    """
    profiles = scan_all(user_profile_table, ProjectionExpression="#o, displayName",
                        ExpressionAttributeNames={"#o": "owner"})
    return {
        owner_sub(p["owner"]): p["displayName"]
        for p in profiles
        if p.get("owner") and p.get("displayName")
    }


def display_name(caller):
    profiles = scan_all(
        user_profile_table,
        FilterExpression=Attr("owner").begins_with(f"{caller.sub}::") | Attr("owner").eq(caller.sub),
        ProjectionExpression="displayName",
    )
    for profile in profiles:
        if profile.get("displayName"):
            return profile["displayName"]
    return caller.claims.get("email") or "Club member"


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def clean_body(body):
    body = (body or "").strip()
    if len(body) > MAX_BODY_LENGTH:
        raise Exception(f"Posts can be up to {MAX_BODY_LENGTH} characters.")
    return body


def is_post_image_key(key):
    return isinstance(key, str) and key.startswith(IMAGE_PREFIX) and ".." not in key


def clean_image_keys(keys):
    keys = [k for k in keys or [] if k]
    if len(keys) > MAX_IMAGES:
        raise Exception(f"You can attach up to {MAX_IMAGES} images.")
    if not all(is_post_image_key(k) for k in keys):
        raise Exception("Images must be uploaded to post-images/.")
    return keys


def now_iso():
    # AppSync AWSDateTime format, e.g. 2026-11-01T18:03:20.123Z
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


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


def to_json(value):
    """DynamoDB returns numbers as Decimal, which Lambda can't serialize."""
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    if isinstance(value, list):
        return [to_json(v) for v in value]
    if isinstance(value, set):
        return [to_json(v) for v in value]
    if isinstance(value, dict):
        return {k: to_json(v) for k, v in value.items()}
    return value
