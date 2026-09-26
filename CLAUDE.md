# Panto — CLAUDE.md

## 🎯 Overview
- **One-liner:** AI sourcing & matchmaking agent for food tech — opening doors between buyers and sellers.
- **Type:** Web2 (agent-ready frontend, backend seams defined)
- **Status:** 🟢 v0.1 built — landing + chat widget + auth, agent brain simulated
- **PRD:** `docs/PRD.md` (Master PRD v5 — the source of truth)

## 🏗️ Tech Stack
- Language: JavaScript (ESM)
- Frontend: React 18 + Vite 6 + Tailwind CSS 3 + Framer Motion 11
- Backend: None yet — `src/lib/agent.js` is the seam (VITE_AGENT_ENDPOINT → your backend proxying Grok/Exa/Bright Data)
- Database: None yet — Supabase-ready (`src/lib/auth.js`), sessions in localStorage (demo)
- Auth: Seamless 2-step email code. Demo mode (auto-filled code) now; Supabase magic link via env vars
- Hosting: Any static host (Vercel/Netlify) — hash router, zero server requirements

## 🎨 Design System (NON-NEGOTIABLE — from PRD)
| Token | Hex | Use |
|---|---|---|
| `cream` | #FAF9F6 | Background |
| `charcoal` | #1A1A1A | Primary text |
| `terracotta` | #C45C26 | Accent/CTA (alt #D97941) |
| `sage` | #8A9A7B | Doormat, chat widget, secondary accent |
| `sage-dark` | #4A7043 | Success / closed deals |
| `beige` | #E9E2D8 | Inactive toggle |
| `border` | #E8E4DE | Subtle borders |
| `footprint` | #B8B0A8 | Ghosted footprints |

Feel: warm, calm, minimalist. Generous white space. Never cold tech-blue.

## 📁 Structure
```
src/
├── components/
│   ├── chat/          # ChatWorkspace, AuthGate (shared widget + page)
│   ├── ChatDoorWidget.jsx  # Floating sage door button → pop-in chat
│   ├── SocialFab.jsx       # Retractable WhatsApp/Telegram/LinkedIn FAB
│   └── Footprints.jsx      # Ghosted footprints (PRD §7)
├── lib/
│   ├── agent.js       # Agent brain seam (simulated now, backend later)
|   ├── auth.js        # Demo + Supabase-ready auth
│   └── useRouter.js   # Hash router
├── pages/
│   ├── Landing.jsx    # Door video hero + toggle + doormat + five doors
│   └── ChatPage.jsx   # Full-page chat route
├── App.jsx            # Router + role state
└── index.css          # Tailwind + breathe animation + reduced-motion
public/assets/         # Door videos (clockwise=buying, anticlockwise=selling)
docs/                  # PRD.md + ui-reference.png
```

## 🧠 Architecture
- **Data flow:** User → chat (widget or page) → `sendUserMessage()` in `lib/agent.js` → (simulated | backend SSE) → streamed reply → user approves actions (Approve/Edit/Nudge/Mark Closed buttons)
- **Key modules:**
  1. `lib/agent.js` — the brain seam. UI contract: async iterator of text chunks. Swap simulated ↔ remote via `VITE_AGENT_ENDPOINT`
  2. `lib/auth.js` — seamless auth. Demo code auto-filled; Supabase swap points marked `// SUPABASE:`
  3. `ChatWorkspace` — single chat component powering both the floating widget and `/chat` page

## 🎬 PRD Interactions (implemented)
- Toggle "I'm buying"/"I'm selling" → crossfade door videos (150ms), 300ms isAnimating lock
- Doormat CTA dynamic: "Open the door →" / "Continue as Buyer →" / "Continue as Seller →"
- Chat FAB: shrivel 1→0.8→0 (100/150ms) → window pops 0.3→1 spring (damping 18, stiffness 300, mass 0.8)
- Social FAB: staggered spring 0.05s, collapse scale 1→0.8→0 (spring damping 20, stiffness 300)
- `prefers-reduced-motion`: videos hidden, poster-style fallback, no breathing pulse

## 🔐 Security (NON-NEGOTIABLE)
1. NEVER commit .env — `.gitignore` covers it; `.env.example` documents vars
2. All keys server-side (XAI_API_KEY, EXA_API_KEY, etc. are backend-only)
3. Validate inputs (auth email/code validation in place)
4. No stack traces in user-facing errors (agent errors → friendly message)
5. Agent is approval-gated: drafts only; the user sends every message

## ✅ Quality Gates Before Ship
- [x] `npm run build` passes clean
- [x] No hardcoded secrets
- [x] .env.example present
- [x] Loading/empty/error states in chat
- [x] Mobile responsive (chat → bottom sheet 70vh on mobile)
- [ ] Agent brain connected (simulated demo works today)
- [ ] Supabase auth wired (demo auth works today)

## 🚫 What NOT To Do
- Don't add UI features outside PRD palette/motifs (door, doormat, footprints, terracotta/sage only)
- Don't auto-send outreach — PRD explicitly forbids automated sending without approval
- Don't put API keys in the client bundle
- Don't re-style existing components — they follow PRD §7 exactly
