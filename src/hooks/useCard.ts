import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCardBySlug } from '../lib/api'
import type { CardWithPredictions, Prediction } from '../lib/types'

export function useCard(slug: string) {
  const [card, setCard] = useState<CardWithPredictions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCardBySlug(slug)
      setCard(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load card')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchCard()
  }, [fetchCard])

  // Real-time subscription for predictions
  useEffect(() => {
    if (!card) return

    const channel = supabase
      .channel(`card-${card.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'predictions',
          filter: `card_id=eq.${card.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCard(prev => prev ? {
              ...prev,
              predictions: [...prev.predictions, payload.new as Prediction]
            } : null)
          } else if (payload.eventType === 'UPDATE') {
            setCard(prev => prev ? {
              ...prev,
              predictions: prev.predictions.map(p =>
                p.id === payload.new.id ? payload.new as Prediction : p
              )
            } : null)
          } else if (payload.eventType === 'DELETE') {
            setCard(prev => prev ? {
              ...prev,
              predictions: prev.predictions.filter(p => p.id !== payload.old.id)
            } : null)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cards',
          filter: `id=eq.${card.id}`,
        },
        (payload) => {
          setCard(prev => prev ? { ...prev, ...payload.new } : null)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [card?.id])

  return { card, loading, error, refetch: fetchCard }
}
