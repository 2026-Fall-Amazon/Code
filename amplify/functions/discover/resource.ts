import { defineFunction } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const functionDir = path.dirname(fileURLToPath(import.meta.url));

// Handles every Discover mutation and the leaders' member list.
// Table names and permissions are added in backend.ts.
export const discover = defineFunction(
  (scope) => {
    const logGroup = new LogGroup(scope, 'DiscoverLogs', {
      retention: RetentionDays.ONE_WEEK,
    });

    return new Function(scope, 'Discover', {
      runtime: Runtime.PYTHON_3_13,
      handler: 'handler.lambda_handler',
      code: Code.fromAsset(functionDir),
      memorySize: 256,
      timeout: Duration.seconds(10),
      logGroup,
    });
  },
  {
    resourceGroupName: 'data',
  }
);
