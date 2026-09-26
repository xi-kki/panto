# 🚪 Panto

> **Opening doors in food tech.** The AI sourcing & matchmaking agent that helps buyers find the RIGHT suppliers — and sellers reach the RIGHT buyers — then verifies, introduces, and follows through until the deal closes.

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/endpoint?url=https://i.img.shields.io/badge/Tailwind-3-38BDF8.json&logo=tailwindcss)

**Panto** (ᮕᮔ᮪ᮒᮧ — "door" in Sundanese) opens five doors: **Discovery → Compliance → Warm Intro → Negotiation Prep → Deal Follow-Up**. One conversation, plain language, zero learning curve.

## ✨ What's inside (v0.1)

- 🎬 **Cinematic door hero** — buyer/seller toggle crossfades between clockwise and anticlockwise door videos (PRD §7, exact spec: 150ms crossfade, 300ms lock)
- 🟤 **Dynamic doormat CTA** — "Open the door →" / "Continue as Buyer →" / "Continue as Seller →"
- 👣 **Ghosted footprints** — 6 prints fading toward the door (opacity 0.06 → 0.30)
- 🟢 **Chat door widget** — sage FAB breathes, shrivels on click, chat window pops with spring overshoot
- 📡 **Retractable social FAB** — WhatsApp / Telegram / LinkedIn pop out with staggered springs
- 💬 **Chat workspace** — quick prompts, streaming replies, Approve/Edit/Nudge/Mark Closed action buttons (PRD §8 actions)
- 🔐 **Seamless auth** — email + 6-digit code in one screen; demo mode auto-fills the code, Supabase-ready via env vars
- 🧠 **Agent brain seam** — `src/lib/agent.js` streams a simulated agent today; point `VITE_AGENT_ENDPOINT` at your backend (Grok + Exa + Bright Data MCP) and the UI is unchanged
- ♿ **`prefers-reduced-motion`** — videos hidden, animations disabled
- 📱 **Mobile** — chat becomes a 70vh bottom sheet

## 🚀 Quick start

```bash
npm install
npm run dev      # → http://localhost:5173
npm run build    # production build → dist/
```

## 🎨 Palette (PRD-specified)

| Role | Hex | Token |
|---|---|---|
| Background | `#FAF9F6` | `cream` |
| Text | `#1A1A1A` | `charcoal` |
| Accent/CTA | `#C45C26` | `terracotta` |
| Doormat/widget | `#8A9A7B` | `sage` |
| Success | `#4A7043` | `sage-dark` |
| Borders | `#E8E4DE` | `border` |

## 🏗️ Architecture

```
Landing (door hero)                /chat (full workspace)
   │  toggle → crossfade videos        │
   │  doormat CTA ────────────────►    │
   ▼                                   ▼
ChatDoorWidget ◄──── same ChatWorkspace component ────►
   │
   ▼
lib/agent.js ──► simulated demo agent (today)
   │            ──► VITE_AGENT_ENDPOINT → backend proxy (tomorrow):
   │                 Grok API · Exa · Tavily · Bright Data MCP · Supabase
   ▼
lib/auth.js ──► demo email-code auth (today) → Supabase magic link (tomorrow)
```

**Agent toolkit (full doc: [`docs/AGENT-TOOLKIT.md`](docs/AGENT-TOOLKIT.md)):** Grok API for reasoning/drafting · Exa + Tavily for deep search · Bright Data MCP for Instagram/TikTok/LinkedIn/X sourcing · open-source OCR for certificate checks · Supabase for memory + deals + follow-up scheduling. Everything is **approval-gated** — Panto drafts, you send.

## 📁 Structure

```
src/
├── components/
│   ├── chat/            # ChatWorkspace + AuthGate (shared)
│   ├── ChatDoorWidget.jsx
│   ├── SocialFab.jsx
│   └── Footprints.jsx
├── lib/                 # agent.js · auth.js · useRouter.js
├── pages/               # Landing.jsx · ChatPage.jsx
├── App.jsx
└── index.css
public/assets/           # Panto_Door_Clockwise/Anticlockwise.mp4
docs/                    # PRD.md · AGENT-TOOLKIT.md · ui-reference.png
```

## 🗺️ Roadmap

- [x] v0.1 — Landing (door videos, toggle, doormat, footprints, FABs, widget) + chat + seamless demo auth
- [ ] v0.2 — Real agent backend (Grok + Exa + Bright Data) behind `VITE_AGENT_ENDPOINT`
- [ ] v0.3 — Supabase auth + deals/matches tables + follow-up scheduler (Door 5)
- [ ] v0.4 — Telegram bot interface (same brain)
- [ ] v0.5 — Chat workspace with left/right sidebars (PRD §8 full spec)

## 📄 License

MIT
