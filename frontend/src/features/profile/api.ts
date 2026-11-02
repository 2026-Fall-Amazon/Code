// Data calls for the Profile feature.
// Reads and writes the UserProfile model from amplify/data/resource.ts.
// The model's owner rule means each signed-in user can only see their own record.
//
// SessionProvider calls getMyProfile() once at sign-in, so pages should normally
// read the profile from useCurrentUser() rather than calling this again. After
// saving, call refreshProfile() so the rest of the app picks up the change.
import { client, throwIfErrors } from '../../lib/dataClient'

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

type ProfileRecord = {
  id: string
  displayName: string
  major?: string | null
  graduationYear?: number | null
  interests?: (string | null)[] | null
  createdAt?: string | null
}

function toSavedProfile(record: ProfileRecord): SavedProfile {
  return {
    id: record.id,
    displayName: record.displayName,
    major: record.major ?? undefined,
    graduationYear: record.graduationYear ?? undefined,
    interests: (record.interests ?? []).filter((interest): interest is string => interest !== null),
    createdAt: record.createdAt ?? undefined,
  }
}

// Returns the signed-in user's profile, or null if they have not created one yet.
export async function getMyProfile(): Promise<SavedProfile | null> {
  const { data, errors } = await client.models.UserProfile.list()
  throwIfErrors(errors)

  const profile = data[0]
  return profile ? toSavedProfile(profile) : null
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

  return toSavedProfile(data)
}
