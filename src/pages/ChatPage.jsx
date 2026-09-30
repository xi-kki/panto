import { useEffect, useState } from 'react'
import ChatWorkspace from '../components/chat/ChatWorkspace.jsx'
import ChatSidebar from '../components/chat/ChatSidebar.jsx'
import useConversations from '../lib/useConversations.js'
import { signOut, setSessionRole } from '../lib/auth.js'
import { useRouter } from '../lib/useRouter.js'

/**
 * Full-page chat experience — PRD §8.
 * Centered chat card with a slide-in conversation-history sidebar
 * (the same ChatSidebar + workspace pair the floating widget uses).
 */
export default function ChatPage() {
  const { navigate } = useRouter()
  const [role, setRole] = useState(() => {
    const s = JSON.parse(localStorage.getItem('panto_session') || 'null')
    return s?.role || 'buying'
  })

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

  useEffect(() => {
    setSessionRole(role)
  }, [role])

  // Re-read the list when the active conversation's messages change
  // (titles derive from the first user message; active moves to top).
  useEffect(() => {
    if (!activeId) return
    const t = setInterval(refresh, 1500)
    return () => clearInterval(t)
  }, [activeId, refresh])

  if (!active) return null

  return (
    <div className="relative flex min-h-screen flex-col bg-cream">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-3">
        <button
          onClick={() => navigate('/')}
          className="text-lg font-semibold tracking-tight text-charcoal transition hover:text-terracotta"
        >
          ← Panto
        </button>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-border bg-cream p-0.5 text-xs">
            {['buying', 'selling'].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  role === r ? 'bg-terracotta text-white' : 'text-charcoal/60 hover:text-charcoal'
                }`}
              >
                {r === 'buying' ? "I'm buying" : "I'm selling"}
              </button>
            ))}
          </div>
          <button
            onClick={() => { signOut(); navigate('/') }}
            className="text-xs text-charcoal/50 transition hover:text-charcoal"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Chat card */}
      <main className="relative flex flex-1 items-center justify-center px-4 py-8">
        <div className="relative flex h-[640px] max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] border border-border bg-cream shadow-soft">
          <ChatWorkspace
            key={activeId}
            role={role}
            conversationId={activeId}
            initialMessages={active.messages}
            onSidebarToggle={() => setSidebarOpen((v) => !v)}
            sidebarOpen={sidebarOpen}
            quickPrompts={['Find me organic seeds', 'I have land to sell', 'Need packaging supplier']}
          />
          <ChatSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            activeId={activeId}
            conversations={conversations}
            onSelectConversation={(id) => { selectConversation(id); refresh() }}
            onNewChat={() => { newConversation(); refresh() }}
            onDeleteConversation={(id) => { removeConversation(id); refresh() }}
          />
        </div>
      </main>
    </div>
  )
}
