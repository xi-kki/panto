import { useEffect, useState } from 'react'
import Landing from './pages/Landing.jsx'
import ChatPage from './pages/ChatPage.jsx'
import { useRouter } from './lib/useRouter.js'
import { setSessionRole } from './lib/auth.js'

export default function App() {
  const { route } = useRouter()
  const [role, setRole] = useState('buying') // 'buying' | 'selling'

  // Persist role changes to the session when signed in
  useEffect(() => {
    setSessionRole(role)
  }, [role])

  if (route === '/chat') return <ChatPage />
  return <Landing role={role} onRoleChange={setRole} />
}
