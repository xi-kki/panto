/**
 * Authentication — demo mode + Supabase magic code ("seamless auth").
 *
 * Demo mode: email → 6-digit code (shown in UI) → session in localStorage.
 * Works with zero configuration.
 *
 * Production: set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (and
 * `npm i @supabase/supabase-js`) — the Supabase path below activates
 * automatically. The UI contract (request → verify → session) is unchanged.
 */

import { createClient } from '@supabase/supabase-js'

const SESSION_KEY = 'panto_session'
const PENDING_KEY = 'panto_pending_code'

const configured = () =>
  Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

/* Lazily create the client only when configured — avoids throwing at import
   time in demo mode (where env vars are intentionally absent). */
let client = null
function supabase() {
  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )
  }
  return client
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null
  } catch {
    return null
  }
}

function saveSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

/**
 * Step 1 — request a code. Returns { demoCode } in demo mode so the UI
 * can display it; returns {} in production (code arrives by email).
 */
export async function requestAuthCode(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Please enter a valid email address.')
  }

  if (configured()) {
    const { error } = await supabase().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) throw new Error(error.message)
    return {}
  }

  // Demo mode: generate a code locally
  const code = String(Math.floor(100000 + Math.random() * 900000))
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ email, code }))
  // Simulate network latency so the flow feels real
  await new Promise((r) => setTimeout(r, 450))
  return { demoCode: code }
}

/** Step 2 — verify the code. Returns the session object. */
export async function verifyAuthCode(email, code) {
  if (configured()) {
    const { data, error } = await supabase().auth.verifyOtp({
      email,
      token: String(code).trim(),
      type: 'email',
    })
    if (error) throw new Error(error.message)
    const session = {
      email: data?.user?.email || email,
      signedInAt: new Date().toISOString(),
      role: null,
      provider: 'supabase',
    }
    saveSession(session)
    return session
  }

  await new Promise((r) => setTimeout(r, 350))

  const pending = JSON.parse(sessionStorage.getItem(PENDING_KEY))
  if (!pending || pending.email !== email) {
    throw new Error('No sign-in request found. Please start again.')
  }
  if (pending.code !== code) {
    throw new Error('That code is incorrect. Please check and try again.')
  }

  const session = {
    email,
    signedInAt: new Date().toISOString(),
    role: null,
  }
  saveSession(session)
  sessionStorage.removeItem(PENDING_KEY)
  return session
}

/** Get current session (or null). */
export function getSession() {
  return loadSession()
}

/** Sign out. */
export function signOut() {
  saveSession(null)
}

/** Update the persisted role (buyer/seller) on the session. */
export function setSessionRole(role) {
  const s = loadSession()
  if (s) {
    s.role = role
    saveSession(s)
  }
}

export const isSupabaseConfigured = configured
