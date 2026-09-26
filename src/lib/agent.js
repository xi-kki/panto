/**
 * Seams for the Panto agent brain (PRD §9).
 *
 * The UI calls `sendUserMessage()` and receives a streaming reply.
 * Today it uses a local simulated agent (no keys needed — demo works).
 * Tomorrow, point `AGENT_ENDPOINT` at your backend which proxies:
 *
 *   Grok API (xAI)    → reasoning, drafting, match explanation
 *   Exa / Tavily      → deep search across the open web
 *   Bright Data MCP   → Instagram / TikTok / LinkedIn / X sourcing
 *   Supabase          → memory, deals, follow-up state
 *
 * The UI contract (async iterator of text chunks) stays identical.
 */

const AGENT_ENDPOINT = import.meta.env.VITE_AGENT_ENDPOINT || ''

const SYSTEM_PROMPT = `You are Panto, the AI sourcing and matchmaking agent for food tech.
You help buyers find the right seeds, land, ingredients, packaging, equipment, or finished
products — and help sellers reach the right buyers. You open five doors: Discovery,
Compliance, Warm Intro, Negotiation Prep, and Deal Follow-Up. You always show clear
reasoning, draft hyper-personalized intros, and the user approves every next step.`

/** Simulated demo agent — streams a scripted, intent-aware reply. */
async function* simulatedAgent(userText, role) {
  const t = userText.toLowerCase()
  const wantsSeeds = /seed|farm|acre/.test(t)
  const wantsLand = /land|plot|hectare|sell.*land/.test(t)
  const wantsPackaging = /packag|carton|label|pouch/.test(t)
  const wantsEquipment = /equipment|machine|processor|line/.test(t)

  let matches
  if (wantsSeeds) {
    matches = '3 organic seed suppliers on Instagram and 2 cooperatives on LinkedIn'
  } else if (wantsLand) {
    matches = '2 landowners listing 5–20 acre plots near you on WhatsApp groups I monitor'
  } else if (wantsPackaging) {
    matches = '4 packaging manufacturers on LinkedIn and 1 on TikTok showing production lines'
  } else if (wantsEquipment) {
    matches = '2 food-processing equipment makers on X and 1 certified reseller on LinkedIn'
  } else {
    matches = 'several potential partners across Instagram, LinkedIn, and X'
  }

  const roleLine = role === 'selling'
    ? "Since you're selling, I'll position your offer and find verified buyers."
    : "Since you're buying, I'll verify each supplier's certifications before any intro."

  const reply = `Opening the door 🔓

I searched across your preferred platforms and found ${matches}.

${roleLine}

**My plan (you approve each step):**
1. Shortlist the 3 strongest matches with visible reasoning
2. Check food/agri certifications & legitimacy (Door 2)
3. Draft a warm, hyper-personalized intro for each
4. You review → approve → I send
5. I keep following up until the deal closes or you say stop

Reply "go ahead" and I'll open Door 1 with the shortlist.`

  // Stream word-by-word for a natural feel
  for (const word of reply.split(' ')) {
    yield word + ' '
    await new Promise((r) => setTimeout(r, 18))
  }
}

/** Real agent — POST to backend, stream SSE chunks. */
async function* remoteAgent(userText, role) {
  const res = await fetch(AGENT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userText, role }),
  })
  if (!res.ok) throw new Error(`Agent endpoint error: ${res.status}`)
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
      if (line.startsWith('data: ')) yield line.slice(6)
    }
  }
}

/** Public API — same signature either way. Returns async iterator of chunks. */
export function sendUserMessage(text, { role = 'buying' } = {}) {
  return AGENT_ENDPOINT ? remoteAgent(text, role) : simulatedAgent(text, role)
}

export { SYSTEM_PROMPT }
