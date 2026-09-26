/**
 * Panto profile-check endpoint — Vercel Serverless Function.
 * Powered by qeeqbox/social-analyzer (npm: social-analyzer).
 *
 * POST /api/profile-check  { username, websites?, filter?, top? }
 * → JSON: { profiles, summary, username }
 *
 * How it works:
 *   - Uses social-analyzer's fast-scan module (pure HTTPS requests, no browser)
 *   - Checks username existence across 1000+ social platforms
 *   - Returns detected profiles with rate score (0-100), link, title, type
 *   - "fast" mode = HTTP HEAD/GET checks only — runs fine on Vercel serverless
 *   - "slow"/"special" modes require geckodriver/Chrome — NOT used here
 *
 * Door 2 — Compliance: verify a supplier's real social footprint before intro.
 * Door 1 — Discovery: find a buyer/seller's existing profiles across platforms.
 *
 * No extra API keys needed. social-analyzer is self-contained.
 */

export const maxDuration = 55 // Vercel max for hobby plan

// ── The platforms most relevant for food-tech sourcing ───────────────────────
// Use these as defaults if no websites specified — checking all 1000+ is too slow
const FOODTECH_PLATFORMS = [
  'instagram',
  'tiktok',
  'linkedin',
  'twitter',
  'facebook',
  'youtube',
  'pinterest',
  'reddit',
  'github',           // for food-tech/agri-tech companies
  'snapchat',
  'telegram',
  'whatsapp',
  'shopify',          // e-commerce presence
  'etsy',             // artisan food producers
]

// ── Dynamically import social-analyzer modules ───────────────────────────────
async function loadSocialAnalyzer() {
  try {
    // social-analyzer uses ES modules internally
    const helper = await import('social-analyzer/modules/helper.js')
    const fastScan = await import('social-analyzer/modules/fast-scan.js')
    return { helper: helper.default, fastScan: fastScan.default }
  } catch (err) {
    // If internal module paths don't resolve, fall back to HTTP-based check
    console.warn('social-analyzer module import failed, using HTTP fallback:', err?.message)
    return null
  }
}

// ── Fallback: direct HTTP check for key platforms ────────────────────────────
// Used when social-analyzer module import fails (e.g. path resolution issues)
const PLATFORM_URL_TEMPLATES = {
  instagram:  'https://www.instagram.com/{username}/',
  tiktok:     'https://www.tiktok.com/@{username}',
  linkedin:   'https://www.linkedin.com/in/{username}',
  twitter:    'https://twitter.com/{username}',
  facebook:   'https://www.facebook.com/{username}',
  youtube:    'https://www.youtube.com/@{username}',
  pinterest:  'https://www.pinterest.com/{username}/',
  reddit:     'https://www.reddit.com/user/{username}',
  github:     'https://github.com/{username}',
  snapchat:   'https://www.snapchat.com/add/{username}',
  etsy:       'https://www.etsy.com/shop/{username}',
  shopify:    'https://{username}.myshopify.com',
}

async function httpCheckProfile(username, platform) {
  const template = PLATFORM_URL_TEMPLATES[platform]
  if (!template) return null

  const url = template.replace(/\{username\}/g, encodeURIComponent(username))
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      },
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
    })

    // 200 = profile likely exists, 404 = doesn't exist, others = uncertain
    if (res.status === 200) {
      return {
        platform,
        url,
        status: 'found',
        rate: 75,  // HTTP 200 = good confidence
        method: 'http_head',
      }
    }
    if (res.status === 404) {
      return {
        platform,
        url,
        status: 'not_found',
        rate: 0,
        method: 'http_head',
      }
    }
    // 429, 403, 301, etc — uncertain
    return {
      platform,
      url,
      status: 'uncertain',
      rate: 30,
      method: 'http_head',
      httpStatus: res.status,
    }
  } catch {
    return {
      platform,
      url,
      status: 'failed',
      rate: 0,
      method: 'http_head',
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

  const username = String(body?.username || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
  if (!username) {
    res.status(400).json({ error: 'username is required' }); return
  }
  if (username.length < 2 || username.length > 30) {
    res.status(400).json({ error: 'username must be 2-30 characters' }); return
  }

  // Which platforms to check — default to food-tech relevant set
  const requestedWebsites = Array.isArray(body?.websites)
    ? body.websites.map((w) => String(w).toLowerCase())
    : FOODTECH_PLATFORMS

  // filter: 'good' (high confidence), 'maybe', 'bad', or 'all'
  const filter = ['good', 'maybe', 'bad', 'all'].includes(body?.filter) ? body.filter : 'good'

  // ── Try social-analyzer first ─────────────────────────────────────────────
  let profiles = []
  let source = 'social-analyzer'

  try {
    const sa = await loadSocialAnalyzer()

    if (sa) {
      // Set up a mock request object matching social-analyzer's expected shape
      const mockReq = {
        body: {
          string: username,
          uuid: `panto-${Date.now()}`,
          websites: requestedWebsites.join(' '),
          mode: 'fast',
          output: 'json',
          options: 'link,rate,title,text',
          filter,
          profiles: 'detected',
          method: 'find',
          extract: false,
          metadata: false,
          trim: true,
        },
      }

      // Pre-select chosen websites in helper
      if (sa.helper?.websites_entries) {
        sa.helper.websites_entries.forEach((site) => {
          site.selected = requestedWebsites.some((w) => site.url?.toLowerCase().includes(w))
            ? 'true'
            : 'false'
        })
      }

      const rawResults = await sa.fastScan.find_username_normal?.(mockReq) ?? []
      profiles = (rawResults || [])
        .filter((p) => p && p.link)
        .map((p) => ({
          platform: p.type || p.link?.split('.')?.[1] || 'unknown',
          url: p.link,
          title: p.title || '',
          rate: parseInt(p.rate, 10) || 0,
          status: p.method || 'found',
          text: (p.text || '').slice(0, 200),
          confidence: p.rate >= 80 ? 'high' : p.rate >= 50 ? 'medium' : 'low',
        }))
        .sort((a, b) => b.rate - a.rate)
    } else {
      throw new Error('social-analyzer unavailable')
    }
  } catch (err) {
    // ── HTTP fallback ─────────────────────────────────────────────────────────
    console.warn('social-analyzer fallback to HTTP checks:', err?.message)
    source = 'http_fallback'

    const results = await Promise.allSettled(
      requestedWebsites
        .filter((p) => PLATFORM_URL_TEMPLATES[p])
        .map((p) => httpCheckProfile(username, p))
    )

    profiles = results
      .filter((r) => r.status === 'fulfilled' && r.value?.rate > 0)
      .map((r) => ({
        platform: r.value.platform,
        url: r.value.url,
        title: '',
        rate: r.value.rate,
        status: r.value.status,
        text: '',
        httpStatus: r.value.httpStatus,
        confidence: r.value.rate >= 75 ? 'high' : 'medium',
      }))
      .sort((a, b) => b.rate - a.rate)
  }

  // ── Build summary ─────────────────────────────────────────────────────────
  const found = profiles.filter((p) => p.status === 'found' || p.rate >= 60)
  const summary = found.length
    ? `✅ Found @${username} on ${found.length} platform${found.length > 1 ? 's' : ''}: ${found.map((p) => p.platform).join(', ')}`
    : `❓ No confirmed profiles found for @${username} on checked platforms`

  res.status(200).json({
    username,
    profiles,
    found: found.length,
    checked: requestedWebsites.length,
    summary,
    source,
    platforms: requestedWebsites,
  })
}
