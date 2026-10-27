
import { defineBackend } from '@aws-amplify/backend';
import { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { pythonTemplate } from './functions/python-template/resource';

// Register AWS resources
const backend = defineBackend({
  auth,
  data,
  storage,
  pythonTemplate,
});

// Reference the existing Club DynamoDB table
const clubTable = backend.data.resources.tables['Club'];

// Reference the existing Python Lambda function
const lambda = backend.pythonTemplate.resources.lambda;

// Grant the Lambda read-only access to Club records
clubTable.grantReadData(lambda);

// Pass the generated DynamoDB table name to Python
(lambda as LambdaFunction).addEnvironment(
  'CLUB_TABLE_NAME',
  clubTable.tableName
);
