
import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'sibcClubFiles',

  access: (allow) => ({
    'club-assets/*': [
      allow.authenticated.to(['read']),
      allow.groups(['ADMINS']).to([
        'read', 'write', 'delete'
      ]),
    ],

    'admin-documents/*': [
      allow.groups(['ADMINS']).to([
        'read', 'write', 'delete'
      ]),
    ],

    // Discover post images. Each user uploads only to their own folder;
    // the discover Lambda checks posting rights and deletes images with posts.
    'post-images/{entity_id}/*': [
      allow.entity('identity').to([
        'read', 'write', 'delete'
      ]),
      allow.authenticated.to(['read']),
    ],

    // Profile pictures. Each user writes only to their own folder;
    // everyone signed in can see them.
    'profile-pictures/{entity_id}/*': [
      allow.entity('identity').to([
        'read', 'write', 'delete'
      ]),
      allow.authenticated.to(['read']),
    ],
  }),
});
