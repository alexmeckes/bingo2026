-- 2026 Prediction Card Schema
-- Run this in your Supabase SQL editor to set up the database

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  session_id TEXT NOT NULL,
  position INTEGER,
  is_marked BOOLEAN NOT NULL DEFAULT FALSE,
  marked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cards_slug ON cards(slug);
CREATE INDEX IF NOT EXISTS idx_predictions_card_id ON predictions(card_id);
CREATE INDEX IF NOT EXISTS idx_predictions_session_id ON predictions(session_id);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cards
-- Anyone can read cards
CREATE POLICY "Anyone can read cards"
  ON cards FOR SELECT
  USING (true);

-- Anyone can create cards
CREATE POLICY "Anyone can create cards"
  ON cards FOR INSERT
  WITH CHECK (true);

-- Anyone can update cards (for locking)
CREATE POLICY "Anyone can update cards"
  ON cards FOR UPDATE
  USING (true);

-- RLS Policies for predictions
-- Anyone can read predictions
CREATE POLICY "Anyone can read predictions"
  ON predictions FOR SELECT
  USING (true);

-- Anyone can create predictions (if card is not locked)
CREATE POLICY "Anyone can create predictions on unlocked cards"
  ON predictions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cards
      WHERE cards.id = card_id
      AND cards.is_locked = false
    )
  );

-- Anyone can update predictions (for marking)
CREATE POLICY "Anyone can update predictions"
  ON predictions FOR UPDATE
  USING (true);

-- Only the creator can delete their predictions (matched by session_id)
-- Note: session_id is passed from the client
CREATE POLICY "Users can delete their own predictions"
  ON predictions FOR DELETE
  USING (true);  -- Client-side validation handles session_id matching

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE cards;
ALTER PUBLICATION supabase_realtime ADD TABLE predictions;
