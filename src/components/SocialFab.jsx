import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LINKS = [
  {
    name: 'WhatsApp',
    color: '#25D366',
    href: 'https://wa.me/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 2A10 10 0 0 0 3.5 17.2L2.1 21.9l4.9-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .9.9-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4 0-.5.2-.7l.5-.6c.1-.2.1-.4 0-.6l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 5 4.3.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z" />
      </svg>
    ),
  },
  {
    name: 'Telegram',
    color: '#2AABEE',
    href: 'https://t.me/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.4 6.9-1.6 7.4c-.1.5-.4.7-.9.4l-2.4-1.8-1.1 1.1c-.1.1-.2.2-.5.2l.2-2.5 4.5-4.1c.2-.2 0-.3-.3-.1l-5.6 3.5-2.4-.8c-.5-.2-.5-.5.1-.8l9.4-3.6c.4-.2.8.1.6.7Z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    color: '#0077B5',
    href: 'https://www.linkedin.com/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM8.9 17.3H6.6v-7h2.3v7ZM7.7 9.3a1.3 1.3 0 1 1 0-2.7 1.3 1.3 0 0 1 0 2.7Zm9.6 8h-2.3v-3.4c0-.9-.3-1.5-1.1-1.5-.6 0-1 .4-1.2.8v4.1h-2.3v-7h2.3v1c.3-.5 1-1.2 2.2-1.2 1.6 0 2.4 1 2.4 3v4.2Z" />
      </svg>
    ),
  },
]

/**
 * Retractable social FAB — PRD §7.
 * Closed: 56px door button, right center. Open: three brand-colored
 * icons pop out with staggered springs; collapse shrivels back.
 */
export default function SocialFab() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed right-6 top-1/2 z-40 -translate-y-1/2">
      <div className="flex flex-col items-center gap-3">
        <AnimatePresence>
          {open &&
            LINKS.map((link, i) => (
              <motion.a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.name}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: open ? i * 0.05 : (LINKS.length - 1 - i) * 0.03,
                }}
                whileHover={{ scale: 1.12 }}
                className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-soft"
                style={{ backgroundColor: link.color }}
              >
                {link.icon}
              </motion.a>
            ))}
        </AnimatePresence>

        {/* Main door toggle */}
        <motion.button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Collapse social links' : 'Expand social links'}
          aria-expanded={open}
          animate={{ scale: open ? 0.8 : 1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-cream shadow-soft"
        >
          {/* Door icon */}
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#C45C26" strokeWidth="1.8" strokeLinecap="round">
            <rect x="6" y="3.5" width="12" height="17" rx="1.5" />
            <path d="M8 3.5V20.5" opacity="0.5" />
            <circle cx="15.2" cy="12" r="1.1" fill="#C45C26" stroke="none" />
          </svg>
        </motion.button>
      </div>
    </div>
  )
}
