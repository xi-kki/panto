/**
 * Client-side agent seam.
 *
 * POSTs to same-origin `/api/agent` (Vercel function) and yields text
 * chunks from its SSE stream. When the server has no XAI_API_KEY it
 * streams a simulated demo reply, so the deployed app always works.
 *
 * Server-side toolkit (see docs/AGENT-TOOLKIT.md):
 *   Grok (xAI)  → reasoning + drafting       [XAI_API_KEY]
 *   Exa         → Door 1 discovery search    [EXA_API_KEY]
 *   Bright Data → IG/TikTok/LinkedIn/X       [roadmap v0.3]
 *   Supabase    → memory + deals             [roadmap v0.3]
 */

const ENDPOINT = import.meta.env.VITE_AGENT_ENDPOINT || '/api/agent'

/**
 * Send a user message; returns an async iterator of text chunks.
 * Same contract as before — UI never changed.
 */
export async function* sendUserMessage(text, { role = 'buying', history = [] } = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    context: undefined,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, role, history }),
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
        yield JSON.parse(payload) // chunks are JSON-encoded strings
      } catch {
        yield payload // tolerate plain-text chunks
      }
  }
  }
}
