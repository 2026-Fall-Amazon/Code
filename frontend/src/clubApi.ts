
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Create typed AppSync client
const client = generateClient<Schema>({
  authMode: 'userPool',
});

// Call Python Lambda through AppSync
export async function fetchClub(clubId: string) {
  const { data, errors } =
    await client.queries.getClubFromPython({
      clubId,
    });

  if (errors?.length) {
    throw new Error(
      errors.map(error => error.message).join('; ')
    );
  }

  return data;
}
