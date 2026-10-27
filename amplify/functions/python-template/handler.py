
import os
import boto3

# AWS SDK for DynamoDB
dynamodb = boto3.resource("dynamodb")

# Get the table name provided by CDK
TABLE_NAME = os.environ["CLUB_TABLE_NAME"]

# Reference the DynamoDB table
club_table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, context):
    """
    Retrieve a club from DynamoDB using its ID.

    Input:
        event["arguments"]["clubId"]

    Returns:
        ClubSummary dictionary or None
    """

    # Extract the club ID from AppSync
    club_id = event["arguments"]["clubId"]

    # Retrieve the record using its primary key
    response = club_table.get_item(
        Key={
            "id": club_id
        }
    )

    # Extract the returned item
    club = response.get("Item")

    # Handle nonexistent clubs
    if club is None:
        return None

    # Return data matching ClubSummary
    return {
        "id": club["id"],
        "name": club["name"],
        "description": club.get("description")
    }
