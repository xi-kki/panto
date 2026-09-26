/**
 * Panto agent endpoint — Vercel Serverless Function.
 *
 * POST /api/agent  { message, role, history? }
 * → text/event-stream, `data: <chunk>\n\n` per token.
 *
 * Brain:   Any OpenAI-compatible provider — Groq first (free tier), xAI Grok
 *          as fallback. Streaming chat.completions.
 * Search:  Exa (/search) for Door 1 — Discovery, formatted into the prompt.
 * Fallback: no keys configured → deterministic simulated agent (demo works,
 *           zero secrets on a public deploy).
 *
 * Keys are server-only (never shipped to the browser).
 */

// ── Config — provider chain: Groq (free tier) → xAI Grok → demo mode ──────────────────────────────────────────────────────────────
const LLM_KEY = process.env.GROQ_API_KEY || process.env.XAI_API_KEY
const LLM_BASE =
  process.env.LLM_API_BASE ||
  (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.x.ai/v1')
const LLM_MODEL =
  process.env.LLM_MODEL ||
  (process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'grok-4-fast')
const EXA_KEY = process.env.EXA_API_KEY
const EXA_BASE = process.env.EXA_API_BASE || 'https://api.exa.ai'

export const maxDuration = 60

// ── Panto system prompt (stable prefix → cheap provider-side caching) ──
const SYSTEM_PROMPT = `You are Panto, the AI sourcing and matchmaking agent built specifically for food tech.
Panto means "door" in Sundanese. You open five doors between food-tech buyers and sellers:
1. Discovery — deep search across the platforms the user prefers (Instagram, TikTok, LinkedIn, X, WhatsApp communities).
2. Compliance — check food/agricultural certifications and legitimacy before any introduction.
3. Warm Intro — hyper-personalized introduction drafts for both sides.
4. Negotiation Prep — briefs with volume, quality, and market context.
5. Deal Follow-Up — persistent, gentle follow-up until the deal closes or clearly dies.

RULES:
- Plain language. Short paragraphs. Warm and direct, never corporate.
- Show your reasoning briefly — the user should see WHY each match is promising.
- Never fabricate specific suppliers, prices, certifications, or contact details. If you have no live search results, say what you WOULD search and what to verify.
- You draft; the user approves. Never claim to have sent anything.
- Suggest the next concrete step (approve a draft, pick platforms, verify a certificate).`

const PLATFORM_NOTE = {
  buying: 'The user is BUYING (seeds, land, ingredients, packaging, equipment, finished goods). Help them find and verify suppliers.',
  selling: 'The user is SELLING (produce, inputs, equipment, processing capacity). Help them reach verified buyers.',
}

// ── Helpers ─────────────────────────────────────────────────────────────
function sseChunks(stream) {
  const enc = new TextEncoder()
  const reader = stream.getReader()
  const dec = new TextDecoder()
  let buf = ''
  return {
    async *[Symbol.asyncIterator]() {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() || ''
        for (const line of lines) {
          const t = line.trim()
          if (t.startsWith('data:')) yield enc.encode(t.slice(5).trim() + '\n\n')
        }
      }
    },
  }
}

