# 2026 Prediction Card — Product Spec

## Overview

A shared "prediction card" for friend groups. One card per group, 24 predictions in a 5×5 grid (with a free center space). Group creates it together, tracks it throughout 2026, marks predictions as they come true.

Not really bingo—no winner, no competition. It's a collaborative prediction artifact with bingo aesthetics.

---

## Core Concept

- Small friend group gets together (New Year's, etc.)
- Everyone contributes predictions for 2026
- Predictions fill a shared 5×5 grid
- Throughout the year, anyone can mark predictions as "happened"
- Shared link means everyone sees the same card state

---

## User Flows

### Creating a Card

1. User clicks "Create New Card"
2. Enters a card name (e.g., "The Gang's 2026 Predictions")
3. System generates a unique shareable link/slug
4. User adds predictions (text + their name)
5. Shares link with friends
6. Friends can add their own predictions
7. Once 24 predictions exist, card can be "locked" and grid is formed

### Joining a Card

1. User opens shared link
2. Sees card name and current predictions
3. Can add their own predictions (with their name attached)
4. If card is locked, can only view and mark squares

### Viewing / Playing (Locked Card)

1. Open the link anytime throughout 2026
2. See the 5×5 grid with all predictions
3. Click a square to mark it "happened"
4. Everyone with the link sees the same state in real-time

---

## Features

| Feature | Details |
|---------|---------|
| Create card | Name + unique URL slug |
| Add prediction | Text (max 100 chars) + submitter name |
| 24 predictions required | Card can't lock until 24 predictions added |
| Free space | Center square (position 12), always marked |
| Mark as happened | Toggle, visible to everyone, reversible |
| Timestamp on mark | Records when prediction was marked true |
| Real-time sync | Updates appear for all viewers immediately |
| Shareable link | Primary access method, no auth required |

---

## Card States

### Draft

- Fewer than 24 predictions
- Anyone with link can add predictions
- Grid not yet visible (just a list)

### Locked / Ready

- Exactly 24 predictions
- Grid positions assigned (randomized or in order added)
- No new predictions allowed
- Users can mark/unmark squares

---

## Data Model (Supabase)

### Table: `cards`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, auto-generated |
| name | text | Card title, e.g., "The Gang's 2026 Predictions" |
| slug | text | URL-friendly unique identifier (human-readable) |
| access_token | text | Random 12-char token for write operations (not in URL) |
| is_locked | boolean | Default false, true when card is ready |
| created_at | timestamp | Auto-generated |

### Table: `predictions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, auto-generated |
| card_id | uuid | Foreign key → cards.id |
| text | text | The prediction text |
| submitted_by | text | Name of person who added it |
| session_id | text | Browser session UUID (for delete permissions) |
| position | int | 0-23 grid position, excludes center (assigned when card locks) |
| is_marked | boolean | Has this prediction come true? Default false |
| marked_at | timestamp | Nullable, set when marked |
| created_at | timestamp | Auto-generated |

### Supabase Features to Use

- **Real-time subscriptions** on both `cards` and `predictions` tables for live updates
- **Row Level Security (RLS):**
  - Read: Allow for anyone with valid card slug
  - Write predictions: Allow for anyone with valid card slug (draft mode only)
  - Delete predictions: Allow only if request `session_id` matches prediction `session_id`
  - Update cards (lock): Allow for anyone with valid card slug
  - Update predictions (mark/unmark): Allow for anyone with valid card slug
- **Unique constraint** on `cards.slug`
- **Rate limiting**: Max 10 requests per minute per IP to prevent enumeration

---

## Session Identity (No Auth)

Since there's no user authentication, we use browser-based session tracking:

### Implementation

1. On first visit, generate a UUID and store in `localStorage` as `session_id`
2. Include `session_id` when creating predictions
3. Use `session_id` to verify ownership for delete operations
4. Session is per-browser, not per-device or per-user

### Limitations (Acceptable for V1)

- Clearing browser data loses "ownership" of predictions
- Can't delete predictions from a different browser
- No way to prove identity across devices

---

## Slug Generation

### Format
- Human-readable: `adjective-noun-number` (e.g., `happy-penguin-2026`)
- 8-12 characters total
- Lowercase, alphanumeric + hyphens only

### Collision Handling
1. Generate candidate slug
2. Check if exists in database
3. If collision, append random 3-digit suffix
4. Retry up to 3 times, then fall back to UUID-based slug

---

## Grid Position Logic

### Free Space
- Center position (index 12 in 0-24 grid) is always the free space
- Free space is NOT stored in `predictions` table
- It's rendered client-side as always-marked
- Predictions use positions 0-11 and 13-24 (24 total slots)

### Position Assignment (on lock)
1. Collect all 24 predictions
2. Shuffle array randomly (Fisher-Yates)
3. Assign positions 0-11 to first 12 predictions
4. Assign positions 13-24 to remaining 12 predictions
5. Save positions to database

---

## Error Handling

### Network Failures
- Show toast notification on failed operations
- Auto-retry mutations up to 3 times with exponential backoff
- Queue marks/unmarks if offline, sync when reconnected

### Invalid States
- **Invalid slug**: Show "Card not found" page with link to create new card
- **25th prediction attempt**: Disable input, show "Card is full — ready to lock!"
- **Lock with < 24 predictions**: Button disabled with tooltip explaining requirement
- **Supabase downtime**: Show cached state with "offline" indicator

### Conflict Resolution
- Last-write-wins for mark/unmark (acceptable for collaborative use)
- Real-time subscription ensures quick convergence

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite or Next.js) |
| Database | Supabase (Postgres) |
| Real-time | Supabase Realtime |
| Hosting | Vercel |
| Auth | None — link-based access + localStorage session |

