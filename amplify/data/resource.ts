
import {
  a,
  defineData,
  type ClientSchema,
} from '@aws-amplify/backend';

import { pythonTemplate } from '../functions/python-template/resource';
import { discover } from '../functions/discover/resource';

const schema = a.schema({

  // Student profiles
  UserProfile: a.model({
    displayName: a.string().required(),
    major: a.string(),
    graduationYear: a.integer(),
    interests: a.string().array(),
    bio: a.string(),
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

  // Student-club memberships
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

  // Data structure returned by Python Lambda
  ClubSummary: a.customType({
    id: a.id().required(),
    name: a.string().required(),
    description: a.string(),
  }),

  // AppSync query connected to Python Lambda
  getClubFromPython: a.query()
    .arguments({
      clubId: a.id().required(),
    })
    .returns(a.ref('ClubSummary'))
    .authorization(allow => [
      allow.authenticated()
    ])
    .handler(a.handler.function(pythonTemplate)),

  // ---------------------------------------------------------------
  // Discover feed
  // Posts, likes, and posting roles. Only the `discover` Lambda writes
  // these (it checks permissions); ADMINS can also manage them directly.
  // ---------------------------------------------------------------

  // Who can post for a club. ADMINS assign leaders; leaders assign posters.
  // userId is the Cognito user's sub.
  ClubRole: a.model({
    clubId: a.id().required(),
    userId: a.string().required(),
    role: a.enum(['leader', 'poster']),
  })
  .identifier(['clubId', 'userId'])
  .secondaryIndexes(index => [
    index('userId').name('byUser'),
  ])
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.group('ADMINS'),
  ]),

  // Club posts: text and up to 4 images (S3 keys under post-images/).
  // feed is always "ALL" so the whole feed can be read newest-first from one index.
  Post: a.model({
    clubId: a.id().required(),
    authorId: a.string().required(),
    authorName: a.string(),
    body: a.string(),
    imageKeys: a.string().array(),
    likeCount: a.integer().default(0),
    postedAt: a.datetime().required(),
    editedAt: a.datetime(),
    feed: a.string().required(),
  })
  .secondaryIndexes(index => [
    index('clubId').sortKeys(['postedAt']).name('byClub').queryField('listPostsByClub'),
    index('feed').sortKeys(['postedAt']).name('byFeed').queryField('listPostsInFeed'),
  ])
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.group('ADMINS'),
  ]),

  // One record per user per liked post.
  PostLike: a.model({
    postId: a.id().required(),
    userId: a.string().required(),
  })
  .identifier(['postId', 'userId'])
  .secondaryIndexes(index => [
    index('userId').name('byUser'),
  ])
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.group('ADMINS'),
  ]),

  LikeResult: a.customType({
    postId: a.id().required(),
    liked: a.boolean().required(),
    likeCount: a.integer().required(),
  }),

  ClubMemberInfo: a.customType({
    userId: a.string().required(),
    name: a.string().required(),
    role: a.string(), // "leader", "poster", or null for regular members
  }),

  createPost: a.mutation()
    .arguments({
      clubId: a.id().required(),
      body: a.string(),
      imageKeys: a.string().array(),
    })
    .returns(a.ref('Post'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(discover)),

  updatePost: a.mutation()
    .arguments({
      postId: a.id().required(),
      body: a.string(),
    })
    .returns(a.ref('Post'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(discover)),

  deletePost: a.mutation()
    .arguments({
      postId: a.id().required(),
    })
    .returns(a.id())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(discover)),

  toggleLike: a.mutation()
    .arguments({
      postId: a.id().required(),
    })
    .returns(a.ref('LikeResult'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(discover)),

  setPostingAccess: a.mutation()
    .arguments({
      clubId: a.id().required(),
      userId: a.string().required(),
      canPost: a.boolean().required(),
    })
    .returns(a.boolean())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(discover)),

  listClubMembers: a.query()
    .arguments({
      clubId: a.id().required(),
    })
    .returns(a.ref('ClubMemberInfo').array())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(discover)),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