function sseResponse(gen, status = 200) {
  return new Response(gen, {
    status,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

/** Door 1 — Discovery via Exa. Returns formatted context or null. */
async function exaSearch(query) {
  if (!EXA_KEY) return null
  try {
    const res = await fetch(`${EXA_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': EXA_KEY },
      body: JSON.stringify({
        query,
        numResults: 6,
        startPublishedDate: new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10),
        contents: { text: { maxCharacters: 700 } },
      }),
      signal: AbortSignal.timeout(9000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const results = (data.results || []).map(
      (r, i) => `${i + 1}. ${r.title || 'Untitled'} — ${r.url}\n   ${String(r.text || '').replace(/\s+/g, ' ').slice(0, 400)}`
    )
    return results.length ? results.join('\n\n') : null
  } catch {
    return null // search failure must never break the chat
  }
}

/** Fallback simulated agent (used when no LLM provider key is configured). */
function simulatedReply(message, role) {
  const t = message.toLowerCase()
  const topic = /seed/.test(t) ? 'organic seed suppliers'
    : /land|hectare|acre/.test(t) ? 'landowners and farm plots'
    : /packag|carton|label|pouch/.test(t) ? 'food packaging manufacturers'
    : /equipment|machine|process/.test(t) ? 'food-processing equipment makers'
    : 'food-tech suppliers and buyers'
  return `Opening the door 🔓

You said: "${message}". Here's how I'd hunt for **${topic}**${role === 'selling' ? ' — and buyers for what you sell' : ''}:

1. **Discovery** — I'd sweep Instagram, TikTok, LinkedIn, X and WhatsApp communities for active ${topic}, prioritized by your preferred platforms.
2. **Compliance** — for each candidate, I'd verify food/agri certifications and legitimacy before proposing an intro.
3. **Warm intro** — I'd draft a personalized message for both sides for your approval.

⚠️ Demo mode: the live Groq/Grok brain + search activates as soon as an API key is configured on the server.

Tell me: which platforms matter most to you — Instagram, TikTok, LinkedIn, or X?`
}

// ── Handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' })
    return
  }

  const message = String(body?.message || '').slice(0, 4000)
  const role = body?.role === 'selling' ? 'selling' : 'buying'
  const history = Array.isArray(body?.history)
    ? body.history.slice(-8).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content || '').slice(0, 4000),
      }))
    : []

  if (!message.trim()) {
    res.status(400).json({ error: 'message is required' })
    return
  }

  // ── Demo mode: no key → simulated stream ──
  if (!LLM_KEY) {
    const reply = simulatedReply(message, role)
    res.status(200)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    for (let j = 0; j < reply.length; j += 6) {
      res.write(`data: ${JSON.stringify(reply.slice(j, j + 6))}\n\n`)
      await new Promise((r) => setTimeout(r, 10))
    }
    res.end()
    return
  }

  // ── Live mode: Exa discovery (Door 1) + LLM streaming ──
  const discovery = await exaSearch(
    `${role === 'selling' ? 'buyers of' : 'suppliers of'} ${message}`.slice(0, 300)
  )
  const contextBlock = discovery
    ? `LIVE SEARCH RESULTS (Exa, last 12 months — cite these when relevant, never invent others):\n${discovery}`
    : 'No live search results this turn. Describe your search plan and what to verify; do not invent suppliers.'

  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\nCONTEXT: ${PLATFORM_NOTE[role]}` },
    ...history,
    { role: 'user', content: `${contextBlock}\n\nUSER MESSAGE: ${message}` },
  ]

  try {
    const upstream = await fetch(`${LLM_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        stream: true,
        temperature: 0.6,
        max_tokens: 900,
      }),
      signal: AbortSignal.timeout(55000),
    })

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '')
      console.error(`LLM error (${LLM_BASE} / ${LLM_MODEL}):`, upstream.status, detail.slice(0, 300),
        '| Hint: if 404/ model_not_found, set LLM_MODEL to an id from console.groq.com/docs/models')
      const fallback = simulatedReply(message, role)
      res.status(200)
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.write(`data: ${JSON.stringify(fallback)}\n\n`)
      res.end()
      return
    }

    // Pass through Grok's SSE, normalizing OpenAI-style deltas to plain chunks
    res.status(200)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    for await (const evt of sseChunks(upstream.body)) {
      // evt is an encoded `data: {...}\n\n` line already
      const raw = new TextDecoder().decode(evt)
      const payload = raw.slice(6).trim() // strip "data: "
      if (payload === '[DONE]') break
      try {
        const json = JSON.parse(payload)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) res.write(`data: ${JSON.stringify(delta)}\n\n`)
      } catch {
        /* ignore keepalives/malformed frames */
      }
    }
    res.end()
  } catch (err) {
    console.error('Agent handler error:', err?.message || err)
    if (!res.headersSent) {
      res.status(200)
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    }
    res.write(`data: ${JSON.stringify('\n\n(Panto hit a snag reaching the live brain — try again in a moment.)')}\n\n`)
    res.end()
  }
}
