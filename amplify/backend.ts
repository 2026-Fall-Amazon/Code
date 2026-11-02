
import { defineBackend } from '@aws-amplify/backend';
import { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction as LambdaTarget, RuleTargetInput } from 'aws-cdk-lib/aws-events-targets';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { pythonTemplate } from './functions/python-template/resource';
import { discover } from './functions/discover/resource';
import { stats } from './functions/stats/resource';
import { notifications } from './functions/notifications/resource';

// Register all existing AWS resources
const backend = defineBackend({
  auth,
  data,
  storage,
  pythonTemplate,
  discover,
  stats,
  notifications,
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

// Stats Lambda: read-only member and RSVP counts
// ---------------------------------------------------------------

const statsLambda = backend.stats.resources.lambda as LambdaFunction;

tables['Membership'].grantReadData(statsLambda);
tables['RSVP'].grantReadData(statsLambda);

statsLambda.addEnvironment('MEMBERSHIP_TABLE_NAME', tables['Membership'].tableName);
statsLambda.addEnvironment('RSVP_TABLE_NAME', tables['RSVP'].tableName);

// Notifications: fan out new club updates and RSVP reminders
// ---------------------------------------------------------------

const notificationLambda = backend.notifications.resources.lambda as LambdaFunction;
const notificationTables = backend.data.resources.tables;

for (const model of ['Notification', 'NotificationPreference']) {
  notificationTables[model].grantReadWriteData(notificationLambda);
}
for (const model of ['Announcement', 'Event', 'Membership', 'ClubRole', 'Club', 'RSVP']) {
  notificationTables[model].grantReadData(notificationLambda);
}

notificationLambda.addEnvironment('NOTIFICATION_TABLE_NAME', notificationTables['Notification'].tableName);
notificationLambda.addEnvironment('PREFERENCE_TABLE_NAME', notificationTables['NotificationPreference'].tableName);
notificationLambda.addEnvironment('ANNOUNCEMENT_TABLE_NAME', notificationTables['Announcement'].tableName);
notificationLambda.addEnvironment('EVENT_TABLE_NAME', notificationTables['Event'].tableName);
notificationLambda.addEnvironment('MEMBERSHIP_TABLE_NAME', notificationTables['Membership'].tableName);
notificationLambda.addEnvironment('CLUB_ROLE_TABLE_NAME', notificationTables['ClubRole'].tableName);
notificationLambda.addEnvironment('CLUB_TABLE_NAME', notificationTables['Club'].tableName);
notificationLambda.addEnvironment('RSVP_TABLE_NAME', notificationTables['RSVP'].tableName);
notificationLambda.addEnvironment('SES_FROM_EMAIL', process.env.SES_FROM_EMAIL ?? '');
notificationLambda.addEnvironment('APP_BASE_URL', process.env.APP_BASE_URL ?? '');
notificationLambda.addToRolePolicy(new PolicyStatement({
  actions: ['ses:SendEmail'],
  resources: ['*'],
}));

// Polling keeps this MVP compatible with Amplify's generated model writes.
// Deterministic notification IDs make retries and overlapping windows safe.
new Rule(notificationLambda, 'ProcessClubNotificationsEveryFiveMinutes', {
  schedule: Schedule.rate(Duration.minutes(5)),
}).addTarget(new LambdaTarget(notificationLambda, {
  event: RuleTargetInput.fromObject({ job: 'dispatch' }),
}));

new Rule(notificationLambda, 'SendWeeklyNotificationDigests', {
  schedule: Schedule.cron({ minute: '0', hour: '13', weekDay: 'SUN' }),
}).addTarget(new LambdaTarget(notificationLambda, {
  event: RuleTargetInput.fromObject({ job: 'digest' }),
}));
