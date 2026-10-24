
import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({

  // Student profile
  UserProfile: a.model({
    displayName: a.string().required(),
    major: a.string(),
    graduationYear: a.integer(),
    interests: a.string().array(),
    owner: a.string().authorization(allow => [
      allow.owner().to(['read', 'delete'])
    ]),
  })
  .authorization(allow => [
    allow.owner()
  ]),

  // Student organizations
  Club: a.model({
    name: a.string().required(),
    description: a.string(),
    category: a.string(),
    website: a.url(),
    meetingLocation: a.string(),
  })
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.group('ADMINS')
  ]),

  // Student-club membership
  Membership: a.model({
    clubId: a.id().required(),
  })
  .secondaryIndexes(index => [
    index('clubId')
  ])
  .authorization(allow => [
    allow.owner().to(['create', 'read', 'delete']),
    allow.group('ADMINS').to(['read', 'delete'])
  ]),

  // Club events
  Event: a.model({
    clubId: a.id().required(),
    title: a.string().required(),
    description: a.string(),
    startsAt: a.datetime().required(),
    endsAt: a.datetime(),
    location: a.string(),
    capacity: a.integer(),
  })
  .secondaryIndexes(index => [
    index('clubId').sortKeys(['startsAt'])
  ])
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.group('ADMINS')
  ]),

  // Event registrations
  RSVP: a.model({
    eventId: a.id().required(),
  })
  .secondaryIndexes(index => [
    index('eventId')
  ])
  .authorization(allow => [
    allow.owner().to(['create', 'read', 'delete']),
    allow.group('ADMINS').to(['read', 'delete'])
  ]),

  // Club announcements
  Announcement: a.model({
    clubId: a.id().required(),
    title: a.string().required(),
    body: a.string().required(),
    publishedAt: a.datetime(),
  })
  .secondaryIndexes(index => [
    index('clubId')
  ])
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.group('ADMINS')
  ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
