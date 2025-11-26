import { useState } from 'react'
import { togglePredictionMark } from '../lib/api'
import type { CardWithPredictions, Prediction } from '../lib/types'
import styles from './LockedMode.module.css'

interface Props {
  card: CardWithPredictions
}

export default function LockedMode({ card }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  // Build grid with predictions in their positions
  const grid = buildGrid(card.predictions)
  const markedCount = card.predictions.filter(p => p.is_marked).length

  const handleToggle = async (prediction: Prediction) => {
    if (loading) return

    setLoading(prediction.id)
    try {
      await togglePredictionMark(prediction)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.counter}>
        {markedCount}/24 predictions came true
      </div>

      <div className={styles.grid} role="grid" aria-label="Prediction card grid">
        {grid.map((cell, idx) => (
          <GridCell
            key={idx}
            cell={cell}
            position={idx}
            loading={typeof cell === 'object' && cell !== null && loading === cell.id}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}

type CellType = Prediction | 'free' | null

function buildGrid(predictions: Prediction[]): CellType[] {
  const grid: CellType[] = Array(25).fill(null)

  // Position 12 is always free space
  grid[12] = 'free'

  // Place predictions by their position
  predictions.forEach(pred => {
    if (pred.position !== null && pred.position >= 0 && pred.position < 25) {
      grid[pred.position] = pred
    }
  })

  return grid
}

interface GridCellProps {
  cell: CellType
  position: number
  loading: boolean
  onToggle: (prediction: Prediction) => void
}

function GridCell({ cell, position, loading, onToggle }: GridCellProps) {
  if (cell === 'free') {
    return (
      <div
        className={`${styles.cell} ${styles.freeSpace}`}
        role="gridcell"
        aria-label="Free space, always marked"
      >
        <span className={styles.freeText}>FREE</span>
        <span className={styles.checkmark}>✓</span>
      </div>
    )
  }

  if (!cell) {
    return (
      <div
        className={`${styles.cell} ${styles.empty}`}
        role="gridcell"
        aria-label={`Empty cell at position ${position}`}
      />
    )
  }

  const isMarked = cell.is_marked

  return (
    <button
      className={`${styles.cell} ${isMarked ? styles.marked : ''} ${loading ? styles.loading : ''}`}
      onClick={() => onToggle(cell)}
      disabled={loading}
      role="gridcell"
      aria-label={`Prediction: ${cell.text}, by ${cell.submitted_by}, ${isMarked ? 'marked' : 'unmarked'}`}
      aria-pressed={isMarked}
    >
      <span className={styles.predictionText}>{cell.text}</span>
      <span className={styles.submitter}>{cell.submitted_by}</span>
      {isMarked && <span className={styles.checkmark}>✓</span>}
    </button>
  )
}
