
import { defineBackend } from '@aws-amplify/backend';
import { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { pythonTemplate } from './functions/python-template/resource';
import { discover } from './functions/discover/resource';

// Register all existing AWS resources
const backend = defineBackend({
  auth,
  data,
  storage,
  pythonTemplate,
  discover,
});

// Get the existing DynamoDB Club table
const clubTable = backend.data.resources.tables['Club'];

// Get the existing Python Lambda function
const lambda = backend.pythonTemplate.resources.lambda;

// Give Lambda read-only access to the Club table
clubTable.grantReadData(lambda);

// Pass the physical DynamoDB table name to Lambda
(lambda as LambdaFunction).addEnvironment(
  'CLUB_TABLE_NAME',
  clubTable.tableName
);

// ---------------------------------------------------------------
// Discover Lambda: posts, likes, and posting roles
// ---------------------------------------------------------------

const discoverLambda = backend.discover.resources.lambda as LambdaFunction;
const tables = backend.data.resources.tables;

// Read/write on the Discover tables
tables['Post'].grantReadWriteData(discoverLambda);
tables['PostLike'].grantReadWriteData(discoverLambda);
tables['ClubRole'].grantReadWriteData(discoverLambda);

// Read-only: member lists and display names
tables['Membership'].grantReadData(discoverLambda);
tables['UserProfile'].grantReadData(discoverLambda);

// Delete a post's images when the post is deleted
backend.storage.resources.bucket.grantDelete(discoverLambda, 'post-images/*');

discoverLambda.addEnvironment('POST_TABLE_NAME', tables['Post'].tableName);
discoverLambda.addEnvironment('POST_LIKE_TABLE_NAME', tables['PostLike'].tableName);
discoverLambda.addEnvironment('CLUB_ROLE_TABLE_NAME', tables['ClubRole'].tableName);
discoverLambda.addEnvironment('MEMBERSHIP_TABLE_NAME', tables['Membership'].tableName);
discoverLambda.addEnvironment('USER_PROFILE_TABLE_NAME', tables['UserProfile'].tableName);
discoverLambda.addEnvironment('STORAGE_BUCKET_NAME', backend.storage.resources.bucket.bucketName);
