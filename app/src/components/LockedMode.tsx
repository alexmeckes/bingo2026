import type { Card, Prediction } from '../types';
import { supabase } from '../lib/supabase';
import { getGridConfig } from '../lib/grid';
import ShareLink from './ShareLink';
import BingoGrid from './BingoGrid';
import './LockedMode.css';

interface Props {
  card: Card;
  predictions: Prediction[];
  onPredictionsUpdated: (predictions: Prediction[]) => void;
}

export default function LockedMode({ card, predictions, onPredictionsUpdated }: Props) {
  const gridConfig = getGridConfig(predictions.length);
  const markedCount = predictions.filter((p) => p.is_marked).length;
  const totalWithFreeSpace = gridConfig.hasFreeSpace ? predictions.length + 1 : predictions.length;

  const handleToggleMark = async (predictionId: string) => {
    const prediction = predictions.find((p) => p.id === predictionId);
    if (!prediction) return;

    const newMarked = !prediction.is_marked;

    const { error } = await supabase
      .from('predictions')
      .update({
        is_marked: newMarked,
        marked_at: newMarked ? new Date().toISOString() : null,
      })
      .eq('id', predictionId);

    if (!error) {
      onPredictionsUpdated(
        predictions.map((p) =>
          p.id === predictionId
            ? { ...p, is_marked: newMarked, marked_at: newMarked ? new Date().toISOString() : null }
            : p
        )
      );
    }
  };

  return (
    <div className="locked-mode">
      <header className="locked-header">
        <h1>{card.name}</h1>
        <ShareLink slug={card.slug} />
      </header>

      <div className="stats">
        <span className="marked-count">
          {markedCount + (gridConfig.hasFreeSpace ? 1 : 0)}/{totalWithFreeSpace}
        </span>
        <span className="stats-label">predictions came true</span>
      </div>

      <BingoGrid
        predictions={predictions}
        gridConfig={gridConfig}
        onToggleMark={handleToggleMark}
      />
    </div>
  );
}
