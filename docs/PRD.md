
# PANTO — Master Integrated PRD v5
## The AI Sourcing & Matchmaking Agent for Food Tech
**Codename:** Panto (ᮕᮔ᮪ᮒᮧ — Sundanese for "Door")
**Tagline:** Opening doors between buyers and sellers in food tech.
**Status:** Final - Ready for Freebuff Build
**Includes:** Updated PRD v1 + v2 + Minimalist Design + Landing Spec + Chat Widget + GitHub Repos

---

### 1. VISION
Panto is a simple AI agent built specifically for the food tech industry. It helps buyers find the RIGHT seeds, land, ingredients, packaging, equipment, or finished products — and helps sellers reach the RIGHT buyers — then verifies, introduces, and follows through until the deal closes.

Users can talk to Panto in Telegram or on the web. It uses Freebuff's existing skills, free open-source repos, Grok, and free MCP tools. Everything stays lightweight, transparent, and under the user's control.

**Core strength:** Simplicity. One conversation. Clear value at every step. No complex software to learn.

### 2. THE PROBLEM (In Simple Language)
Sourcing in food tech is uniquely painful.

You want to buy seeds for your 10-acre farm. You want to buy land. You want to buy food-tech equipment. You don't have the time or patience to go through the stress of endless WhatsApp groups, cold emails, unverified suppliers, and deals that die in your inbox.

Meanwhile:
- Discovery is hard
- Trust is expensive
- Follow-up dies

Result: Lost volume, stalled projects, and unnecessary friction across the food tech supply chain.

### 3. THE SOLUTION & VALUE AT EVERY STEP — THE FIVE DOORS
Panto acts as a tireless, trustworthy food-tech sourcing partner. It opens five doors:

| Door | What happens | Value the user feels |
|------|--------------|----------------------|
| 1. Discovery | User describes intent in plain language. Panto performs deep search across platforms | Precise matches appear from Instagram, TikTok, Snapchat, LinkedIn, X, and more |
| 2. Compliance | Agent checks relevant food and agricultural certifications and legitimacy | Confidence before any intro |
| 3. Warm Intro | Hyper-personalized messages drafted for both sides | Natural, high-reply outreach |
| 4. Negotiation Prep | Briefs prepared with volume, quality, and market context | Both sides enter ready |
| 5. Deal Follow-Up | Persistent monitoring and gentle nudges over weeks/months | Deals don't die |

**Platform flexibility:** Users can tell Panto which platforms they prefer (e.g. "Focus on Instagram and TikTok" or "Prioritize LinkedIn and X"). Panto searches accordingly and surfaces matches from the chosen channels.

Users stay in control: Panto researches and drafts; the user always approves intros and next steps.

### 4. WHO USES THIS
- **Buyers:** Farmers, manufacturers, restaurants, retailers, importers looking for seeds, land, ingredients, packaging, equipment, or co-manufacturing.
- **Sellers:** Seed suppliers, landowners, processors, ingredient suppliers, packaging companies, equipment makers, and food-tech startups.
- **Admins (optional):** Oversee compliance and deal flow.

### 5. INTERFACES: Telegram + Web
- **Telegram:** Natural language chat with simple action buttons.
- **Web:** Clean, lightweight experience that mirrors the chat flow for profile management, matches, and deal tracking.
Both share the same agent brain and memory.

### 6. DESIGN DIRECTION: Minimalist — NEW
The entire product (web + branding) must feel calm, open, and uncluttered — reflecting the "door" metaphor of opportunity without noise.

**Principles:**
- Generous white space
- Clear visual hierarchy
- Minimal text and UI elements
- Soft, purposeful interactions
- No visual clutter or heavy dashboards

**Suggested Color Palette (Final):**

