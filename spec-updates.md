# 2026 Prediction Card — Spec Updates

Updates to the original spec based on review feedback.

---

## 1. Dynamic Grid Sizing

The grid size adapts based on the number of predictions submitted, rather than requiring exactly 24.

### Supported Grid Sizes

| Grid | Total Cells | Predictions | Free Space | Best For |
|------|-------------|-------------|------------|----------|
| 3×3  | 9           | 8           | 1 (center) | 2-4 people |
| 4×4  | 16          | 16          | None       | 4-6 people |
| 5×5  | 25          | 24          | 1 (center) | 6-10 people |
| 6×6  | 36          | 36          | None       | 10+ people |

### Grid Selection Logic

When the creator locks the card, the system selects the **smallest grid that fits all predictions**:

```
predictions ≤ 8   → 3×3 grid
predictions ≤ 16  → 4×4 grid
predictions ≤ 24  → 5×5 grid
predictions ≤ 36  → 6×6 grid
predictions > 36  → Show warning, ask to remove some
```

### Handling Partial Fills

If predictions don't exactly fill the grid (e.g., 20 predictions → 5×5 grid with 24 slots):

- **Option A (Recommended):** Empty cells become "bonus free spaces" — always marked, display as "✨" or "FREE"
- **Option B:** Require exact count before locking (more restrictive)

Recommendation: Option A — don't block the fun over a few empty slots.

### Free Space Rules

| Grid | Free Space Position |
|------|---------------------|
| 3×3  | Position 4 (center) |
| 4×4  | None |
| 5×5  | Position 12 (center) |
| 6×6  | None |

Odd-numbered grids get a center free space. Even-numbered grids use all cells for predictions.

---

## 2. Creator Verification (No Auth)

Only the card creator can lock the card. Implemented via browser token, no login required.

### How It Works

1. **On card creation:**
   - Generate a random `creator_token` (UUID v4)
   - Store token in creator's browser `localStorage`
   - Store `creator_token_hash` (SHA-256) in database

2. **On page load:**
   - Check if `localStorage` has a token for this card
   - If hash matches database, user is the creator
   - Show "Lock Card" button only to creator

3. **On lock attempt:**
   - Verify token hash matches before allowing lock
   - Reject if no token or hash mismatch

### Updated Data Model

```sql
-- Table: cards
CREATE TABLE cards (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,
  is_locked           BOOLEAN DEFAULT FALSE,
  grid_size           INT,  -- NULL until locked, then 3, 4, 5, or 6
  creator_token_hash  TEXT NOT NULL,  -- SHA-256 hash of creator's token
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Table: predictions
CREATE TABLE predictions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id       UUID REFERENCES cards(id) ON DELETE CASCADE,
  text          TEXT NOT NULL CHECK (char_length(text) <= 100),
  submitted_by  TEXT NOT NULL,
  position      INT,  -- NULL until card locks, then 0 to (grid_size²-1)
  is_marked     BOOLEAN DEFAULT FALSE,
  marked_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_predictions_card_id ON predictions(card_id);
CREATE UNIQUE INDEX idx_cards_slug ON cards(slug);
```

### localStorage Schema

```javascript
// Stored in browser localStorage
{
  "bingo2026_creator_tokens": {
    "a3kx92mz": "550e8400-e29b-41d4-a716-446655440000",  // slug: token
    "xk29dm3p": "6fa459ea-ee8a-3ca4-894e-db77e160355e"
  }
}
```

### UI Changes

| User Type | Draft Mode | Locked Mode |
|-----------|------------|-------------|
| Creator   | Sees "Lock Card" button (enabled when ≥8 predictions) | Full access |
| Others    | No lock button visible | Full access |

---

## 3. Slug Generation

Random 8-character alphanumeric string, URL-safe and easy to share.

### Format

```
Character set: a-z, 0-9 (lowercase only, no ambiguous chars)
Length: 8 characters
Example: a3kx92mz
```

### Generation Logic

```javascript
function generateSlug() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // No i,l,o,0,1 (ambiguous)
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}
```

### Collision Handling

1. Generate slug
2. Check if exists in database
3. If collision, regenerate (retry up to 3 times)
4. With 30 chars and 8 positions, collision is extremely unlikely (~8×10¹¹ combinations)

---

## 4. Updated User Flows

### Creating a Card (Updated)

1. User clicks "Create New Card"
2. Enters a card name
3. System generates unique slug and creator token
4. **Creator token saved to localStorage**
5. User adds predictions (text + their name)
6. Shares link with friends
7. Friends add their own predictions
8. **Creator sees "Lock Card" button when ≥8 predictions exist**
9. Creator locks → grid size auto-selected → positions randomized

### Locking a Card (New)

1. Creator clicks "Lock Card"
2. System counts predictions
3. If < 8: Show error "Need at least 8 predictions"
4. If > 36: Show warning "Too many predictions (max 36). Remove some or split into multiple cards."
5. If 8-36:
   - Select appropriate grid size
   - Randomly assign positions to predictions
   - Fill empty slots with bonus free spaces
   - Set `is_locked = true` and `grid_size = N`

---

## 5. Updated Features Table

| Feature | Details |
|---------|---------|
| Create card | Name + unique 8-char slug + creator token |
| Add prediction | Text (max 100 chars) + submitter name |
| **Min predictions** | 8 (for 3×3 grid) |
| **Max predictions** | 36 (for 6×6 grid) |
| **Dynamic grid** | Auto-sizes to fit predictions (3×3 to 6×6) |
| Free space | Center cell on odd grids (3×3, 5×5), none on even |
| **Bonus free spaces** | Empty cells when predictions don't fill grid exactly |
| Mark as happened | Toggle, visible to everyone, reversible |
| Timestamp on mark | Records when prediction was marked true |
| Real-time sync | Updates appear for all viewers immediately |
| Shareable link | Primary access method, no auth required |
| **Creator-only lock** | Only browser that created card can lock it |

---

## 6. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Creator clears browser data | Cannot lock card anymore (add "Transfer ownership" in V2) |
| Creator on different device | Cannot lock (same as above) |
| Someone adds prediction #37 | Allowed in draft; creator sees warning when trying to lock |
| Creator locks with 20 predictions | 5×5 grid, 4 bonus free spaces randomly placed |
| Two people submit simultaneously | Both succeed, real-time sync shows both |
| Slug collision | Auto-retry with new slug (up to 3 attempts) |

---

## 7. Future Considerations (V2+)

- **Transfer creator status:** Generate a one-time transfer link
- **Email backup:** Optional email to recover creator access
- **Grid size override:** Let creator pick specific size instead of auto
- **Prediction voting:** If too many predictions, group votes on which to keep

---

## Summary of Changes

| Original Spec | Updated |
|---------------|---------|
| Fixed 5×5 grid (24 predictions) | Dynamic 3×3 to 6×6 (8-36 predictions) |
| Anyone can lock at 24 | Creator-only lock via browser token |
| Slug generation unspecified | Random 8-char alphanumeric |
| Exact prediction count required | Flexible with bonus free spaces |
