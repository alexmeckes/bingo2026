import { useState } from 'react';
import type { Card, Prediction } from '../types';
import { supabase } from '../lib/supabase';
import { getGridConfig, assignPositions } from '../lib/grid';
import { getStoredUsername, saveUsername } from '../lib/utils';
import ShareLink from './ShareLink';
import './DraftMode.css';

interface Props {
  card: Card;
  predictions: Prediction[];
  onPredictionAdded: (prediction: Prediction) => void;
  onCardLocked: (card: Card) => void;
  onPredictionsUpdated: (predictions: Prediction[]) => void;
}

export default function DraftMode({
  card,
  predictions,
  onPredictionAdded,
  onCardLocked,
  onPredictionsUpdated,
}: Props) {
  const [text, setText] = useState('');
  const [name, setName] = useState(getStoredUsername());
  const [isAdding, setIsAdding] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [error, setError] = useState('');

  const gridConfig = getGridConfig(predictions.length);
  const canLock = predictions.length >= 1;

  const handleAddPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !name.trim()) {
      setError('Please enter both a prediction and your name');
      return;
    }

    setIsAdding(true);
    setError('');
    saveUsername(name.trim());

    const { data, error: dbError } = await supabase
      .from('predictions')
      .insert({
        card_id: card.id,
        text: text.trim(),
        submitted_by: name.trim(),
      })
      .select()
      .single();

    if (dbError) {
      setError('Failed to add prediction. Please try again.');
      setIsAdding(false);
      return;
    }

    onPredictionAdded(data);
    setText('');
    setIsAdding(false);
  };

  const handleLockCard = async () => {
    if (!canLock) return;

    setIsLocking(true);
    setError('');

    // Assign random positions to all predictions
    const positions = assignPositions(predictions.length);

    // Update all predictions with their positions
    const updates = predictions.map((p, index) => ({
      id: p.id,
      position: positions[index],
    }));

    for (const update of updates) {
      await supabase
        .from('predictions')
        .update({ position: update.position })
        .eq('id', update.id);
    }

    // Lock the card
    const { data, error: lockError } = await supabase
      .from('cards')
      .update({ is_locked: true })
      .eq('id', card.id)
      .select()
      .single();

    if (lockError) {
      setError('Failed to lock card. Please try again.');
      setIsLocking(false);
      return;
    }

    // Fetch updated predictions
    const { data: updatedPredictions } = await supabase
      .from('predictions')
      .select('*')
      .eq('card_id', card.id);

    if (updatedPredictions) {
      onPredictionsUpdated(updatedPredictions);
    }

    onCardLocked(data);
  };

  const handleDeletePrediction = async (predictionId: string) => {
    const { error: deleteError } = await supabase
      .from('predictions')
      .delete()
      .eq('id', predictionId);

    if (!deleteError) {
      onPredictionsUpdated(predictions.filter((p) => p.id !== predictionId));
    }
  };

  return (
    <div className="draft-mode">
      <header className="draft-header">
        <h1>{card.name}</h1>
        <ShareLink slug={card.slug} />
      </header>

      <div className="draft-content">
        <div className="progress-section">
          <div className="progress-text">
            <span className="count">{predictions.length}</span> predictions added
          </div>
          <div className="grid-info">
            Will create a {gridConfig.size}x{gridConfig.size} grid
            {gridConfig.hasFreeSpace && ' (with free center space)'}
          </div>
        </div>

        <form onSubmit={handleAddPrediction} className="add-form">
          <input
            type="text"
            placeholder="Your prediction for 2026..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={100}
            disabled={isAdding}
          />
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            disabled={isAdding}
          />
          <button type="submit" disabled={isAdding || !text.trim() || !name.trim()}>
            {isAdding ? 'Adding...' : 'Add Prediction'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <div className="predictions-list">
          <h2>Predictions</h2>
          {predictions.length === 0 ? (
            <p className="empty">No predictions yet. Add the first one!</p>
          ) : (
            <ul>
              {predictions.map((prediction) => (
                <li key={prediction.id}>
                  <div className="prediction-content">
                    <span className="prediction-text">{prediction.text}</span>
                    <span className="prediction-author">— {prediction.submitted_by}</span>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeletePrediction(prediction.id)}
                    title="Delete prediction"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lock-section">
          <button
            className="lock-btn"
            onClick={handleLockCard}
            disabled={!canLock || isLocking}
          >
            {isLocking ? 'Locking...' : `Lock Card & Create ${gridConfig.size}x${gridConfig.size} Grid`}
          </button>
          {!canLock && (
            <p className="lock-hint">Add at least 1 prediction to lock the card</p>
          )}
          {canLock && (
            <p className="lock-warning">
              Once locked, no more predictions can be added
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