---

## UI Components

### Draft Mode View

- Card name as header
- List of current predictions with submitter names
- Delete button on own predictions (matched by session_id)
- Input field: prediction text
- Input field: your name
- "Add Prediction" button
- Progress indicator: "18/24 predictions"
- "Lock Card" button (enabled when count = 24, with confirmation dialog)

### Locked / Play Mode View

- Card name as header
- 5×5 grid layout
- Each cell shows:
  - Prediction text
  - Submitter name (smaller)
  - Visual indicator if marked (checkmark, highlight, strikethrough)
- Center cell is free space (always marked, distinct style)
- Click cell to toggle marked state
- Counter: "7/24 predictions came true"

### Visual States for Grid Cells

| State | Appearance |
|-------|------------|
| Unmarked | Default background, normal text |
| Marked | Highlighted background, checkmark icon, satisfying animation |
| Free space | Distinct style (gold/star), always "checked", non-interactive |

---

## URL Structure

```
/                    → Landing page, "Create New Card" button
/card/[slug]         → View/interact with specific card
/card/[slug]/share   → (Optional) Dedicated share page with copy button
```

---

## Security Considerations

### Slug Enumeration Protection
- Rate limit: 10 requests/minute per IP on card lookup
- Slugs are human-readable but include randomness
- Consider adding CAPTCHA if abuse detected

### Write Protection (Future consideration)
- `access_token` field reserved for future "edit mode" protection
- Could require token to add predictions (shared separately from URL)
- Not implemented in V1

---

## Offline Behavior

### Read
- Cache current card state in localStorage
- Show cached state with "offline" banner if network unavailable

### Write (mark/unmark)
- Queue operations in localStorage
- Sync when connection restored
- Show pending state visually (optimistic UI)

---

## Accessibility

- Grid cells are keyboard navigable (arrow keys + Enter to toggle)
- ARIA labels on grid cells: "Prediction: [text], by [name], [marked/unmarked]"
- High contrast mode support
- Screen reader announces mark/unmark changes

---

## Open Questions (Decided)

| # | Question | Decision |
|---|----------|----------|
| 1 | Unmark squares? | **Yes** — allow toggle (accidents happen) |
| 2 | Lock mechanism? | **Manual** — "Lock Card" button with confirmation dialog |
| 3 | Edit/delete predictions? | **Delete only**, own predictions only (via session_id) |
| 4 | Prediction limit per person? | **No limit** — small groups self-regulate |
| 5 | Grid position assignment? | **Random shuffle** when locked |
| 6 | Visual style? | **Minimal with subtle playfulness** — clean grid, satisfying animations |
| 7 | Mobile-first? | **Yes** — responsive design, touch-friendly cells |

---

## Out of Scope (V1)

- User authentication / accounts
- Multiple cards per user dashboard
- Comments or reactions on predictions
- Notifications when predictions are marked
- Export / share as image
- History of who marked what
- Card expiration / cleanup policy
- Analytics / monitoring dashboard

---

## Success Criteria

A group of friends can:

1. Create a card in ~5 minutes
2. Share a single link that works for everyone
3. Open that same link 6 months later and see the current state
4. Mark a prediction with one tap
5. See each other's marks in real-time

---

## Next Steps

1. Set up Supabase project and tables (including RLS policies)
2. Scaffold React app with routing
3. Implement session_id generation and storage
4. Build draft mode (add/delete predictions)
5. Build locked mode (grid view with mark/unmark)
6. Add real-time sync for both tables
7. Add error handling and offline support
8. Deploy to Vercel
9. Test with a real friend group
