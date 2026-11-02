
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },

  // Collected on the sign-up form so a new account already has a name.
  // Optional on purpose: Cognito does not allow changing *required* attributes
  // on a user pool that already has users, and that change can replace the pool
  // and delete every existing account.
  userAttributes: {
    fullname: {
      required: false,
      mutable: true,
    },
  },

  groups: ['ADMINS'],
});