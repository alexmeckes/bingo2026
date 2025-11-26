-- 2026 Predictions Bingo Schema

-- Cards table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  position INTEGER,
  is_marked BOOLEAN DEFAULT FALSE,
  marked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_predictions_card_id ON predictions(card_id);
CREATE INDEX idx_cards_slug ON cards(slug);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (no auth required for this app)
CREATE POLICY "Allow public read access to cards"
  ON cards FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to cards"
  ON cards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to cards"
  ON cards FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access to predictions"
  ON predictions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to predictions"
  ON predictions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to predictions"
  ON predictions FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on predictions"
  ON predictions FOR DELETE
  USING (true);

-- Enable realtime for predictions table
ALTER PUBLICATION supabase_realtime ADD TABLE predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE cards;
