import { useCallback, useEffect, useState } from 'react'
import {
  getConversations,
  getActiveId,
  createConversation,
  deleteConversation,
} from './conversations.js'

/**
 * Shared conversation-history state for ChatPage + ChatDoorWidget.
 * Keeps the list in sync with the localStorage store, exposes the active
 * conversation, and hands out actions (new / select / delete).
 */
export default function useConversations() {
  const [conversations, setConversations] = useState(() => getConversations())
  const [activeId, setActiveId] = useState(() => getActiveId())

  /** Ensure an active conversation exists; create one on first visit. */
  useEffect(() => {
    if (conversations.length === 0) {
      const conv = createConversation()
      setConversations([conv])
      setActiveId(conv.id)
      return
    }
    // Drop a stale active pointer (e.g. conversation deleted in another tab)
    if (!conversations.some((c) => c.id === activeId)) {
      setActiveId(conversations[0].id)
    }
  }, [conversations, activeId])

  const newConversation = useCallback(() => {
    // Avoid stacking empty "New conversation" drafts
    const current = getConversations().find((c) => c.id === activeId)
    if (current && current.messages.length === 0) return activeId
    const conv = createConversation()
    setConversations(getConversations())
    setActiveId(conv.id)
    return conv.id
  }, [activeId])

  const selectConversation = useCallback((id) => {
    setActiveId(id)
  }, [])

  const removeConversation = useCallback((id) => {
    deleteConversation(id)
    setConversations(getConversations())
  }, [])

  /** Keep the sidebar fresh when messages are saved (title derived, reordering). */
  const refresh = useCallback(() => setConversations(getConversations()), [])

  return {
    conversations,
    activeId,
    active: conversations.find((c) => c.id === activeId) || null,
    newConversation,
    selectConversation,
    removeConversation,
    refresh,
  }
}
