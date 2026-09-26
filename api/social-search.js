/**
 * Panto social-search endpoint — Vercel Serverless Function.
 * Inspired by socai-io/jev-social bounded-decision pattern.
 *
 * POST /api/social-search  { query, role, platforms? }
 * → JSON: { results, plan, routing }
 *
 * Architecture:
 *   Step 1 — Grok (xAI) or Groq decides which platforms to search (bounded routing decision)
 *   Step 2 — Exa searches each platform with domain scoping (instagram.com, tiktok.com, etc.)
 *   Step 3 — Grok re-ranks results by relevance + confidence
 *   Step 4 — Returns structured evidence to /api/agent for Door 1 Discovery
 *
 * Uses existing keys — no new accounts needed:
 *   XAI_API_KEY  → Grok-4 for routing & re-ranking (preferred)
 *   GROQ_API_KEY → Groq llama as fallback
 *   EXA_API_KEY  → Platform-scoped Exa search
 */

// ── LLM config — Groq first, xAI fallback, same chain as agent.js ──────────
const GROQ_KEY = process.env.GROQ_API_KEY
const XAI_KEY = process.env.XAI_API_KEY
const LLM_KEY = GROQ_KEY || XAI_KEY
const LLM_BASE =
  process.env.LLM_API_BASE ||
  (GROQ_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.x.ai/v1')
const LLM_MODEL = GROQ_KEY ? 'openai/gpt-oss-120b' : 'grok-4-fast'
// gpt-oss/qwen are reasoning models — cap thinking on small JSON tasks
const LLM_EXTRA = GROQ_KEY ? { reasoning_effort: 'low' } : {}

const EXA_KEY = process.env.EXA_API_KEY
const EXA_BASE = process.env.EXA_API_BASE || 'https://api.exa.ai'

// ── Platform definitions ──────────────────────────────────────────────────────
const PLATFORMS = {
  instagram: {
    domain: 'instagram.com',
    label: 'Instagram',
    emoji: '📸',
    description: 'Food brands, artisan producers, visual product showcases',
  },
  tiktok: {
    domain: 'tiktok.com',
    label: 'TikTok',
    emoji: '🎵',
    description: 'Consumer food brands, viral products, creator-driven suppliers',
  },
  linkedin: {
    domain: 'linkedin.com',
    label: 'LinkedIn',
    emoji: '💼',
    description: 'B2B companies, procurement managers, food-tech professionals',
  },
  x: {
    domain: 'twitter.com',
    label: 'X (Twitter)',
    emoji: '𝕏',
    description: 'Market signals, industry news, community discussion',
  },
}

// ── Step 1: Grok decides which platforms to search ───────────────────────────
async function routePlatforms(query, role, requestedPlatforms) {
  const available = requestedPlatforms.length
    ? requestedPlatforms.filter((p) => PLATFORMS[p])
    : Object.keys(PLATFORMS)

  // No LLM → deterministic routing
  if (!LLM_KEY) {
    const isBusiness = /company|manufacturer|supplier|wholesale|factory|b2b/i.test(query)
    return {
      platforms: isBusiness
        ? ['linkedin', 'x'].filter((p) => available.includes(p))
        : ['instagram', 'tiktok', 'linkedin'].filter((p) => available.includes(p)).slice(0, 2),
      reasoning: 'Deterministic routing (no LLM key configured)',
      confidence: 0.5,
    }
  }

  const platformDesc = available
    .map((p) => `- ${p}: ${PLATFORMS[p].description}`)
    .join('\n')

  try {
    const res = await fetch(`${LLM_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a platform routing model for a food-tech sourcing agent. 
Given a query and role, pick the best 1-3 platforms to search. 
Return ONLY valid JSON (no markdown):
{"platforms": ["platform1", "platform2"], "reasoning": "one sentence", "confidence": 0.0-1.0}

Available platforms:
${platformDesc}

Rules:
- LinkedIn first for B2B and professional company searches
- Instagram + TikTok for consumer brands, artisan, visual products  
- X for market signals and news
- Maximum 3 platforms. Fewer is better if the query is specific.`,
          },
          {
            role: 'user',
            content: `Query: "${query}"\nRole: ${role}\nAvailable: ${available.join(', ')}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 400,
        response_format: { type: 'json_object' },
        ...LLM_EXTRA,
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) throw new Error(`LLM routing error: ${res.status}`)
    const data = await res.json()
    const decision = JSON.parse(data.choices?.[0]?.message?.content || '{}')
    const validPlatforms = (decision.platforms || []).filter((p) => available.includes(p))

    return {
      platforms: validPlatforms.length ? validPlatforms : available.slice(0, 2),
      reasoning: decision.reasoning || 'Grok platform routing',
      confidence: typeof decision.confidence === 'number' ? decision.confidence : 0.8,
    }
  } catch (err) {
    console.warn('Platform routing fallback:', err?.message)
    return {
      platforms: available.slice(0, 2),
      reasoning: 'Fallback routing (LLM unavailable)',
      confidence: 0.5,
    }
  }
}

// ── Step 2: Exa search scoped to one platform ─────────────────────────────────
async function searchPlatform(platformKey, query, role) {
  if (!EXA_KEY) return []
  const cfg = PLATFORMS[platformKey]

  // Enrich query with role-appropriate terms
  const enriched =
    role === 'selling'
      ? `${query} buyer importer distributor`
      : `${query} supplier producer manufacturer`

  try {
    const res = await fetch(`${EXA_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': EXA_KEY },
      body: JSON.stringify({
        query: enriched,
        numResults: 5,
        includeDomains: [cfg.domain],
        startPublishedDate: new Date(Date.now() - 180 * 864e5).toISOString().slice(0, 10),
        contents: { text: { maxCharacters: 500 } },
      }),
      signal: AbortSignal.timeout(9000),
    })

    if (!res.ok) return []
    const data = await res.json()

    return (data.results || []).map((r) => ({
      platform: platformKey,
      label: cfg.label,
      emoji: cfg.emoji,
      title: r.title || 'Untitled',
      url: r.url,
      snippet: String(r.text || '').replace(/\s+/g, ' ').slice(0, 400),
      publishedDate: r.publishedDate || null,
      relevance: 0.5, // will be updated in re-rank step
    }))
  } catch {
    return []
  }
}

// ── Step 3: Grok re-ranks results by relevance ────────────────────────────────
async function rerankResults(results, query, role) {
  if (!results.length || !LLM_KEY) return results

  const resultSummaries = results
    .map((r, i) => `${i}: [${r.label}] ${r.title} — ${r.snippet.slice(0, 180)}`)
    .join('\n')

  try {
    const res = await fetch(`${LLM_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          {
            role: 'system',
            content: `Score each search result 0.0-1.0 for relevance to a food-tech sourcing query.
Return ONLY valid JSON: {"scores": [0.9, 0.4, ...]} — one score per result, in order.
Score >= 0.6 = clearly relevant. Score < 0.3 = not relevant (will be filtered).`,
          },
          {
            role: 'user',
            content: `Query: "${query}"\nRole: ${role}\n\nResults:\n${resultSummaries}`,
          },
        ],
        temperature: 0.05,
        max_tokens: 400,
        response_format: { type: 'json_object' },
        ...LLM_EXTRA,
      }),
      signal: AbortSignal.timeout(7000),
    })

    if (!res.ok) throw new Error(`Rerank error: ${res.status}`)
    const data = await res.json()
    const { scores } = JSON.parse(data.choices?.[0]?.message?.content || '{}')

    if (!Array.isArray(scores) || scores.length !== results.length) return results

    return results
      .map((r, i) => ({ ...r, relevance: typeof scores[i] === 'number' ? scores[i] : 0.5 }))
      .filter((r) => r.relevance >= 0.3)
      .sort((a, b) => b.relevance - a.relevance)
  } catch {
    return results
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ error: 'Invalid JSON' }); return
  }

  const query = String(body?.query || '').slice(0, 400).trim()
  const role = body?.role === 'selling' ? 'selling' : 'buying'
  const requestedPlatforms = Array.isArray(body?.platforms)
    ? body.platforms.map((p) => String(p).toLowerCase())
    : []

  if (!query) { res.status(400).json({ error: 'query is required' }); return }

  if (!EXA_KEY) {
    res.status(200).json({
      results: [],
      plan: '⚠️ Social search unavailable — add EXA_API_KEY to enable platform discovery.',
      routing: null,
    })
    return
  }

  // Step 1: Route
  const routing = await routePlatforms(query, role, requestedPlatforms)

  // Step 2: Search chosen platforms in parallel
  const rawResults = (
    await Promise.all(routing.platforms.map((p) => searchPlatform(p, query, role)))
  ).flat()

  // Step 3: Re-rank
  const ranked = await rerankResults(rawResults, query, role)

  // Step 4: Format
  const platformNames = routing.platforms.map((p) => PLATFORMS[p]?.label).join(', ')
  const plan = `🔍 Searched ${platformNames} via Grok routing | ${routing.reasoning} (${(routing.confidence * 100).toFixed(0)}% confidence)`

  res.status(200).json({ results: ranked.slice(0, 8), plan, routing })
}
