import { useEffect, useState } from 'react'
import ChatWorkspace from '../components/chat/ChatWorkspace.jsx'
import { signOut, setSessionRole } from '../lib/auth.js'
import { useRouter } from '../lib/useRouter.js'

/**
 * Full-page chat experience — PRD §8 (lightweight version).
 * Centered chat card; sidebar shell is a fast-follow. Reuses the exact
 * same workspace as the floating widget (single source of truth).
 */
export default function ChatPage() {
  const { navigate } = useRouter()
  const [role, setRole] = useState(() => {
    const s = JSON.parse(localStorage.getItem('panto_session') || 'null')
    return s?.role || 'buying'
  })

  useEffect(() => {
    setSessionRole(role)
  }, [role])

  return (
    <div className="flex min-h-screen flex-col bg-cream">
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
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="flex h-[640px] max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] border border-border bg-cream shadow-soft">
          <ChatWorkspace
            role={role}
            quickPrompts={['Find me organic seeds', 'I have land to sell', 'Need packaging supplier']}
          />
        </div>
      </main>
    </div>
  )
}
