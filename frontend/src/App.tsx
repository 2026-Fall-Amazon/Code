
import { useAuthenticator } from '@aws-amplify/ui-react';

export default function App() {
  const { user, signOut } = useAuthenticator();

  return (
    <main style={{ padding: '2rem' }}>
      <h1>SIBC Club Platform</h1>
      <p>Signed in as: {user?.username}</p>
      <button onClick={signOut}>Sign Out</button>
    </main>
  );
}
