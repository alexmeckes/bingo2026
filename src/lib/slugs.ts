const adjectives = [
  'happy', 'sunny', 'lucky', 'wild', 'swift', 'brave', 'calm', 'cool',
  'eager', 'fancy', 'grand', 'jolly', 'kind', 'lively', 'merry', 'nice',
  'proud', 'quick', 'royal', 'shiny', 'smart', 'super', 'witty', 'zesty'
]

const nouns = [
  'penguin', 'tiger', 'falcon', 'dolphin', 'panda', 'koala', 'phoenix',
  'dragon', 'unicorn', 'wizard', 'ninja', 'pirate', 'robot', 'rocket',
  'comet', 'crystal', 'thunder', 'voyage', 'quest', 'dream', 'spark'
]

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateSlug(): string {
  const adj = randomFrom(adjectives)
  const noun = randomFrom(nouns)
  const num = Math.floor(Math.random() * 900) + 100 // 100-999
  return `${adj}-${noun}-${num}`
}
