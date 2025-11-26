import { useParams, Link } from 'react-router-dom'
import { useCard } from '../hooks/useCard'
import DraftMode from '../components/DraftMode'
import LockedMode from '../components/LockedMode'
import styles from './Card.module.css'

export default function Card() {
  const { slug } = useParams<{ slug: string }>()
  const { card, loading, error, refetch } = useCard(slug || '')

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={refetch} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Card Not Found</h2>
          <p>This prediction card doesn't exist or the link is invalid.</p>
          <Link to="/" className={styles.homeLink}>
            Create a New Card
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>
          &larr; Home
        </Link>
        <h1 className={styles.title}>{card.name}</h1>
        {!card.is_locked && (
          <p className={styles.subtitle}>
            {card.predictions.length}/24 predictions
          </p>
        )}
      </header>

      {card.is_locked ? (
        <LockedMode card={card} />
      ) : (
        <DraftMode card={card} />
      )}

      <footer className={styles.footer}>
        <ShareLink slug={card.slug} />
      </footer>
    </div>
  )
}

function ShareLink({ slug }: { slug: string }) {
  const url = `${window.location.origin}/card/${slug}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      alert('Link copied!')
    } catch {
      // Fallback for older browsers
      prompt('Copy this link:', url)
    }
  }

  return (
    <div className={styles.shareSection}>
      <p className={styles.shareLabel}>Share this card:</p>
      <div className={styles.shareRow}>
        <input
          type="text"
          value={url}
          readOnly
          className={styles.shareInput}
          onClick={(e) => e.currentTarget.select()}
        />
        <button onClick={handleCopy} className={styles.copyButton}>
          Copy
        </button>
      </div>
    </div>
  )
}