| Role | Color | Hex | Purpose |
|------|-------|-----|---------|
| Background | Soft Off-White / Warm White | #FAF9F6 | Clean, airy base |
| Primary Text | Deep Charcoal | #1A1A1A | Strong readability |
| Accent / CTA | Warm Terracotta | #C45C26 | Door / opportunity feel, warm and inviting (alt #D97941) |
| Secondary Accent | Muted Sage Green | #8A9A7B | Subtle nature / food-tech nod, doormat, chat widget |
| Borders / Subtle UI | Light Warm Gray | #E8E4DE | Soft separation |
| Success / Positive | Soft Forest Green | #4A7043 | Confirmations and closed deals |

Overall feel: warm, trustworthy, and quiet — never cold tech-blue or overly corporate.

### 7. LANDING PAGE EXPERIENCE — INTEGRATED WITH UPDATED COPY + VIDEOS + WIDGETS

**Visual Design (from your screenshot + new copy):**
- Background: #FAF9F6 warm off-white
- Center: Elegant wooden door slightly ajar with warm light — THIS IS VIDEO, NOT IMAGE
- Soft faded footprints leading up to door (ghosted gray #B8B0A8 opacity 0.2-0.3, NOT bold brown) — 6 prints fading toward door
- Green doormat below door: Sage #8A9A7B
- Clean "Panto" wordmark 48px weight 600 + tagline "Opening doors in food tech" 18px opacity 0.7

**UPDATED COPY (FINAL APPROVED — USE THIS):**
- Title: Panto
- Tagline: Opening doors in food tech
- Toggle Pill: "I'm buying" | "I'm selling" (NOT old "Looking for Buyers/Sellers")
  - Active: terracotta #C45C26 white text
  - Inactive: light beige #E9E2D8 dark text #1A1A1A
  - Default: I'm buying
- Doormat CTA Dynamic:
  - Default: "Open the door →"
  - When Buying: "Continue as Buyer →"
  - When Selling: "Continue as Seller →"
  - Old DO NOT USE: "Continue →"

**Key Interaction — Buyer / Seller Toggle + Video:**
- Pill-shaped toggle centered under tagline
- When user selects "I'm buying" → Door rotates clockwise → Play Panto_Door_Clockwise.mp4
- When user selects "I'm selling" → Door rotates anti-clockwise → Play Panto_Door_Anticlockwise.mp4
- Rotation must feel intentional and cinematic (full background video style)
- Text, toggle, icons remain as real HTML overlay, videos contain no text, no cursor, no browser chrome
- Implementation: 2 video tags stacked, preload both, muted autoplay loop playsinline, crossfade opacity 150ms, isAnimating lock 300ms to prevent rapid click glitch
- Handle prefers-reduced-motion: show poster
- Footprints: subtle, almost ghosted

**ASSETS PROVIDED:**
- Panto_Door_Clockwise.mp4 — Clean, no cursor, 1280x665, for Buyers (clockwise)
- Panto_Door_Anticlockwise.mp4 — Clean, no cursor, 1280x665, for Sellers (anti-clockwise)
- door_poster.jpg (fallback)
- New UI reference image: panto_new_ui_with_copy.png (generated with I'm buying / Open the door)

**Retractable Social Icons (Right side):**
- Default: Soft circular button 56px with clean door icon, fixed right center top 50% -translate-y-1/2 right 24px
- On click: Social icons (WhatsApp #25D366, Telegram #2AABEE, LinkedIn #0077B5) smoothly expand/pop out with real brand colors, staggered spring 0.05s
- Click again: shrivel/collapse back into main door button scale 1→0.8→0 spring damping 20 stiffness 300
- Polished and satisfying

**Chat Door Widget (Lower Right) — Critical:**
- Circular icon at lower right that shrivels and pops up as it comes up.
- Closed: 64px circle, fixed bottom 24px right 24px z-50, sage #8A9A7B, white door icon, shadow 0 8px 24px rgba(0,0,0,0.12), breathing pulse scale 1→1.05 infinite 2s
- Opening: Button shrivels scale 1→0.8 (100ms)→0 (150ms easeIn) then chat window pops from same origin transform-origin bottom right initial {scale 0.3 opacity 0 y40} animate {scale 1 opacity 1 y0} transition spring damping 18 stiffness 300 mass 0.8 overshoot pop. Window 380x520 rounded 20px border #E9E2D8 shadow.
- Open: Header door icon + "Ask Panto" + X, Body quick prompts "Find me organic seeds", "I have land to sell", "Need packaging supplier", Input "Ask anything..."
- Closing: exit scale 0.5 opacity 0 y30 duration 0.25 easeIn then button pops back scale 0→1.1→1 spring.
- Mobile: bottom sheet width calc(100% - 16px) height 70vh bottom 8px.
- Social FAB offset 80px above chat button.

### 8. CHAT INTERFACE (Web) — Full Workspace
Inspired by Base44 / Floe Superagent style:
- Left sidebar: Conversations + navigation (New Chat, History, Deals)
- Right sidebar: Customization & Settings (preferred platforms, role buyer/seller, memory, appearance)
- Clean central chat area
- Action buttons under messages: Approve, Edit, Nudge, Mark Closed
- Minimalist terracotta #C45C26 + sage #8A9A7B

### 9. HOW IT WORKS (Technical Direction)
Core instruction: Build on skills already present in the Freebuff agent and high-quality free open-source repositories. Prefer composition over new code.
- Use Freebuff's specialized sub-agents and skills for research, planning, drafting, review, browser use, and long-running state.
- Perform deep search across Instagram, TikTok, Snapchat, LinkedIn, X, and other relevant platforms based on buyer intent and user-selected preferences.
- Leverage free repos and tools that help connect people via social platforms.
- Call Grok API and free MCP tools for reasoning, search, enrichment, certification checks, and integrations.
- Maintain long-horizon memory so agent can watch for new inventory or RFQs, follow up on stale deals, and improve match quality over time.
- Keep system prompt and orchestration focused on simplicity and high-value food-tech matchmaking.

### 10. USER FLOW (Happy Path)
1. User opens Telegram or web and messages Panto.
2. User states intent (e.g. "I need seeds for a 10-acre farm" or "Looking for food-tech processing equipment") and optionally specifies preferred platforms.
3. Panto runs deep search across chosen platforms, finds relevant matches, shows clear reasoning, and drafts warm intros.
4. User reviews and approves.
5. Panto facilitates introduction and continues monitoring deal.
6. Gentle, timely follow-ups keep conversation alive until close or clear outcome.

### 11. FUNCTIONAL REQUIREMENTS (MVP Focus)
Must deliver:
- Telegram + web interfaces with minimalist design
- Natural language capture of buyer/seller intent
- Deep search and matching across Instagram, TikTok, Snapchat, LinkedIn, X, and other platforms
- Ability for users to specify preferred platforms
- Transparent match reasoning
- Personalized intro drafting
- Simple deal tracking and follow-up
- Heavy reuse of Freebuff skills, free repos, Grok, and free MCP tools
- Landing page with video toggle + updated copy + social FAB + chat widget

Nice to have:
- Lightweight web views for bulk management
- Basic compliance status for common food and agricultural certifications
- Learning from closed vs. lost deals

Out of scope:
- Automated sending without user approval
- Payment processing or logistics tracking
- Heavy complexity beyond core matching and follow-up loop

### 12. SUCCESS METRICS
- Time from first message to useful match + draft < 60 seconds
- Percentage of drafted intros that users actually send
- Reply and close rates on Panto-introduced deals
- Number of deals that receive meaningful follow-up
- User retention within food tech community

### 13. BRAND & POSITIONING
In Sundanese, Panto means "door." In food tech, good buyers and good suppliers fail to meet every day because the door never opens. You want the seeds, the land, the equipment — without the stress. Panto opens those doors by understanding your intent, searching deeply across the platforms that matter to you, building trust, making the introduction, and staying with the relationship until the deal is done.

Simple. Persistent. Built specifically for the food tech industry.

### 14. RELEVANT UI/UX LANDING PAGE GITHUB REPOS TO FORK
No repo has exact "door + footsteps + buyer/seller toggle" concept, but these are cleanest minimalist starting points you can fork and adapt quickly with Freebuff:

1. cruip/open-react-template — Clean Next.js + Tailwind, very popular, easy to customize. Stars 400+. Perfect base. https://github.com/cruip/open-react-template
2. cruip/tailwind-landing-page-template — Even simpler "Simple Light" version. https://github.com/cruip/tailwind-landing-page-template
3. flexdinesh/dev-landing-page — Extremely minimal, almost zero clutter. https://github.com/flexdinesh/dev-landing-page
4. AbdurRahman-Khalil/haven — Real-estate style, calm and spacious (good structural feel for door metaphor). Search haven real estate template.
5. Bonus: Minimalist SaaS landing templates — Look for "Tonic", "Simple", "Calm" themes on Tailwind UI.

Recommendation: Fork cruip/open-react-template, replace hero with door video component, add toggle + doormat + footprints.

### 15. DETAILED PROMPT FOR FREEBUFF TO GENERATE UI / FOR IMAGE GENERATION

**Prompt to give Freebuff to build landing:**

"Build Panto landing page exactly like this reference image. Off-white #FAF9F6 background. Center: realistic light wood door with copper handle, slightly ajar with warm light glowing from inside, centered. Above door: large bold title Panto 48px weight 600 #1A1A1A, subtitle Opening doors in food tech 18px opacity 0.7. Below subtitle: pill-shaped toggle two options I'm buying active terracotta #C45C26 white text and I'm selling inactive light beige #E9E2D8 dark text. Pill container has soft shadow. Below door: sage green #8A9A7B doormat that says Open the door → in white, rounded slightly, with dynamic text Continue as Buyer → / Continue as Seller → based on toggle. Leading up to doormat from bottom: 6 subtle faded gray footprints ghosted low opacity 0.25 walking towards door. On right side vertical: three small circular outline icons for WhatsApp, Telegram, LinkedIn. Bottom right corner: small 64px circular sage green button with door icon (chat widget). Clean, warm, calm, premium, minimalist, generous white space, no browser chrome, no cursor, soft shadows. Use Framer Motion for toggle crossfade and door video switching. Videos: Panto_Door_Clockwise.mp4 for buying, Panto_Door_Anticlockwise.mp4 for selling, muted autoplay loop playsinline preload auto crossfade 150ms isAnimating lock 300ms. Retractable social FAB expands with stagger spring. Chat widget shrivels scale 1->0.8->0 then chat window 380x520 pops scale 0.3->1 spring damping 18 stiffness 300. Mobile responsive."

**Prompt to generate image in Midjourney / DALL-E:**

"Minimalist premium landing page UI for food tech startup Panto, off-white warm background #FAF9F6, centered realistic light wood door with copper handle slightly ajar with warm light inside, above door bold text Panto and subtitle Opening doors in food tech, below subtitle pill toggle I'm buying active terracotta #C45C26 white text and I'm selling inactive light beige, below door sage green doormat that says Open the door → white text, 6 subtle faded gray footprints leading to door, right side vertical outline icons WhatsApp Telegram LinkedIn, bottom right small sage circular button with door icon, clean warm calm premium minimalist generous white space soft shadows high resolution --ar 16:9"

---

### FINAL ASSETS CHECKLIST FOR FREEBUFF:
- [x] Panto_Door_Clockwise.mp4 (clean, no cursor, for I'm buying)
- [x] Panto_Door_Anticlockwise.mp4 (clean, no cursor, for I'm selling)
- [x] Updated copy: I'm buying / I'm selling / Open the door →
- [x] New UI reference image generated (with copy + social + chat widget)
- [x] Color palette: #FAF9F6, #1A1A1A, #C45C26, #8A9A7B, #E8E4DE, #4A7043
- [x] GitHub repos list to fork
- [x] Full build prompt
- [ ] Chat workspace UI (next step)

---

END OF MASTER PRD v5
