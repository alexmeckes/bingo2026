import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateSlug } from '../lib/utils';
import './Home.css';

export default function Home() {
  const [cardName, setCardName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) {
      setError('Please enter a card name');
      return;
    }

    setIsCreating(true);
    setError('');

    const slug = generateSlug();

    const { data, error: dbError } = await supabase
      .from('cards')
      .insert({ name: cardName.trim(), slug })
      .select()
      .single();

    if (dbError) {
      setError('Failed to create card. Please try again.');
      setIsCreating(false);
      return;
    }

    navigate(`/card/${data.slug}`);
  };

  return (
    <div className="home">
      <div className="home-content">
        <h1>2026 Predictions</h1>
        <p className="tagline">
          Create a shared prediction card with your friends.
          Add predictions, lock the card, and track what comes true throughout 2026.
        </p>

        <form onSubmit={handleCreate} className="create-form">
          <input
            type="text"
            placeholder="Enter your card name (e.g., The Gang's 2026 Predictions)"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            maxLength={100}
            disabled={isCreating}
          />
          <button type="submit" disabled={isCreating || !cardName.trim()}>
            {isCreating ? 'Creating...' : 'Create Card'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <div className="how-it-works">
          <h2>How it works</h2>
          <ol>
            <li>Create a card and share the link with friends</li>
            <li>Everyone adds their predictions for 2026</li>
            <li>Lock the card to generate the bingo grid</li>
            <li>Mark predictions as they come true throughout the year</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
