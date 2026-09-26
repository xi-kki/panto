/**
 * Client-side agent seam.
 *
 * POSTs to same-origin `/api/agent` (Vercel function) and yields text
 * chunks from its SSE stream.
 *
 * Server-side toolkit:
 *   Groq (groq.com) → LLM brain + platform routing  [GROQ_API_KEY]
 *   Exa             → Door 1 platform-scoped search  [EXA_API_KEY]
 *   social-analyzer → Door 2 profile verification    [no key needed]
 */

const ENDPOINT = import.meta.env.VITE_AGENT_ENDPOINT || '/api/agent'

/**
 * Send a user message; returns an async iterator of text chunks.
 *
 * @param {string} text          - The user's message
 * @param {object} opts
 * @param {string} opts.role     - 'buying' | 'selling'
 * @param {Array}  opts.history  - Previous messages [{role, content}]
 * @param {Array}  opts.platforms - Platform filter e.g. ['instagram','linkedin']
 * @param {string} opts.username - Optional @username to run compliance check on
 */
export async function* sendUserMessage(text, { role = 'buying', history = [], platforms = [], username = null } = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, role, history, platforms, username }),
  })

  if (!res.ok || !res.body) {
    throw new Error(`Agent endpoint error ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const t = line.trim()
      if (!t.startsWith('data:')) continue
      const payload = t.slice(5).trim()
      if (payload === '[DONE]') return
      try {
        yield JSON.parse(payload)
      } catch {
        yield payload
      }
    }
  }
}
