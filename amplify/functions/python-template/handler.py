
import os
import boto3

# Initialize DynamoDB connection
dynamodb = boto3.resource("dynamodb")

# Table name is provided by Amplify/CDK
club_table = dynamodb.Table(
    os.environ["CLUB_TABLE_NAME"]
)


def lambda_handler(event, context):
    """
    Retrieve a club from DynamoDB.

    Input:
        event["arguments"]["clubId"]

    Output:
        ClubSummary object or None
    """

    # Get club ID from AppSync request
    club_id = event["arguments"]["clubId"]

    # Query DynamoDB
    response = club_table.get_item(
        Key={"id": club_id}
    )

    # Extract club record
    club = response.get("Item")

    # Return null if club does not exist
    if club is None:
        return None

    # Return data matching GraphQL ClubSummary
    return {
        "id": club["id"],
        "name": club["name"],
        "description": club.get("description")
    }
