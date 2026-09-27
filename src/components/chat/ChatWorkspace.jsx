import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendUserMessage } from '../../lib/agent.js'
import AuthGate from './AuthGate.jsx'
import { getSession } from '../../lib/auth.js'

// ── Platform selector ──────────────────────────────────────────────────────────
const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', emoji: '📸' },
  { key: 'tiktok',    label: 'TikTok',    emoji: '🎵' },
  { key: 'linkedin',  label: 'LinkedIn',  emoji: '💼' },
  { key: 'x',         label: 'X',         emoji: '𝕏'  },
]

// ── Icons (SVG, matching the reference widget) ────────────────────────────────
const Icons = {
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none" />
    </svg>
  ),
  attach: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  platforms: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  door: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
      <rect x="6" y="3.5" width="12" height="17" rx="1.5" />
      <circle cx="15.2" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
}

// ── Bubble ─────────────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-white">
          {Icons.door}
        </div>
      )}
      <div className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
        isUser
          ? 'rounded-br-md bg-terracotta text-white'
          : 'rounded-bl-md border border-border bg-white text-charcoal'
      }`}>
        {msg.content}
        {msg.streaming && (
          <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-current align-middle" />
        )}
      </div>
    </motion.div>
  )
}

// ── Tool button with tooltip ───────────────────────────────────────────────────
function ToolBtn({ icon, tooltip, onClick, active = false }) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 active:scale-90 ${
          active
            ? 'border-terracotta bg-terracotta/10 text-terracotta'
            : 'border-transparent text-charcoal/40 hover:border-border hover:bg-beige hover:text-terracotta'
        }`}
      >
        {icon}
      </button>
      {tooltip && (
        <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 translate-y-1 rounded-lg border border-border bg-white px-2.5 py-1 text-[11px] text-charcoal opacity-0 shadow-soft transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </div>
  )
}

