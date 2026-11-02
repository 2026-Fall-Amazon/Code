// Data calls for the Profile feature.
// Reads and writes the UserProfile model from amplify/data/resource.ts.
// The model's owner rule means each signed-in user can only see their own record.
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../../amplify/data/resource'

const client = generateClient<Schema>({ authMode: 'userPool' })

// What the form edits and what we save.
export type ProfileInput = {
  displayName: string
  major?: string
  graduationYear?: number
  interests: string[]
}

// A profile that already exists in the database (it has an id).
// createdAt is set by AppSync, so it only exists on saved records.
export type SavedProfile = ProfileInput & { id: string; createdAt?: string }

// Amplify returns errors in a list instead of throwing. Turn them into a normal error.
function throwIfErrors(errors?: { message: string }[]) {
  if (errors?.length) {
    throw new Error(errors.map((error) => error.message).join('; '))
  }
}

// Returns the signed-in user's profile, or null if they have not created one yet.
export async function getMyProfile(): Promise<SavedProfile | null> {
  const { data, errors } = await client.models.UserProfile.list()
  throwIfErrors(errors)

  const profile = data[0]
  if (!profile) return null

  return {
    id: profile.id,
    displayName: profile.displayName,
    major: profile.major ?? undefined,
    graduationYear: profile.graduationYear ?? undefined,
    interests: (profile.interests ?? []).filter((interest): interest is string => interest !== null),
    createdAt: profile.createdAt ?? undefined,
  }
}

// Creates the profile if existingId is not given, otherwise updates it.
export async function saveMyProfile(input: ProfileInput, existingId?: string): Promise<SavedProfile> {
  // null clears a field in the database. undefined would leave the old value in place.
  const fields = {
    displayName: input.displayName,
    major: input.major ?? null,
    graduationYear: input.graduationYear ?? null,
    interests: input.interests,
  }

  const { data, errors } = existingId
    ? await client.models.UserProfile.update({ id: existingId, ...fields })
    : await client.models.UserProfile.create(fields)
  throwIfErrors(errors)

  if (!data) throw new Error('The profile was not saved. Please try again.')

  return {
    id: data.id,
    displayName: data.displayName,
    major: data.major ?? undefined,
    graduationYear: data.graduationYear ?? undefined,
    interests: (data.interests ?? []).filter((interest): interest is string => interest !== null),
    createdAt: data.createdAt ?? undefined,
  }
}
