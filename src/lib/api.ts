import { supabase } from './supabase'
import { generateSlug } from './slugs'
import { getSessionId } from './session'
import type { Card, Prediction, CardWithPredictions } from './types'

export async function createCard(name: string): Promise<Card> {
  let slug = generateSlug()
  let attempts = 0

  while (attempts < 3) {
    const { data, error } = await supabase
      .from('cards')
      .insert({ name, slug })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // unique violation
        slug = `${generateSlug()}-${Math.floor(Math.random() * 1000)}`
        attempts++
        continue
      }
      throw error
    }

    return data
  }

  // Fallback to UUID-based slug
  slug = `card-${crypto.randomUUID().slice(0, 8)}`
  const { data, error } = await supabase
    .from('cards')
    .insert({ name, slug })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getCardBySlug(slug: string): Promise<CardWithPredictions | null> {
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .eq('slug', slug)
    .single()

  if (cardError) {
    if (cardError.code === 'PGRST116') return null
    throw cardError
  }

  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('*')
    .eq('card_id', card.id)
    .order('created_at', { ascending: true })

  if (predError) throw predError

  return { ...card, predictions: predictions || [] }
}

export async function addPrediction(
  cardId: string,
  text: string,
  submittedBy: string
): Promise<Prediction> {
  const sessionId = getSessionId()

  const { data, error } = await supabase
    .from('predictions')
    .insert({
      card_id: cardId,
      text,
      submitted_by: submittedBy,
      session_id: sessionId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePrediction(predictionId: string): Promise<void> {
  const sessionId = getSessionId()

  const { error } = await supabase
    .from('predictions')
    .delete()
    .eq('id', predictionId)
    .eq('session_id', sessionId)

  if (error) throw error
}

export async function lockCard(cardId: string, predictions: Prediction[]): Promise<void> {
  // Shuffle predictions using Fisher-Yates
  const shuffled = [...predictions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Assign positions (0-11, 13-24, skipping 12 for free space)
  const positions = [
    ...Array.from({ length: 12 }, (_, i) => i),
    ...Array.from({ length: 12 }, (_, i) => i + 13)
  ]

  // Update each prediction with its position
  const updates = shuffled.map((pred, idx) =>
    supabase
      .from('predictions')
      .update({ position: positions[idx] })
      .eq('id', pred.id)
  )

  await Promise.all(updates)

  // Lock the card
  const { error } = await supabase
    .from('cards')
    .update({ is_locked: true })
    .eq('id', cardId)

  if (error) throw error
}

export async function togglePredictionMark(prediction: Prediction): Promise<void> {
  const { error } = await supabase
    .from('predictions')
    .update({
      is_marked: !prediction.is_marked,
      marked_at: !prediction.is_marked ? new Date().toISOString() : null,
    })
    .eq('id', prediction.id)

  if (error) throw error
}
