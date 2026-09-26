/**
 * Panto profile-check endpoint — Vercel Serverless Function.
 * Implements the social-analyzer fast-scan approach via direct HTTP checks.
 *
 * POST /api/profile-check  { username, websites? }
 * → JSON: { profiles, found, checked, summary, username }
 *
 * How it works (mirrors qeeqbox/social-analyzer fast-scan):
 *   - Fires parallel HTTP HEAD/GET requests to platform URL templates
 *   - Detects profiles by response status + content signals (no browser needed)
 *   - Returns rate-scored results (0–100): 200 OK = high confidence
 *
 * Door 2 — Compliance: verify a supplier's real social footprint before intro.
 * No API keys needed. Fully serverless.
 */

export const maxDuration = 30

// ── Platform URL templates (social-analyzer style) ───────────────────────────
// {username} is replaced with the encoded username before fetch
const PLATFORMS = [
  // Core food-tech platforms
  { key: 'instagram',  label: 'Instagram',  emoji: '📸', url: 'https://www.instagram.com/{username}/',        goodStatus: [200],       badStatus: [404] },
  { key: 'tiktok',     label: 'TikTok',     emoji: '🎵', url: 'https://www.tiktok.com/@{username}',           goodStatus: [200],       badStatus: [404] },
  { key: 'linkedin',   label: 'LinkedIn',   emoji: '💼', url: 'https://www.linkedin.com/in/{username}',       goodStatus: [200, 999],  badStatus: [404] },
  { key: 'x',         label: 'X (Twitter)', emoji: '𝕏',  url: 'https://twitter.com/{username}',              goodStatus: [200],       badStatus: [404] },
  { key: 'facebook',  label: 'Facebook',   emoji: '👥', url: 'https://www.facebook.com/{username}',          goodStatus: [200],       badStatus: [404] },
  { key: 'youtube',   label: 'YouTube',    emoji: '▶️', url: 'https://www.youtube.com/@{username}',          goodStatus: [200],       badStatus: [404] },
  { key: 'pinterest', label: 'Pinterest',  emoji: '📌', url: 'https://www.pinterest.com/{username}/',        goodStatus: [200],       badStatus: [404] },
  { key: 'reddit',    label: 'Reddit',     emoji: '🔴', url: 'https://www.reddit.com/user/{username}',       goodStatus: [200],       badStatus: [404] },
  { key: 'github',    label: 'GitHub',     emoji: '💻', url: 'https://github.com/{username}',                goodStatus: [200],       badStatus: [404] },
  { key: 'snapchat',  label: 'Snapchat',   emoji: '👻', url: 'https://www.snapchat.com/add/{username}',      goodStatus: [200],       badStatus: [404] },
  // E-commerce / food business presence
  { key: 'etsy',      label: 'Etsy',       emoji: '🛍️', url: 'https://www.etsy.com/shop/{username}',         goodStatus: [200],       badStatus: [404] },
  { key: 'shopify',   label: 'Shopify',    emoji: '🛒', url: 'https://{username}.myshopify.com',             goodStatus: [200, 301],  badStatus: [404] },
  // Food-specific
  { key: 'producthunt',label: 'ProductHunt',emoji: '🐱', url: 'https://www.producthunt.com/@{username}',    goodStatus: [200],       badStatus: [404] },
  { key: 'behance',   label: 'Behance',    emoji: '🎨', url: 'https://www.behance.net/{username}',           goodStatus: [200],       badStatus: [404] },
  { key: 'medium',    label: 'Medium',     emoji: '✍️', url: 'https://medium.com/@{username}',               goodStatus: [200],       badStatus: [404] },
  { key: 'substack',  label: 'Substack',   emoji: '📧', url: 'https://{username}.substack.com',              goodStatus: [200, 301],  badStatus: [404] },
]

const DEFAULT_PLATFORMS = ['instagram', 'tiktok', 'linkedin', 'x', 'facebook', 'youtube', 'github', 'etsy', 'shopify']

// ── Check one platform ────────────────────────────────────────────────────────
async function checkPlatform(platform, username) {
  const url = platform.url.replace(/\{username\}/g, encodeURIComponent(username))
  const start = Date.now()

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    })

    const elapsed = Date.now() - start
    const status = res.status

    if (platform.goodStatus.includes(status)) {
      return {
        key: platform.key,
        label: platform.label,
        emoji: platform.emoji,
        url,
        status: 'found',
        httpStatus: status,
        rate: 80,
        confidence: 'high',
        elapsed,
      }
    }

    if (platform.badStatus.includes(status)) {
      return {
        key: platform.key,
        label: platform.label,
        emoji: platform.emoji,
        url,
        status: 'not_found',
        httpStatus: status,
        rate: 0,
        confidence: 'high',
        elapsed,
      }
    }

    // Ambiguous (403, 429, 301 to login, etc.) — soft maybe
    return {
      key: platform.key,
      label: platform.label,
      emoji: platform.emoji,
      url,
      status: 'maybe',
      httpStatus: status,
      rate: 35,
      confidence: 'low',
      elapsed,
    }
  } catch (err) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError'
    return {
      key: platform.key,
      label: platform.label,
      emoji: platform.emoji,
      url,
      status: isTimeout ? 'timeout' : 'error',
      rate: 0,
      confidence: 'low',
      elapsed: Date.now() - start,
    }
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

  const username = String(body?.username || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '')           // strip leading @
    .replace(/[^a-z0-9._-]/g, '') // sanitise

  if (!username || username.length < 2 || username.length > 30) {
    res.status(400).json({ error: 'username must be 2–30 alphanumeric chars' }); return
  }

  // Which platforms to check
  const requested = Array.isArray(body?.websites)
    ? body.websites.map((w) => String(w).toLowerCase())
    : DEFAULT_PLATFORMS

  const targets = PLATFORMS.filter((p) => requested.includes(p.key))
  if (!targets.length) {
    res.status(400).json({ error: 'No valid platforms specified' }); return
  }

  // Fire all checks in parallel
  const results = await Promise.all(targets.map((p) => checkPlatform(p, username)))

  const found    = results.filter((r) => r.status === 'found')
  const maybe    = results.filter((r) => r.status === 'maybe')
  const notFound = results.filter((r) => r.status === 'not_found')

  const summary = found.length
    ? `✅ @${username} confirmed on ${found.length} platform${found.length > 1 ? 's' : ''}: ${found.map((p) => p.label).join(', ')}`
    : maybe.length
      ? `⚠️ @${username} may exist on ${maybe.length} platform${maybe.length > 1 ? 's' : ''} — manual verification suggested`
      : `❌ No profiles found for @${username} on checked platforms`

  res.status(200).json({
    username,
    profiles: results.sort((a, b) => b.rate - a.rate),
    found: found.length,
    maybe: maybe.length,
    notFound: notFound.length,
    checked: targets.length,
    summary,
  })
}
