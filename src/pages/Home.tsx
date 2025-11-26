import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCard } from '../lib/api'
import styles from './Home.module.css'

export default function Home() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const card = await createCard(name.trim())
      navigate(`/card/${card.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create card')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>2026 Prediction Card</h1>
        <p className={styles.subtitle}>
          Create a shared prediction card with your friends. Add 24 predictions
          for 2026, then track which ones come true throughout the year.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="cardName" className={styles.label}>
          Card Name
        </label>
        <input
          id="cardName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="The Gang's 2026 Predictions"
          className={styles.input}
          disabled={loading}
          maxLength={100}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.button} disabled={loading || !name.trim()}>
          {loading ? 'Creating...' : 'Create New Card'}
        </button>
      </form>

      <div className={styles.howItWorks}>
        <h2>How it works</h2>
        <ol>
          <li>Create a card and share the link with friends</li>
          <li>Everyone adds their predictions for 2026</li>
          <li>Once you have 24 predictions, lock the card</li>
          <li>Throughout 2026, mark predictions as they come true</li>
        </ol>
      </div>
    </div>
  )
}
