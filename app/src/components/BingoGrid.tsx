import type { Prediction, GridConfig } from '../types';
import './BingoGrid.css';

interface Props {
  predictions: Prediction[];
  gridConfig: GridConfig;
  onToggleMark: (predictionId: string) => void;
}

export default function BingoGrid({ predictions, gridConfig, onToggleMark }: Props) {
  // Create a map of position -> prediction
  const positionMap = new Map<number, Prediction>();
  predictions.forEach((p) => {
    if (p.position !== null) {
      positionMap.set(p.position, p);
    }
  });

  // Build grid cells
  const cells = [];
  for (let i = 0; i < gridConfig.totalCells; i++) {
    const isFreeSpace = i === gridConfig.freeSpaceIndex;
    const prediction = positionMap.get(i);

    cells.push(
      <div
        key={i}
        className={`grid-cell ${isFreeSpace ? 'free-space' : ''} ${
          prediction?.is_marked ? 'marked' : ''
        } ${!isFreeSpace && !prediction ? 'empty' : ''}`}
        onClick={() => {
          if (prediction && !isFreeSpace) {
            onToggleMark(prediction.id);
          }
        }}
      >
        {isFreeSpace ? (
          <div className="cell-content free">
            <span className="free-label">FREE</span>
            <span className="checkmark">✓</span>
          </div>
        ) : prediction ? (
          <div className="cell-content">
            <span className="prediction-text">{prediction.text}</span>
            <span className="prediction-author">{prediction.submitted_by}</span>
            {prediction.is_marked && <span className="checkmark">✓</span>}
          </div>
        ) : (
          <div className="cell-content empty">
            <span className="empty-label">—</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="bingo-grid"
      style={{
        gridTemplateColumns: `repeat(${gridConfig.size}, 1fr)`,
      }}
    >
      {cells}
    </div>
  );
}
