
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { pythonTemplate } from './functions/python-template/resource';

defineBackend({
  auth,
  data,
  storage,
  pythonTemplate,
});
