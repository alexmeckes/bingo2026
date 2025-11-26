import { useState } from 'react'
import { addPrediction, deletePrediction, lockCard } from '../lib/api'
import { getSessionId } from '../lib/session'
import type { CardWithPredictions } from '../lib/types'
import styles from './DraftMode.module.css'

interface Props {
  card: CardWithPredictions
}

export default function DraftMode({ card }: Props) {
  const [text, setText] = useState('')
  const [name, setName] = useState(() => localStorage.getItem('bingo2026_name') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lockLoading, setLockLoading] = useState(false)

  const sessionId = getSessionId()
  const canLock = card.predictions.length >= 24
  const isFull = card.predictions.length >= 24

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !name.trim() || isFull) return

    setLoading(true)
    setError(null)

    try {
      localStorage.setItem('bingo2026_name', name.trim())
      await addPrediction(card.id, text.trim(), name.trim())
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add prediction')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (predictionId: string) => {
    if (!confirm('Delete this prediction?')) return

    try {
      await deletePrediction(predictionId)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleLock = async () => {
    if (!confirm('Lock this card? No more predictions can be added after locking.')) return

    setLockLoading(true)
    try {
      await lockCard(card.id, card.predictions)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to lock card')
    } finally {
      setLockLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.predictions}>
        <h2 className={styles.sectionTitle}>Predictions</h2>
        {card.predictions.length === 0 ? (
          <p className={styles.empty}>No predictions yet. Add the first one!</p>
        ) : (
          <ul className={styles.list}>
            {card.predictions.map((pred, idx) => (
              <li key={pred.id} className={styles.item}>
                <span className={styles.number}>{idx + 1}</span>
                <div className={styles.content}>
                  <p className={styles.text}>{pred.text}</p>
                  <p className={styles.submitter}>— {pred.submitted_by}</p>
                </div>
                {pred.session_id === sessionId && (
                  <button
                    onClick={() => handleDelete(pred.id)}
                    className={styles.deleteButton}
                    aria-label="Delete prediction"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isFull && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.sectionTitle}>Add a Prediction</h2>
          <div className={styles.field}>
            <label htmlFor="prediction" className={styles.label}>
              Your prediction for 2026
            </label>
            <input
              id="prediction"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What will happen in 2026?"
              className={styles.input}
              disabled={loading}
              maxLength={100}
            />
            <span className={styles.charCount}>{text.length}/100</span>
          </div>
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Your name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={styles.input}
              disabled={loading}
              maxLength={50}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || !text.trim() || !name.trim()}
          >
            {loading ? 'Adding...' : 'Add Prediction'}
          </button>
        </form>
      )}

      {isFull && (
        <div className={styles.fullMessage}>
          Card is full with 24 predictions! Ready to lock.
        </div>
      )}

      {canLock && (
        <div className={styles.lockSection}>
          <button
            onClick={handleLock}
            className={styles.lockButton}
            disabled={lockLoading}
          >
            {lockLoading ? 'Locking...' : 'Lock Card & Create Grid'}
          </button>
          <p className={styles.lockHint}>
            Once locked, no more predictions can be added.
          </p>
        </div>
      )}
    </div>
  )
}
