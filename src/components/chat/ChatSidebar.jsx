import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  setActiveId,
  groupByDate,
} from '../../lib/conversations.js'

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  // Sidebar toggle — panels icon (matches reference widget toolbar style)
  sidebar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M15 3v18" />
    </svg>
  ),
  newChat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
}

// ── Single conversation item ───────────────────────────────────────────────────
function ConvItem({ conv, active, onSelect, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false) }}
      onClick={() => onSelect(conv.id)}
      className={`group relative flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
        active
          ? 'bg-terracotta/10 text-terracotta'
          : 'text-charcoal/70 hover:bg-beige hover:text-charcoal'
      }`}
    >
      <span className={`shrink-0 ${active ? 'text-terracotta' : 'text-charcoal/30'}`}>
        {Icons.chat}
      </span>

      <span className="flex-1 truncate text-xs leading-snug">
        {conv.title}
      </span>

      {/* Delete button — appears on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="shrink-0"
          >
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium text-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }}
                  className="rounded px-1.5 py-0.5 text-[10px] text-charcoal/40 hover:bg-beige"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-charcoal/30 hover:bg-red-50 hover:text-red-400"
              >
                {Icons.trash}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active indicator bar */}
      {active && (
        <motion.div
          layoutId="active-bar"
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-terracotta"
        />
      )}
    </motion.div>
  )
}

// ── Collapsed toggle button ────────────────────────────────────────────────────
export function SidebarToggleBtn({ onClick, hasConversations }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Conversation history"
      className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-charcoal/40 shadow-soft transition-all hover:border-terracotta/30 hover:bg-terracotta/5 hover:text-terracotta"
    >
      {Icons.sidebar}
      {/* Unread dot — shows when there are conversations */}
      {hasConversations && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-terracotta" />
      )}
    </motion.button>
  )
}

// ── Main sidebar panel ─────────────────────────────────────────────────────────
export default function ChatSidebar({ open, onClose, activeId, onSelectConversation, onNewChat, conversations, onDeleteConversation }) {
  const [search, setSearch] = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 200)
  }, [open])

  const filtered = search.trim()
    ? conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations

  const groups = groupByDate(filtered)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-charcoal/10 backdrop-blur-[2px] lg:hidden"
          />

          {/* Sidebar panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="absolute right-0 top-0 z-40 flex h-full w-64 flex-col overflow-hidden rounded-r-[20px] border-l border-border bg-cream shadow-[-8px_0_32px_-8px_rgba(0,0,0,0.08)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-charcoal/50">
                  History
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* New chat */}
                <button
                  onClick={onNewChat}
                  title="New conversation"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-white text-charcoal/40 transition hover:border-terracotta/40 hover:bg-terracotta/5 hover:text-terracotta"
                >
                  {Icons.newChat}
                </button>
                {/* Close */}
                <button
                  onClick={onClose}
                  title="Close sidebar"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-charcoal/30 transition hover:bg-beige hover:text-charcoal"
                >
                  {Icons.close}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 py-2.5 border-b border-border/50">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 transition focus-within:border-terracotta/40 focus-within:ring-2 focus-within:ring-terracotta/10">
                <span className="text-charcoal/30">{Icons.search}</span>
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="flex-1 bg-transparent text-xs text-charcoal outline-none placeholder:text-charcoal/30"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-charcoal/30 hover:text-charcoal">
                    {Icons.close}
                  </button>
                )}
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-beige text-charcoal/30">
                    {Icons.chat}
                  </div>
                  <p className="text-xs text-charcoal/40">
                    {search ? 'No results found' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map(([label, items]) => (
                    <div key={label}>
                      <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-charcoal/30">
                        {label}
                      </p>
                      <AnimatePresence mode="popLayout">
                        {items.map((conv) => (
                          <ConvItem
                            key={conv.id}
                            conv={conv}
                            active={conv.id === activeId}
                            onSelect={(id) => { setActiveId(id); onSelectConversation(id); }}
                            onDelete={onDeleteConversation}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-3">
              <p className="text-center text-[10px] text-charcoal/30">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
