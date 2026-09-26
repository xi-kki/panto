# Panto Agent Brain — Toolkit (Tools, Skills, MCPs)

> What the Panto agent gets access to, to deliver the Five Doors (PRD §3) for
> food-tech founders, farmers, suppliers, and anyone in the food chain.

**Design rule (PRD §9):** prefer composition over new code — free repos, free MCP
tools, and skills first. **Approval-gated:** Panto researches and drafts; the user
always approves intros and sends. Automated sending without approval is out of scope.

## The Five Doors → Toolkit mapping

| Door | What Panto does | Tools / Skills / MCPs |
|------|-----------------|----------------------|
| **1. Discovery** | Deep search across Instagram, TikTok, Snapchat, LinkedIn, X per user's platform prefs | **Bright Data MCP** (web unlocker + structured data for IG/TikTok/LinkedIn/X), **Exa** (semantic web search), **Tavily** (agent-native search + answer synthesis), **agent-reach** (16-platform lookup incl. Reddit, X, GitHub), web-search skills |
| **2. Compliance** | Check food/agri certifications, legitimacy before intros | Exa/Tavily (regulatory lookup, recall databases), open-source **image-to-text/OCR** for certificate verification, NAFDAC/FDA/EU TRACES list lookups via search APIs |
| **3. Warm Intro** | Hyper-personalized draft messages for both sides | **Grok API (xAI)** — reasoning + drafting, with prompt caching + task budgets; brand-voice skill for tone-matched drafts |
| **4. Negotiation Prep** | Briefs with volume, quality, market context | Exa/Tavily deep research (commodity prices, market reports), agent-reach (community intelligence: what suppliers/buyers say), memory stores for deal context |
| **5. Deal Follow-Up** | Persistent monitoring + gentle nudges over weeks/months | Long-horizon **memory** (Supabase/Postgres), scheduled cron nudges, deal-state tracking (deal age, last touch, next action), approval-gated send via WhatsApp/Telegram/Email/LinkedIn |

## Stack summary

| Layer | Choice | Why |
|-------|--------|-----|
| Reasoning | **Grok API (xAI)** | PRD-specified; strong reasoning for drafting + match explanation. Cache the stable Panto system prompt, route simple tasks to cheaper tiers |
| Deep search | **Exa + Tavily** | Exa for semantic "find suppliers of X" queries; Tavily for structured answers + raw content extraction |
| Social sourcing | **Bright Data MCP** | Handles JS-heavy platforms + bot detection (Instagram, TikTok, LinkedIn, X) — the platforms food-tech buyers/sellers actually live on |
| Community intel | **agent-reach** | 16 platforms (Reddit, X, GitHub, LinkedIn…) for market/competitor/lead signals |
| OCR | Open-source image-to-text | Verify certificates; no cost, runs anywhere |
| Memory & deals | **Supabase (Postgres)** | Matches, deals, follow-up schedule, user platform prefs; Supabase Auth for production magic-link sign-in |
| Scheduling | Cron / Supabase Edge Functions | Door 5 nudges ("Deal idle 7 days — nudge or close?") |

## Approval-gated flow (per PRD)

```
User intent → Panto searches (Doors 1–2) → Shortlist + reasoning shown
→ Draft intro (Door 3) → USER APPROVES → Send
→ Monitor + nudge (Door 5, each nudge also user-approved)
```

## Cost discipline

- Cache the Panto system prompt (stable prefix) on every Grok call
- Route: classification/extraction → cheap tier; drafting → main tier
- Cap agent loops with task budgets; batch non-urgent research (Batch API)
- Bright Data/Exa/Tavily all have free tiers — start free, scale on usage
