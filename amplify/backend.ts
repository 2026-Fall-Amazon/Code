
import { defineBackend } from '@aws-amplify/backend';
import { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { pythonTemplate } from './functions/python-template/resource';

// Register all existing AWS resources
const backend = defineBackend({
  auth,
  data,
  storage,
  pythonTemplate,
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
