import { defineFunction } from '@aws-amplify/backend'
import { Duration } from 'aws-cdk-lib'
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const functionDir = path.dirname(fileURLToPath(import.meta.url))

// Scheduled delivery and the two read-state mutations share one handler.
// Table access and EventBridge schedules are attached in amplify/backend.ts.
export const notifications = defineFunction(
  (scope) => {
    const logGroup = new LogGroup(scope, 'NotificationsLogs', {
      retention: RetentionDays.ONE_WEEK,
    })

    return new Function(scope, 'Notifications', {
      runtime: Runtime.PYTHON_3_13,
      handler: 'handler.lambda_handler',
      code: Code.fromAsset(functionDir),
      memorySize: 256,
      timeout: Duration.seconds(60),
      logGroup,
    })
  },
  { resourceGroupName: 'data' },
)
