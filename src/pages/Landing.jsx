import { useState } from 'react'
import { motion } from 'framer-motion'
import Footprints from '../components/Footprints.jsx'
import SocialFab from '../components/SocialFab.jsx'
import ChatDoorWidget from '../components/ChatDoorWidget.jsx'
import { useRouter } from '../lib/useRouter.js'

const VIDEO_SRC = {
  buying: '/assets/Panto_Door_Clockwise.mp4',
  selling: '/assets/Panto_Door_Anticlockwise.mp4',
}

/**
 * Panto landing page — Master PRD v5 §7.
 * Warm off-white canvas, cinematic door video (switches direction with the
 * buyer/seller toggle), dynamic doormat CTA, ghosted footprints, social FAB,
 * and the chat door widget.
 */
export default function Landing({ role, onRoleChange }) {
  const [isAnimating, setIsAnimating] = useState(false) // PRD: lock 300ms
  const [justNavigated, setJustNavigated] = useState(false)
  const { navigate } = useRouter()

  const selectRole = (next) => {
    if (next === role || isAnimating || justNavigated) return
    setIsAnimating(true)
    onRoleChange(next)
    setTimeout(() => setIsAnimating(false), 300)
  }

  const ctaText =
    justNavigated ? 'Opening the door…'
    : role === 'buying' ? 'Continue as Buyer →'
    : 'Continue as Seller →'

  const handleCta = () => {
    setJustNavigated(true)
    setTimeout(() => setJustNavigated(false), 900)
    navigate('/chat')
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-cream">
      {/* ── Header ── */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <span className="text-xl font-semibold tracking-tight text-charcoal">Panto</span>
        <nav className="flex items-center gap-4 text-sm text-charcoal/60 md:gap-6">
          <a href="#how" className="transition-colors hover:text-charcoal">How it works</a>
          <a href="#verify" className="transition-colors hover:text-charcoal">What we check</a>
          <a href="#five-doors" className="transition-colors hover:text-charcoal">Five doors</a>
        </nav>
      </header>

      {/* ── Hero ── */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-24 pt-4 text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-charcoal md:text-6xl">Panto</h1>
        <p className="mt-3 text-lg text-charcoal/70 md:text-xl">Opening doors in food tech</p>

        {/* Buyer / Seller toggle pill */}
        <div
          role="tablist"
          aria-label="Choose your role"
          className="mt-6 flex rounded-full border border-border bg-white p-1 shadow-pill"
        >
          {['buying', 'selling'].map((r) => {
            const active = role === r
            return (
              <button
                key={r}
                role="tab"
                aria-selected={active}
                onClick={() => selectRole(r)}
                className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors md:px-6 ${
                  active ? 'text-white' : 'text-charcoal hover:text-charcoal/80'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="role-pill"
                    className="absolute inset-0 rounded-full bg-terracotta"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{r === 'buying' ? "I'm buying" : "I'm selling"}</span>
              </button>
            )
          })}
        </div>

        {/* Door video — cinematic, crossfades on toggle */}
        <div className="relative mt-8 h-[300px] w-full max-w-2xl md:h-[420px]">
          {(['buying', 'selling']).map((r) => (
            <video
              key={r}
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-150"
              style={{ opacity: role === r ? 1 : 0 }}
              src={VIDEO_SRC[r]}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden={role !== r}
            />
          ))}
        </div>

        {/* Doormat CTA — dynamic text per PRD */}
        <motion.button
          onClick={handleCta}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-6 rounded-lg bg-sage px-10 py-4 text-base font-medium text-white shadow-soft transition-colors hover:bg-sage-dark"
        >
          {ctaText}
        </motion.button>

        {/* "Open the door" caption above CTA when untouched (default per PRD) */}
        {role === 'buying' && (
          <p className="mt-2 text-xs text-charcoal/40">Or just ask Panto — bottom right.</p>
        )}
      </main>

      {/* ── Footprints leading to the door ── */}
      <Footprints />

      {/* ── How it works (nav #how) ── */}
      <section id="how" className="relative z-10 border-t border-border bg-cream px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold text-charcoal md:text-3xl">How Panto works</h2>
        <p className="mx-auto mt-3 max-w-xl text-charcoal/60">
          One conversation in plain language. Panto does the legwork — you approve every step.
        </p>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3">
          {[
            ['Ask', 'Tell Panto what you need — “I need 5 tonnes of organic cocoa.” One sentence is enough.'],
            ['Verify', 'Panto searches the market, then checks certifications, legitimacy and track record.'],
            ['Connect', 'Vetted matches get a hyper-personalized introduction — drafted for your approval.'],
          ].map(([title, desc], i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-white p-6 text-left shadow-pill"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta/10 text-sm font-semibold text-terracotta">
                {i + 1}
              </div>
              <h3 className="mt-4 text-base font-semibold text-charcoal">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/60">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── What we check (nav #verify) ── */}
      <section id="verify" className="relative z-10 border-t border-border bg-white px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold text-charcoal md:text-3xl">What we check</h2>
        <p className="mx-auto mt-3 max-w-xl text-charcoal/60">
          Every introduction happens only after both sides pass Panto's compliance net.
        </p>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          {[
            ['Certifications', 'HACCP, Organic, Fairtrade, Kosher, Halal — checked against official registries.'],
            ['Business legitimacy', 'Company registration, trading history and operational footprint.'],
            ['Digital footprint', 'Consistent, verifiable presence across professional platforms.'],
            ['Responsiveness', 'Only counterparts who actually reply make it into your pipeline.'],
          ].map(([title, desc]) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-start gap-4 rounded-2xl border border-border bg-cream p-6 text-left shadow-pill"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage/15">
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="#4A7043" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10.5l4 4 8-9" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm font-semibold text-charcoal">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-charcoal/60">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Five doors section (minimal, calm) ── */}
      <section id="five-doors" className="relative z-10 border-t border-border bg-cream px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold text-charcoal md:text-3xl">Panto opens five doors</h2>
        <p className="mx-auto mt-3 max-w-xl text-charcoal/60">
          One conversation. Clear value at every step. You approve every message before it's sent.
        </p>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['1. Discovery', 'Deep search across the platforms you choose'],
            ['2. Compliance', 'Certifications & legitimacy checked'],
            ['3. Warm Intro', 'Hyper-personalized drafts for both sides'],
            ['4. Negotiation Prep', 'Briefs with volume, quality, market context'],
            ['5. Deal Follow-Up', 'Gentle nudges until the deal closes'],
          ].map(([title, desc], i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-white p-5 text-left shadow-pill"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage/15 text-sm font-semibold text-sage-dark">
                {i + 1}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-charcoal">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-charcoal/60">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <span className="text-lg font-semibold tracking-tight text-charcoal">Panto</span>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-charcoal/60">
                The AI sourcing &amp; matchmaking agent for food tech. Panto finds the right suppliers and buyers, verifies them, and makes the introduction.
              </p>
            </div>
            {/* Product */}
            <nav aria-label="Product">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal/40">Product</h3>
              <ul className="mt-3 space-y-2 text-sm text-charcoal/60">
                <li><a href="#how" className="transition-colors hover:text-charcoal">How it works</a></li>
                <li><a href="#verify" className="transition-colors hover:text-charcoal">What we check</a></li>
                <li><a href="#five-doors" className="transition-colors hover:text-charcoal">Five doors</a></li>
                <li><a href="#/chat" className="transition-colors hover:text-charcoal">Open the chat</a></li>
              </ul>
            </nav>
            {/* Connect */}
            <nav aria-label="Connect">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal/40">Connect</h3>
              <ul className="mt-3 space-y-2 text-sm text-charcoal/60">
                <li><a href="mailto:hello@panto.app" className="transition-colors hover:text-charcoal">hello@panto.app</a></li>
                <li><a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-charcoal">WhatsApp</a></li>
                <li><a href="https://t.me/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-charcoal">Telegram</a></li>
                <li><a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-charcoal">LinkedIn</a></li>
              </ul>
            </nav>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-charcoal/40 sm:flex-row">
            <span>© 2026 Panto. All rights reserved.</span>
            <span>Panto — ᮕᮔ᮪ᮒᮧ — “door” in Sundanese. Built for food tech.</span>
          </div>
        </div>
      </footer>

      {/* ── Floating elements ── */}
      <SocialFab />
      <ChatDoorWidget />
    </div>
  )
}
