/**
 * Panto agent endpoint — Vercel Serverless Function.
 *
 * POST /api/agent  { message, role, history?, platforms?, username? }
 * → text/event-stream, `data: <chunk>\n\n` per token.
 *
 * Brain:     Groq (free tier) → xAI Grok fallback. Streaming chat.completions.
 * Door 1:    /api/social-search — Groq-routed, Exa platform-scoped discovery
 *            (Instagram, TikTok, LinkedIn, X) + broad Exa fallback.
 * Door 2:    /api/profile-check — qeeqbox/social-analyzer (1000+ platforms)
 *            verifies social footprint when a username is mentioned.
 * Demo mode: no keys → deterministic simulated agent (always works).
 *
 * Keys are server-only (never shipped to the browser).
 */

// ── Config ────────────────────────────────────────────────────────────────────
const LLM_KEY   = process.env.GROQ_API_KEY || process.env.XAI_API_KEY
const LLM_BASE  = process.env.LLM_API_BASE ||
  (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.x.ai/v1')
const LLM_MODEL = process.env.LLM_MODEL ||
  (process.env.GROQ_API_KEY ? 'openai/gpt-oss-120b' : 'grok-4-fast')
const LLM_MODEL_FALLBACKS = process.env.GROQ_API_KEY
  ? ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'allam-2-7b']
  : []

// Internal API base — same Vercel deployment
const INTERNAL_BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const maxDuration = 60

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Panto, the AI sourcing and matchmaking agent built specifically for food tech.
Panto means "door" in Sundanese. You open five doors between food-tech buyers and sellers:
1. Discovery   — deep search across Instagram, TikTok, LinkedIn, X, WhatsApp communities.
2. Compliance  — verify social footprint, food/agri certifications, and legitimacy.
3. Warm Intro  — hyper-personalized introduction drafts for both sides.
4. Negotiation — briefs with volume, quality, and market context.
5. Follow-Up   — persistent, gentle follow-up until the deal closes or clearly dies.

RULES:
- Plain language. Short paragraphs. Warm and direct, never corporate.
- Show your reasoning briefly — the user should see WHY each match is promising.
- When citing search results, name the platform and link: e.g. "📸 @greenfarm on Instagram (instagram.com/greenfarm)".
- Never fabricate suppliers, prices, certifications, or contact details.
- You draft; the user approves. Never claim to have sent anything.
- Always suggest the next concrete step (approve a draft, pick platforms, verify a profile).`

const PLATFORM_NOTE = {
  buying:  'The user is BUYING (seeds, land, ingredients, packaging, equipment, finished goods). Find and verify suppliers.',
  selling: 'The user is SELLING (produce, inputs, equipment, processing capacity). Find verified buyers.',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ssePayloads(stream) {
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
          if (t.startsWith('data:')) yield t.slice(5).trim()
        }
      }
    },
  }
}

// ── Door 1: Platform-scoped social search (Groq routing + Exa) ───────────────
async function socialSearch(message, role, platforms) {
  try {
    const res = await fetch(`${INTERNAL_BASE}/api/social-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `${role === 'selling' ? 'buyers of' : 'suppliers of'} ${message}`.slice(0, 300),
        role,
        platforms: platforms || [],
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    const data = await res.json()

    if (!data.results?.length) return data.plan ? `Search plan: ${data.plan}` : null

    const lines = [`${data.plan || ''}`, '']
    data.results.forEach((r, i) => {
      lines.push(
        `${i + 1}. ${r.emoji || '🔍'} [${r.label}] ${r.title} — ${r.url}` +
        (r.relevance ? ` (relevance: ${(r.relevance * 100).toFixed(0)}%)` : '') +
        (r.snippet ? `\n   ${r.snippet.slice(0, 300)}` : '')
      )
    })
    return lines.join('\n')
  } catch {
    return null
  }
}

