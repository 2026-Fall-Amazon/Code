// One typed data client for the whole app. Import this instead of calling
// generateClient() in every feature (existing per-feature clients still work).
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../amplify/data/resource'

export const client = generateClient<Schema>({ authMode: 'userPool' })

// Amplify returns errors in a list instead of throwing. Turn them into a normal error.
export function throwIfErrors(errors?: readonly { message: string }[]) {
  if (errors?.length) {
    throw new Error(errors.map((error) => error.message).join('; '))
  }
}

type Page<T> = {
  data: T[]
  nextToken?: string | null
  errors?: readonly { message: string }[]
}

// Lists come back one page at a time (100 items by default). This keeps asking
// until every page is loaded. Pass a function that fetches one page:
//   listAll((nextToken) => client.models.Club.list({ nextToken }))
export async function listAll<T>(fetchPage: (nextToken?: string | null) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = []
  let nextToken: string | null | undefined
  do {
    const page = await fetchPage(nextToken)
    throwIfErrors(page.errors)
    items.push(...page.data)
    nextToken = page.nextToken
  } while (nextToken)
  return items
}
