import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { sendUserMessage } from '../../lib/agent.js'
import AuthGate from './AuthGate.jsx'
import { getSession } from '../../lib/auth.js'

function DoorAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round">
        <rect x="6" y="3.5" width="12" height="17" rx="1.5" />
        <circle cx="15.2" cy="12" r="1.2" fill="#FFF" stroke="none" />
      </svg>
    </div>
  )
}

function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && <DoorAvatar />}
      <div
        className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-md bg-terracotta text-white'
            : 'rounded-bl-md border border-border bg-white text-charcoal'
        }`}
      >
        {msg.content}
        {msg.streaming && (
          <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-current align-middle" />
        )}
      </div>
    </motion.div>
  )
}

/**
 * The Panto chat workspace.
 * - compact: inside the floating widget (header + close button)
 * - full: page-level layout for /chat route
 * Requires sign-in (seamless 2-step email code, demo auto-fills).
 */
export default function ChatWorkspace({ quickPrompts = [], onClose, compact = false, role = 'buying' }) {
  const [session, setSession] = useState(() => getSession())
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)
  const endRef = useRef(null)

  const scrollToEnd = () => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  useEffect(scrollToEnd, [messages])

  const send = async (text) => {
    const t = text.trim()
    if (!t || busy) return
    setInput('')
    setBusy(true)
    setMessages((m) => [...m, { role: 'user', content: t }])

    let assistant = { role: 'assistant', content: '', streaming: true }
    setMessages((m) => [...m, assistant])

    try {
      for await (const chunk of sendUserMessage(t, { role })) {
        assistant.content += chunk
        setMessages((m) => [...m.slice(0, -1), { ...assistant }])
      }
    } catch (err) {
      assistant.content = assistant.content || 'Something went wrong reaching the agent. Please try again.'
      setMessages((m) => [...m.slice(0, -1), { ...assistant }])
    } finally {
      assistant.streaming = false
      setMessages((m) => [...m.slice(0, -1), { ...assistant }])
      setBusy(false)
    }
  }

  const handleAction = (label) => send(label)

  const inputRow = (
    <form
      onSubmit={(e) => { e.preventDefault(); send(input) }}
      className="flex items-center gap-2 border-t border-border bg-cream px-3 py-3"
    >
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask anything…"
        className="flex-1 rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none placeholder:text-footprint focus:border-terracotta focus:ring-2 focus:ring-terracotta/15"
        aria-label="Message Panto"
      />
      <button
        type="submit"
        disabled={busy || !input.trim()}
        aria-label="Send message"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta text-white transition hover:bg-terracotta-alt disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  )

  // ── Not signed in: show the seamless auth gate ──
  if (!session) {
    return (
      <div className="flex h-full flex-col">
        {compact && <WidgetHeader onClose={onClose} />}
        <AuthGate role={role} onAuthenticated={setSession} />
      </div>
    )
  }

  // ── Signed in: the workspace ──
  return (
    <div className="flex h-full flex-col">
      {compact && <WidgetHeader onClose={onClose} />}

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <DoorAvatar />
          <h3 className="mt-3 text-lg font-semibold text-charcoal">Ask Panto</h3>
          <p className="mt-1 text-sm text-charcoal/60">
            Tell me what you're sourcing or selling — plain language is perfect.
          </p>
          <div className="mt-5 flex w-full flex-col gap-2">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-border bg-white px-4 py-2.5 text-sm text-charcoal transition hover:border-terracotta hover:text-terracotta"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
          <div ref={endRef} />
        </div>
      )}

      {messages.length > 0 && !busy && (
        <div className="flex gap-2 overflow-x-auto border-t border-border bg-cream px-3 py-2">
          {['Approve', 'Edit', 'Nudge', 'Mark Closed'].map((label) => (
            <button
              key={label}
              onClick={() => handleAction(label)}
              className="shrink-0 rounded-full border border-border bg-white px-3 py-1 text-xs text-charcoal/70 transition hover:border-sage hover:text-sage-dark"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {inputRow}
    </div>
  )
}

function WidgetHeader({ onClose }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-border bg-white px-4 py-3">
      <DoorAvatar />
      <div className="flex-1">
        <p className="text-sm font-semibold text-charcoal">Ask Panto</p>
        <p className="text-[11px] text-charcoal/50">Food tech sourcing agent</p>
      </div>
      <button
        onClick={onClose}
        aria-label="Close chat"
        className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal/40 transition hover:bg-beige hover:text-charcoal"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}
