import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatWorkspace from './chat/ChatWorkspace.jsx'
import ChatSidebar from './chat/ChatSidebar.jsx'
import useConversations from '../lib/useConversations.js'

const QUICK_PROMPTS = [
  'Find me organic seeds',
  'I have land to sell',
  'Need packaging supplier',
]

/**
 * Chat door widget — PRD §7 (critical interaction).
 * Closed: 64px sage circle with breathing pulse. Opening: shrivel
 * scale 1→0.8→0 then window pops from same origin with overshoot.
 * Open: chat window + slide-in conversation-history sidebar.
 */
export default function ChatDoorWidget() {
  const [open, setOpen] = useState(false)

  const {
    conversations,
    activeId,
    active,
    newConversation,
    selectConversation,
    removeConversation,
    refresh,
  } = useConversations()

  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Keep sidebar fresh as messages stream in (titles derive + reorder).
  useEffect(() => {
    if (!open || !activeId) return
    const t = setInterval(refresh, 1500)
    return () => clearInterval(t)
  }, [open, activeId, refresh])

  const openChat = () => setOpen(true)
  const closeChat = () => {
    setOpen(false)
    setSidebarOpen(false)
  }

  return (
    <>
      {/* Closed: circular door button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            onClick={openChat}
            aria-label="Ask Panto"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, mass: 0.8 }}
            style={{ transformOrigin: 'bottom right' }}
            className="panto-breathe fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-sage shadow-soft"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round">
              <rect x="6" y="3.5" width="12" height="17" rx="1.5" />
              <path d="M8 3.5V20.5" opacity="0.5" />
              <circle cx="15.2" cy="12" r="1.1" fill="#FFFFFF" stroke="none" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Open: chat window pops from same origin */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-window"
            initial={{ scale: 0.3, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 30, transition: { duration: 0.25, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, mass: 0.8 }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-[20px] border border-beige bg-cream shadow-soft max-md:bottom-2 max-md:right-2 max-md:h-[70vh] max-md:w-[calc(100%-16px)]"
            role="dialog"
            aria-label="Ask Panto chat"
          >
            {active && (
              <ChatWorkspace
                key={activeId}
                quickPrompts={QUICK_PROMPTS}
                onClose={closeChat}
                compact
                conversationId={activeId}
                initialMessages={active.messages}
                onSidebarToggle={() => setSidebarOpen((v) => !v)}
                sidebarOpen={sidebarOpen}
              />
            )}
            <ChatSidebar
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              activeId={activeId}
              conversations={conversations}
              onSelectConversation={(id) => { selectConversation(id); refresh() }}
              onNewChat={() => { newConversation(); refresh() }}
              onDeleteConversation={(id) => { removeConversation(id); refresh() }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
