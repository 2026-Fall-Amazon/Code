
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>({
  authMode: 'userPool',
});

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
