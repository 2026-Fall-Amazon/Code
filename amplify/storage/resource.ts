
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
  }),
});