// ── Platform pill strip ────────────────────────────────────────────────────────
function PlatformPills({ selected, onToggle }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="overflow-hidden border-t border-border"
    >
      <div className="flex items-center gap-1.5 bg-cream px-4 py-2">
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-widest text-charcoal/40">Search:</span>
        {PLATFORMS.map((p) => {
          const active = selected.includes(p.key)
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onToggle(p.key)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                active
                  ? 'border-terracotta bg-terracotta text-white'
                  : 'border-border bg-white text-charcoal/60 hover:border-terracotta hover:text-terracotta'
              }`}
            >
              {p.emoji} {p.label}
            </button>
          )
        })}
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onToggle('__clear__')}
            className="ml-1 text-[10px] text-charcoal/30 hover:text-charcoal transition-colors"
          >
            ✕ All
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Main ChatWorkspace ─────────────────────────────────────────────────────────
export default function ChatWorkspace({ quickPrompts = [], onClose, compact = false, role = 'buying' }) {
  const [session, setSession]           = useState(() => getSession())
  const [messages, setMessages]         = useState([])
  const [input, setInput]               = useState('')
  const [busy, setBusy]                 = useState(false)
  const [platforms, setPlatforms]       = useState([])
  const [showPlatforms, setShowPlatforms] = useState(false)
  const [recording, setRecording]       = useState(false)
  const [charCount, setCharCount]       = useState(0)
  const textareaRef = useRef(null)
  const scrollRef   = useRef(null)
  const endRef      = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages])

  const togglePlatform = (key) => {
    if (key === '__clear__') { setPlatforms([]); return }
    setPlatforms((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
  }

  const handleInput = (e) => {
    const val = e.target.value
    setInput(val)
    setCharCount(val.length)
    // Auto-resize
    const ta = textareaRef.current
    if (ta) { ta.style.height = '24px'; ta.style.height = `${Math.min(ta.scrollHeight, 120)}px` }
  }

  const send = async (text) => {
    const t = (text || input).trim()
    if (!t || busy) return
    setInput('')
    setCharCount(0)
    if (textareaRef.current) textareaRef.current.style.height = '24px'
    setBusy(true)

    const usernameMatch = t.match(/@([a-z0-9._-]{2,30})/i)
    const username = usernameMatch?.[1] || null

    setMessages((m) => [...m, { role: 'user', content: t }])
    let assistant = { role: 'assistant', content: '', streaming: true }
    setMessages((m) => [...m, assistant])

    try {
      for await (const chunk of sendUserMessage(t, { role, history: messages.slice(-8), platforms, username })) {
        assistant.content += chunk
        setMessages((m) => [...m.slice(0, -1), { ...assistant }])
      }
    } catch {
      assistant.content = assistant.content || 'Something went wrong. Please try again.'
      setMessages((m) => [...m.slice(0, -1), { ...assistant }])
    } finally {
      assistant.streaming = false
      setMessages((m) => [...m.slice(0, -1), { ...assistant }])
      setBusy(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (!session) {
    return (
      <div className="flex h-full flex-col">
        {compact && <WidgetHeader onClose={onClose} />}
        <AuthGate role={role} onAuthenticated={setSession} />
      </div>
    )
  }

  const hasInput = input.trim().length > 0

  return (
    <div className="flex h-full flex-col bg-cream">
      {compact && <WidgetHeader onClose={onClose} platforms={platforms} />}

      {/* Message history */}
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-6 text-center">
          {/* Ambient label — mirrors reference widget */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <p className="text-xs font-medium uppercase tracking-[3px] text-terracotta">Panto</p>
            <p className="mt-1 text-sm text-charcoal/50">How can I help you today?</p>
          </motion.div>

          {quickPrompts.length > 0 && (
            <div className="flex w-full flex-col gap-2">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-full border border-border bg-white px-4 py-2.5 text-sm text-charcoal/70 transition hover:border-terracotta hover:text-terracotta"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <p className="mt-4 text-[11px] text-charcoal/30">
            Use <span className="font-medium text-charcoal/40">≡</span> to filter platforms · mention <span className="font-mono">@username</span> to verify a profile
          </p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
          <div ref={endRef} />
        </div>
      )}

      {/* Quick action chips (after first message) */}
      {messages.length > 0 && !busy && (
        <div className="flex gap-2 overflow-x-auto px-3 py-2">
          {['Approve', 'Edit draft', 'Nudge', 'Mark closed'].map((label) => (
            <button
              key={label}
              onClick={() => send(label)}
              className="shrink-0 rounded-full border border-border bg-white px-3 py-1 text-xs text-charcoal/60 transition hover:border-sage hover:text-sage-dark"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── The main chat box — styled from reference widget ── */}
      <div className="p-3">
        {/* Platform pills */}
        <AnimatePresence>
          {showPlatforms && (
            <div className="mb-1 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <PlatformPills selected={platforms} onToggle={togglePlatform} />
            </div>
          )}
        </AnimatePresence>

        {/* Input card */}
        <div className={`
          relative overflow-hidden rounded-2xl border bg-white
          shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]
          transition-all duration-300
          ${hasInput || busy
            ? 'border-terracotta/40 shadow-[0_0_0_3px_rgba(196,96,58,0.06),0_4px_24px_-4px_rgba(0,0,0,0.08)]'
            : 'border-border hover:border-border/80'
          }
        `}>
          {/* Top glow line — terracotta version of reference */}
          <div className={`absolute left-1/2 top-0 h-px -translate-x-1/2 bg-gradient-to-r from-transparent via-terracotta/20 to-transparent transition-all duration-300 ${hasInput ? 'w-4/5' : 'w-3/5'}`} />

          {/* Text input row */}
          <div className="flex items-start gap-3 px-4 pt-4 pb-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={platforms.length ? `Searching ${platforms.map(p => PLATFORMS.find(pl => pl.key === p)?.label).join(', ')}…` : 'Ask Panto anything…'}
              disabled={busy}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-charcoal outline-none placeholder:text-charcoal/30 disabled:opacity-50"
              style={{ height: '24px', maxHeight: '120px' }}
            />
            {/* Send button */}
            <button
              type="button"
              onClick={() => send()}
              disabled={!hasInput || busy}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                hasInput && !busy
                  ? 'bg-gradient-to-br from-terracotta to-terracotta-alt text-white shadow-md shadow-terracotta/20 hover:scale-105 hover:shadow-lg active:scale-95'
                  : 'bg-beige text-charcoal/30'
              }`}
            >
              {Icons.send}
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-0.5 border-t border-border/50 px-3 pb-3 pt-2">
            <ToolBtn icon={Icons.attach}    tooltip="Attach file"       onClick={() => {}} />
            <ToolBtn icon={Icons.search}    tooltip="Web search"        onClick={() => {}} />
            <div className="mx-1.5 h-5 w-px bg-border/60" />
            <ToolBtn
              icon={Icons.platforms}
              tooltip="Filter platforms"
              onClick={() => setShowPlatforms(v => !v)}
              active={showPlatforms || platforms.length > 0}
            />
            <ToolBtn icon={Icons.image}     tooltip="Image"             onClick={() => {}} />

            {/* Right side */}
            <div className="ml-auto flex items-center gap-1.5">
              {/* Char count */}
              <span className={`text-[11px] tabular-nums text-charcoal/30 transition-opacity ${charCount > 0 ? 'opacity-100' : 'opacity-0'}`}>
                {charCount}
              </span>
              {/* Mic */}
              <button
                type="button"
                onClick={() => setRecording(r => !r)}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
                  recording
                    ? 'animate-pulse border-red-400/40 bg-red-50 text-red-400'
                    : 'border-border text-charcoal/40 hover:border-terracotta/30 hover:bg-terracotta/5 hover:text-terracotta'
                }`}
              >
                {recording && (
                  <span className="absolute inset-[-3px] animate-ping rounded-full border-2 border-red-400/20" />
                )}
                {Icons.mic}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Widget header (compact mode only) ─────────────────────────────────────────
function WidgetHeader({ onClose, platforms = [] }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-border bg-white px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-white">
        {Icons.door}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-charcoal">Ask Panto</p>
        <p className="text-[11px] text-charcoal/50">
          {platforms.length ? `📍 ${platforms.join(' · ')}` : 'Food tech sourcing agent'}
        </p>
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal/40 transition hover:bg-beige hover:text-charcoal"
      >
        {Icons.close}
      </button>
    </div>
  )
}
