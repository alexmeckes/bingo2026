import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Card as CardType, Prediction } from '../types';
import DraftMode from '../components/DraftMode';
import LockedMode from '../components/LockedMode';
import './Card.css';

export default function Card() {
  const { slug } = useParams<{ slug: string }>();
  const [card, setCard] = useState<CardType | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    const fetchCard = async () => {
      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select('*')
        .eq('slug', slug)
        .single();

      if (cardError || !cardData) {
        setError('Card not found');
        setLoading(false);
        return;
      }

      setCard(cardData);

      const { data: predictionsData } = await supabase
        .from('predictions')
        .select('*')
        .eq('card_id', cardData.id)
        .order('created_at', { ascending: true });

      setPredictions(predictionsData || []);
      setLoading(false);
    };

    fetchCard();

    // Set up real-time subscription
    const channel = supabase
      .channel(`card-${slug}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'predictions',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPrediction = payload.new as Prediction;
            setPredictions((prev) => {
              if (prev.some(p => p.id === newPrediction.id)) return prev;
              return [...prev, newPrediction];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Prediction;
            setPredictions((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as Prediction;
            setPredictions((prev) => prev.filter((p) => p.id !== deleted.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cards',
        },
        (payload) => {
          setCard(payload.new as CardType);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  const handlePredictionAdded = (prediction: Prediction) => {
    setPredictions((prev) => {
      if (prev.some(p => p.id === prediction.id)) return prev;
      return [...prev, prediction];
    });
  };

  const handleCardLocked = (updatedCard: CardType) => {
    setCard(updatedCard);
  };

  const handlePredictionsUpdated = (updatedPredictions: Prediction[]) => {
    setPredictions(updatedPredictions);
  };

  if (loading) {
    return (
      <div className="card-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="card-page">
        <div className="error-container">
          <h1>Card not found</h1>
          <p>This card doesn't exist or the link is invalid.</p>
          <a href="/">Create a new card</a>
        </div>
      </div>
    );
  }

  return (
    <div className="card-page">
      {card.is_locked ? (
        <LockedMode
          card={card}
          predictions={predictions}
          onPredictionsUpdated={handlePredictionsUpdated}
        />
      ) : (
        <DraftMode
          card={card}
          predictions={predictions}
          onPredictionAdded={handlePredictionAdded}
          onCardLocked={handleCardLocked}
          onPredictionsUpdated={handlePredictionsUpdated}
        />
      )}
    </div>
  );
}
