# Shared session: who's signed in and their clubs

`SessionProvider` (in `main.tsx`) loads these once after sign-in. Use the hooks instead of `mock/data.ts` when you connect your page.

| Instead of (mock) | Use |
|---|---|
| `currentUser` | `useCurrentUser()` returns `userId`, `email`, `displayName`, `profile`, `isAdmin`, `refreshProfile()` |
| `clubs`, `clubById()` | `useClubs()` returns `clubs`, `clubById(id)`, `refresh()` |
| `memberships`, `myClubs()`, `roleIn()` | `useMyClubs()` returns `myClubs` (`{ club, role }[]`), `roleIn(id)`, `isMemberOf(id)`, `hasMembership(id)`, `isLeaderOf(id)`, `canPostIn(id)`, `join(id)`, `leave(id)` |
| `generateClient<Schema>()` in each file | `import { client, listAll, throwIfErrors } from '../lib/dataClient'` |

## Roles
- `leader` and `poster` come from the `ClubRole` table. `member` means a `Membership` record with no role.
- Officer-only UI should check `isLeaderOf(clubId)` or `canPostIn(clubId)`.
- Don't add a role field to `Membership`. Students create their own `Membership` records, so they could make themselves officers.
- Show the UI with these checks, but don't rely on them for security. Writes must be checked on the server (auth rules or a Lambda).

## Example
```tsx
import { useCurrentUser, useMyClubs } from '../../lib/session/hooks'

export function MyPage() {
  const { displayName } = useCurrentUser()
  const { myClubs, isLeaderOf, loading } = useMyClubs()
  if (loading) return <p>Loading…</p>
  return (
    <>
      <h1>Hi, {displayName}</h1>
      {myClubs.map(({ club, role }) => (
        <p key={club.id}>
          {club.name} ({role}) {isLeaderOf(club.id) && '· you can post'}
        </p>
      ))}
    </>
  )
}
```

## Notes
- **Admins:** `Membership.list()` returns everyone's memberships for ADMINS users. `useMyClubs()` already filters to the signed-in user's own.
- **Profile edits:** after saving a profile, call `refreshProfile()` so the side menu shows the new name.
- **Lists:** Amplify returns 100 items per page. Wrap list calls in `listAll(...)` to get every page.
- **Demo data:** an ADMINS user can load demo clubs, events, and announcements, and assign club leaders, from **Settings → Admin tools**. Everyone can copy their user ID from Settings.
