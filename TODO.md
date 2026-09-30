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
- [x] Verified prod response times: `/api/social-search` 0.6–1.1s, `/api/profile-check` ~1.0s (correct payload `{username, platform}`) — both HTTP 200
- [x] Fixed door videos not rendering: source MP4s were MPEG-4 Part 2 (browser-incompatible) → re-encoded to H.264/yuv420p +faststart (40% smaller). Commit + redeploy required.

## ✅ SUPABASE AUTH (done — verified in prod bundle)
- [x] Keys configured in `.env` + Vercel (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`)
- [x] `signInWithOtp`/`verifyOtp` wired in `src/lib/auth.js`
- [x] Deployed — `signInWithOtp` + `supabase.co` confirmed in production bundle (2026-09-30)

## 🔜 TODO (waiting on user)
### Supabase auth — verify real magic-link email lands
- [ ] Send one real OTP sign-in on https://panto-mu.vercel.app and confirm the email arrives (requires Supabase SMTP or default sender rate limits)

### Exa discovery (Door 1) — live search
- [ ] User gets key at https://exa.ai → pastes `EXA_API_KEY`
- [ ] Add to Vercel → done (code already wired in `api/agent.js`)

### Exa discovery (Door 1) — live search
- [ ] User gets key at https://exa.ai → pastes `EXA_API_KEY`
- [ ] Add to Vercel → done (code already wired in `api/agent.js`)

### Security hygiene
- [ ] Rotate `GROQ_API_KEY` at console.groq.com (was pasted in chat) → update Vercel env

## 🗺️ LATER (v0.3+)
- [ ] Supabase tables: users, matches, deals, follow_ups
- [ ] Door-5 scheduler: cron nudges on stale deals (user-approved sends only)
- [ ] Telegram bot (same `/api/agent` brain)
- [ ] Polish: compare landing vs `docs/ui-reference.png`
