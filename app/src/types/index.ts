export interface Card {
  id: string;
  name: string;
  slug: string;
  is_locked: boolean;
  created_at: string;
}

export interface Prediction {
  id: string;
  card_id: string;
  text: string;
  submitted_by: string;
  position: number | null;
  is_marked: boolean;
  marked_at: string | null;
  created_at: string;
}

export interface GridConfig {
  size: number;
  totalCells: number;
  predictionSlots: number;
  hasFreeSpace: boolean;
  freeSpaceIndex: number | null;
}