// ── Door 2: Profile verification via social-analyzer ─────────────────────────
async function profileCheck(username) {
  if (!username) return null
  try {
    const res = await fetch(`${INTERNAL_BASE}/api/profile-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, filter: 'good' }),
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.profiles?.length) return `No confirmed profiles found for @${username}.`

    const found = data.profiles.filter((p) => p.rate >= 60)
    if (!found.length) return `@${username} checked — no high-confidence profiles found.`

    const lines = [data.summary, '']
    found.slice(0, 6).forEach((p) => {
      lines.push(`• ${p.platform}: ${p.url}${p.title ? ` — "${p.title}"` : ''} (${p.confidence} confidence)`)
    })
    return lines.join('\n')
  } catch {
    return null
  }
}

// ── Extract username if mentioned in message ──────────────────────────────────
function extractUsername(message) {
  // Match @username or "username X" or "verify X" or "check X"
  const atMatch = message.match(/@([a-z0-9._-]{2,30})/i)
  if (atMatch) return atMatch[1].toLowerCase()
  const verbMatch = message.match(/(?:verify|check|profile|compliance)[:\s]+([a-z0-9._-]{2,30})/i)
  if (verbMatch) return verbMatch[1].toLowerCase()
  return null
}

// ── Demo mode simulated reply ─────────────────────────────────────────────────
function simulatedReply(message, role) {
  const t = message.toLowerCase()
  const topic =
    /seed/.test(t)                      ? 'organic seed suppliers'
    : /land|hectare|acre/.test(t)       ? 'landowners and farm plots'
    : /packag|carton|label|pouch/.test(t) ? 'food packaging manufacturers'
    : /equipment|machine|process/.test(t) ? 'food-processing equipment makers'
    : 'food-tech suppliers and buyers'
  return `Opening the door 🔓

You said: "${message}". Here's how I'd hunt for **${topic}**${role === 'selling' ? ' — and buyers for what you sell' : ''}:

1. **Door 1 — Discovery** 📸🎵💼𝕏  
   Groq routes your query to the right platforms, then Exa finds active ${topic} there.

2. **Door 2 — Compliance** 🔍  
   qeeqbox/social-analyzer checks 1000+ platforms for a real social footprint before any intro.

3. **Door 3 — Warm Intro** ✉️  
   I draft a personalized message for both sides — you approve before anything is sent.

⚠️ Demo mode — add a GROQ_API_KEY to activate the live brain + social search.

Which platforms do you want me to search first? (Instagram, TikTok, LinkedIn, X)`
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' }); return
  }

  const message  = String(body?.message || '').slice(0, 4000)
  const role     = body?.role === 'selling' ? 'selling' : 'buying'
  const history  = Array.isArray(body?.history)
    ? body.history.slice(-8).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content || '').slice(0, 4000),
      }))
    : []
  const platforms = Array.isArray(body?.platforms) ? body.platforms : []
  const explicitUsername = body?.username ? String(body.username).trim() : null

  if (!message.trim()) { res.status(400).json({ error: 'message is required' }); return }

  // ── Demo mode ─────────────────────────────────────────────────────────────
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

  // ── Live mode: run Door 1 + Door 2 in parallel ────────────────────────────
  const username = explicitUsername || extractUsername(message)
  const isComplianceRequest = /verify|compliance|check|legit|certified/i.test(message)

  const [socialResults, profileResults] = await Promise.all([
    socialSearch(message, role, platforms),
    // Only run profile-check if a username is found or explicitly requested
    (username || isComplianceRequest) ? profileCheck(username) : Promise.resolve(null),
  ])

  // ── Build context block for the LLM ──────────────────────────────────────
  const contextParts = []

  if (socialResults) {
    contextParts.push(`DOOR 1 — SOCIAL DISCOVERY (cite platform + URL when referencing these):\n${socialResults}`)
  } else {
    contextParts.push('DOOR 1 — No live social results this turn. Describe what you would search and why.')
  }

  if (profileResults) {
    contextParts.push(`DOOR 2 — COMPLIANCE CHECK (social-analyzer, 1000+ platforms):\n${profileResults}`)
  }

  const contextBlock = contextParts.join('\n\n---\n\n')

  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\nCONTEXT: ${PLATFORM_NOTE[role]}` },
    ...history,
    { role: 'user', content: `${contextBlock}\n\n---\n\nUSER MESSAGE: ${message}` },
  ]

  // ── LLM streaming ─────────────────────────────────────────────────────────
  try {
    const candidates = [LLM_MODEL, ...LLM_MODEL_FALLBACKS]
    let upstream = null
    let usedModel = null
    const attemptLog = []

    for (const model of candidates) {
      const extra = model.includes('qwen')    ? { reasoning_effort: 'none' }
        : model.includes('gpt-oss')           ? { reasoning_effort: 'low' }
        : {}
      const r = await fetch(`${LLM_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LLM_KEY}`,
        },
        body: JSON.stringify({ model, messages, stream: true, temperature: 0.6, max_tokens: 2000, ...extra }),
        signal: AbortSignal.timeout(55000),
      })
      if (r.ok && r.body) { upstream = r; usedModel = model; break }
      const errText = `${model}: ${r.status} ${(await r.text().catch(() => '')).slice(0, 200)}`
      attemptLog.push(errText)
      console.error(`LLM error (${LLM_BASE}):`, errText)
      if (r.status === 401 || r.status === 403) break
    }

    if (!upstream) {
      res.setHeader('X-Panto-Debug', `no-upstream | ${attemptLog.join(' || ').slice(0, 400)}`)
      const fallback = simulatedReply(message, role)
      res.status(200)
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.write(`data: ${JSON.stringify(fallback)}\n\n`)
      res.end()
      return
    }

    res.status(200)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    let wrote = 0
    for await (const payload of ssePayloads(upstream.body)) {
      if (payload === '[DONE]') break
      try {
        const json = JSON.parse(payload)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) { wrote += delta.length; res.write(`data: ${JSON.stringify(delta)}\n\n`) }
      } catch { /* ignore keepalives */ }
    }
    if (wrote === 0) {
      res.setHeader('X-Panto-Debug', `empty-stream-from-${usedModel}`)
      console.error(`Empty stream from ${usedModel} — emitting fallback`)
      res.write(`data: ${JSON.stringify(simulatedReply(message, role))}\n\n`)
    }
    res.end()
  } catch (err) {
    console.error('Agent handler error:', err?.message || err)
    if (!res.headersSent) {
      res.status(200)
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    }
    res.write(`data: ${JSON.stringify('\n\n(Panto hit a snag — try again in a moment.)')}\n\n`)
    res.end()
  }
}
