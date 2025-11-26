const SESSION_KEY = 'bingo2026_session_id'

function generateUUID(): string {
  return crypto.randomUUID()
}

export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = generateUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}
