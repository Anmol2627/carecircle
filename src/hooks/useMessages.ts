// Hook: useMessages
// Real-time chat functionality

import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  type: 'text' | 'location' | 'image' | 'alert'
  is_read: boolean
  created_at: string
}

export function useMessages(userId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    loadMessages()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`messages-${userId}`)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          setMessages((prev) => [payload.new as Message, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const loadMessages = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (
    receiverId: string,
    content: string,
    type: Message['type'] = 'text'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          type,
        })
        .select()
        .single()

      if (error) throw error

      setMessages((prev) => [data, ...prev])
      return data
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)

      if (error) throw error

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, is_read: true } : msg))
      )
    } catch (err) {
      setError(err as Error)
    }
  }

  const getConversation = (otherUserId: string) => {
    return messages
      .filter(
        (msg) =>
          (msg.sender_id === otherUserId || msg.receiver_id === otherUserId)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  const getUnreadCount = () => {
    return messages.filter((msg) => !msg.is_read).length
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    getConversation,
    getUnreadCount,
    refresh: loadMessages,
  }
}


