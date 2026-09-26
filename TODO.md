# 📋 Panto — TODO

## ✅ DONE (v0.2 — live)
- [x] Landing per PRD v5: door video hero, buyer/seller toggle + crossfade, doormat CTA, footprints, social FAB, chat widget
- [x] Chat workspace (widget + `#/chat`): quick prompts, streaming, Approve/Edit/Nudge/Mark Closed
- [x] Seamless demo auth (email + 6-digit code, auto-filled)
- [x] `/api/agent` serverless brain: Groq `openai/gpt-oss-120b` + fallback chain, simulated fallback
- [x] Deployed: https://panto-mu.vercel.app · GitHub: xi-kki/panto (public)

## 🔜 NEXT (in order)
### 1. Supabase auth (real magic-link emails) — needs user keys
- [ ] User creates project: https://index.trygravity.ai/go/508e0e06-4bd5-4c4f-b8c2-df8cf4452bcf (free)
- [ ] User pastes `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- [ ] Swap demo code path in `src/lib/auth.js` (marked `// SUPABASE:`) for `signInWithOtp`/`verifyOtp`
- [ ] Add env vars in Vercel → redeploy → verify sign-in on prod
- [ ] Install `@supabase/supabase-js`

### 2. Exa live discovery (Door 1) — needs user key
- [ ] User gets key at https://exa.ai → paste `EXA_API_KEY`
- [ ] Add to Vercel → done (code already wired in `api/agent.js`)

### 3. Security hygiene
- [ ] Rotate `GROQ_API_KEY` at console.groq.com (was pasted in chat) → update Vercel env

### 4. Polish
- [ ] Compare landing vs `docs/ui-reference.png`, fix mismatches
- [ ] Mobile walkthrough (chat bottom-sheet, FAB positions)

### 5. Roadmap v0.3+
- [ ] Supabase tables: users, matches, deals, follow_ups
- [ ] Door-5 scheduler: cron nudges on stale deals (user-approved sends only)
- [ ] Telegram bot (same `/api/agent` brain)
- [ ] Full chat workspace sidebars (PRD §8)
