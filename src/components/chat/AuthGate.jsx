import { useState } from 'react'
import { motion } from 'framer-motion'
import { requestAuthCode, verifyAuthCode } from '../../lib/auth.js'

/**
 * Seamless auth — 2 steps, one screen (PRD: "seamless authentication").
 * Demo mode auto-fills the code so the user is one click away from in.
 */
export default function AuthGate({ onAuthenticated, role }) {
  const [step, setStep] = useState('email') // 'email' | 'code'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [demoCode, setDemoCode] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submitEmail = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await requestAuthCode(email)
      if (res.demoCode) setDemoCode(res.demoCode)
      setStep('code')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const submitCode = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const session = await verifyAuthCode(email, code)
      onAuthenticated(session)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal placeholder:text-footprint outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/15 transition'
  const btnCls =
    'w-full rounded-xl bg-terracotta py-3 text-sm font-medium text-white shadow-pill transition hover:bg-terracotta-alt disabled:opacity-50'

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round">
          <rect x="6" y="3.5" width="12" height="17" rx="1.5" />
          <path d="M8 3.5V20.5" opacity="0.5" />
          <circle cx="15.2" cy="12" r="1.1" fill="#FFFFFF" stroke="none" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-charcoal">
        {step === 'email' ? 'Welcome to Panto' : 'Check your inbox'}
      </h3>
      <p className="mt-1 text-sm text-charcoal/60">
        {step === 'email'
          ? role === 'selling'
            ? 'Sign in to start finding buyers for what you sell.'
            : 'Sign in to start finding the right suppliers.'
          : `We sent a 6-digit code to ${email}.`}
      </p>

      {step === 'email' ? (
        <form onSubmit={submitEmail} className="mt-5 w-full space-y-3">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@farm.com"
            className={inputCls}
            aria-label="Email address"
          />
          <button type="submit" disabled={busy} className={btnCls}>
            {busy ? 'Opening the door…' : 'Continue with email →'}
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="mt-5 w-full space-y-3">
          {demoCode && (
            <div className="rounded-xl border border-dashed border-sage bg-sage/10 px-3 py-2 text-xs text-charcoal/70">
              Demo mode — your code is{' '}
              <button
                type="button"
                onClick={() => setCode(demoCode)}
                className="font-mono font-bold text-sage-dark underline underline-offset-2"
              >
                {demoCode}
              </button>{' '}
              (click to fill)
            </div>
          )}
          <input
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            className={`${inputCls} text-center font-mono text-xl tracking-[0.5em]`}
            aria-label="6-digit code"
          />
          <button type="submit" disabled={busy || code.length !== 6} className={btnCls}>
            {busy ? 'Verifying…' : 'Verify & enter →'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('email'); setCode(''); setError('') }}
            className="w-full text-xs text-charcoal/50 hover:text-charcoal"
          >
            ← Use a different email
          </button>
        </form>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-xs font-medium text-terracotta"
          role="alert"
        >
          {error}
        </motion.p>
      )}

      <p className="mt-6 text-[11px] leading-relaxed text-charcoal/40">
        Panto drafts and verifies — you approve every message before it's sent.
      </p>
    </div>
  )
}
