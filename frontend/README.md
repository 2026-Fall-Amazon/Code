# Frontend

React + TypeScript + Tailwind CSS, built with Vite. Every page is a placeholder that runs on mock data, so each feature owner can fill in their own page without touching anyone else's.

Run it from the repository root (requires `frontend/amplify_outputs.json`, see `AWS_SETUP.md`):

```bash
npm --prefix frontend run dev
```

## Where things live

| Path | What it holds |
| --- | --- |
| `src/main.tsx` | Starts the app: connects Amplify, wraps everything in the sign-in screen and the router. Rarely needs changes. |
| `src/App.tsx` | The list of pages (routes). Add a line here when you add a page. |
| `src/layout/` | The frame around every page: top bar, side menu, bottom tabs. |
| `src/features/<area>/` | One folder per feature area. Each page starts with a comment listing what still needs to be built. |
| `src/components/` | Shared building blocks: `Button`, `Card`, `EventCard`, `ClubCard`, `AnnouncementCard`, `Stat`, `Tag`, `Toggle`, and the `Concept` label. |
| `src/mock/` | Fake data and its types. Fields match `amplify/data/resource.ts`; fields marked "not in schema yet" need to be added there first. |
| `src/lib/format.ts` | Date and money formatting. |
| `src/index.css` | Tailwind setup and the brand color tokens. |
| `src/config.ts` | The app name (placeholder until the team picks one). |

## Styling

Use Tailwind classes with the brand tokens from `src/index.css`:

| Token | Color | Use for |
| --- | --- | --- |
| `squid` / `squid-light` | `#131921` / `#232f3e` | Top bar, tab bar, heavy structure |
| `brand` / `brand-hover` / `brand-soft` | `#FF9900` / `#E68A00` / `#FEBD69` | Primary buttons, active states |
| `page` | `#F0F2F2` | Page background |
| `ink` | `#0F1111` | Body text |

Cards are white with `rounded-lg shadow-sm` (use `<Card>`). Primary actions use `<Button>`, secondary ones `<Button variant="secondary">`.

## Concept features

Features that are out of scope for the MVP (group chat and direct messages, two-way Google Calendar sync, video, collecting dues) still appear in the demo so reviewers can see where they would go. Wrap them in `<ConceptCard>` or put a `<ConceptBadge />` next to them, and leave their buttons `disabled`. Never present a concept feature as working.

## Replacing mock data

Swap an import from `src/mock/data` for a Data API call when your feature is ready:

```ts
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../amplify/data/resource'

const client = generateClient<Schema>()
const { data: clubs } = await client.models.Club.list()
```
