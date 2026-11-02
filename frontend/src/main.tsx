import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { BrowserRouter } from 'react-router';

import outputs from '../amplify_outputs.json';
import App from './App.tsx';
import { ProfileGate } from './features/profile/ProfileGate.tsx';
import './index.css';

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Authenticator.Provider>
      {/* signUpAttributes adds a Name box to the sign-up form; formFields puts it
          first. The name is stored on the Cognito user, and the Profile feature
          copies it into UserProfile. */}
      <Authenticator
        signUpAttributes={['name']}
        formFields={{
          signUp: {
            name: { order: 1, label: 'Name', placeholder: 'Your full name', isRequired: true },
            email: { order: 2 },
            password: { order: 3 },
            confirm_password: { order: 4 },
          },
        }}
      >
        {/* Blocks the app until the signed-in user has a UserProfile record,
            so no page renders with a missing name or interests. */}
        <ProfileGate>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ProfileGate>
      </Authenticator>
    </Authenticator.Provider>
  </React.StrictMode>
);
