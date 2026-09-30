/**
 * Panto conversation store — localStorage-backed.
 * Manages multiple chat sessions with titles, messages, and timestamps.
 */

const STORAGE_KEY = 'panto_conversations'
const ACTIVE_KEY  = 'panto_active_conversation'

/** @returns {Array} all stored conversations */
export function getConversations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

/** @returns {string|null} active conversation ID */
export function getActiveId() {
  return localStorage.getItem(ACTIVE_KEY) || null
}

/** Create a brand new conversation, set it active, return it */
export function createConversation() {
  const conv = {
    id:        crypto.randomUUID(),
    title:     'New conversation',
    messages:  [],
    role:      'buying',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const all = [conv, ...getConversations()]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  localStorage.setItem(ACTIVE_KEY, conv.id)
  return conv
}

/** Save messages for a conversation; derive title from first user message */
export function saveMessages(id, messages, role) {
  const all = getConversations()
  const idx = all.findIndex((c) => c.id === id)
  if (idx === -1) return

  // Title = first user message, truncated
  const firstUser = messages.find((m) => m.role === 'user')
  const title = firstUser
    ? firstUser.content.slice(0, 52) + (firstUser.content.length > 52 ? '…' : '')
    : all[idx].title

  all[idx] = { ...all[idx], title, messages, role, updatedAt: Date.now() }
  // Keep active conversation at top
  const [updated] = all.splice(idx, 1)
  all.unshift(updated)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

/** Set active conversation ID */
export function setActiveId(id) {
  localStorage.setItem(ACTIVE_KEY, id)
}

/** Delete a conversation */
export function deleteConversation(id) {
  const all = getConversations().filter((c) => c.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  if (getActiveId() === id) {
    localStorage.removeItem(ACTIVE_KEY)
  }
}

/** Group conversations by time period for sidebar display */
export function groupByDate(conversations) {
  const now   = Date.now()
  const day   = 86_400_000
  const groups = { Today: [], Yesterday: [], 'Last 7 days': [], Older: [] }

  conversations.forEach((c) => {
    const age = now - c.updatedAt
    if      (age < day)      groups['Today'].push(c)
    else if (age < 2 * day)  groups['Yesterday'].push(c)
    else if (age < 7 * day)  groups['Last 7 days'].push(c)
    else                     groups['Older'].push(c)
  })

  return Object.entries(groups).filter(([, items]) => items.length > 0)
}
