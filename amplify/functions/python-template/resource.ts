
import { defineFunction } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const functionDir = path.dirname(fileURLToPath(import.meta.url));

export const pythonTemplate = defineFunction(
  (scope) => {
    const logGroup = new LogGroup(scope, 'PythonTemplateLogs', {
      retention: RetentionDays.ONE_WEEK,
    });

    return new Function(scope, 'PythonTemplate', {
      runtime: Runtime.PYTHON_3_13,
      handler: 'handler.lambda_handler',
      code: Code.fromAsset(functionDir),
      memorySize: 128,
      timeout: Duration.seconds(5),
      logGroup,
    });
  },
  {
    resourceGroupName: 'data',
  }
);
