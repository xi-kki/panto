# 📋 Panto — TODO

## ✅ DONE (v0.2 — live: https://panto-mu.vercel.app)
- [x] Landing per PRD v5: door video hero, toggle + crossfade, doormat CTA, footprints, social FAB, chat widget
- [x] Chat workspace (widget + `#/chat`): quick prompts, streaming, Approve/Edit/Nudge/Mark Closed
- [x] Seamless demo auth (email + 6-digit code, auto-filled)
- [x] `/api/agent` serverless brain: Groq `openai/gpt-oss-120b` + fallback chain, simulated fallback
- [x] Live e2e verified on production; SSE parser bug fixed
- [x] Security audit (5-point): clean — no hardcoded keys, no console.log, key never committed

## ✅ HARDENING (done — CI green on GitHub Actions)
- [x] ESLint (flat config, React + Node + tests globals) — `npm run lint` → clean
- [x] Vitest suite on `api/agent.js` (7 tests: demo mode, validation, LLM-fail fallback, SSE regression) — `npm test` → 7/7
- [x] GitHub Actions CI: lint → test → build → secret scan on every push/PR
- [x] Brought parallel-session endpoints to standard: `api/social-search.js` (Door 1 platform-scoped search, now on gpt-oss-120b) + `api/profile-check.js` (Door 2 footprint checks)
- [ ] Verify `/api/social-search` + `/api/profile-check` response times from prod (slow from dev network; test in browser)

## 🔜 TODO (waiting on user)
### Supabase auth — real magic-link emails
- [ ] User creates free project: https://index.trygravity.ai/go/508e0e06-4bd5-4c4f-b8c2-df8cf4452bcf
- [ ] User pastes `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- [ ] Wire `signInWithOtp`/`verifyOtp` in `src/lib/auth.js` (marked `// SUPABASE:`) · `npm i @supabase/supabase-js`
- [ ] Add env vars in Vercel → redeploy → verify sign-in on prod

### Exa discovery (Door 1) — live search
- [ ] User gets key at https://exa.ai → pastes `EXA_API_KEY`
- [ ] Add to Vercel → done (code already wired in `api/agent.js`)

### Security hygiene
- [ ] Rotate `GROQ_API_KEY` at console.groq.com (was pasted in chat) → update Vercel env

## 🗺️ LATER (v0.3+)
- [ ] Supabase tables: users, matches, deals, follow_ups
- [ ] Door-5 scheduler: cron nudges on stale deals (user-approved sends only)
- [ ] Telegram bot (same `/api/agent` brain)
- [ ] Full chat workspace sidebars (PRD §8)
- [ ] Polish: compare landing vs `docs/ui-reference.png`
