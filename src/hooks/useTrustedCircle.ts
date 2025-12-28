// Hook: useTrustedCircle
// Manage trusted contacts

import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface TrustedCircle {
  id: string
  user_id: string
  trusted_user_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  trusted_user: {
    user_id: string
    full_name: string | null
    avatar_url: string | null
    phone: string | null
  }
}

export function useTrustedCircle() {
  const [trustedContacts, setTrustedContacts] = useState<TrustedCircle[]>([])
  const [pendingRequests, setPendingRequests] = useState<TrustedCircle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadTrustedCircle()
  }, [])

  const loadTrustedCircle = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get contacts where user is the initiator
      const { data: sent, error: sentError } = await supabase
        .from('trusted_circles')
        .select(`
          *,
          trusted_user:profiles!trusted_circles_trusted_user_id_fkey (
            user_id,
            full_name,
            avatar_url,
            phone
          )
        `)
        .eq('user_id', user.id)

      if (sentError) throw sentError

      // Get contacts where user is the trusted one
      const { data: received, error: receivedError } = await supabase
        .from('trusted_circles')
        .select(`
          *,
          user:profiles!trusted_circles_user_id_fkey (
            user_id,
            full_name,
            avatar_url,
            phone
          )
        `)
        .eq('trusted_user_id', user.id)

      if (receivedError) throw receivedError

      // Combine and format
      const allContacts = [
        ...(sent || []).map((tc) => ({
          ...tc,
          trusted_user: tc.trusted_user,
        })),
        ...(received || []).map((tc) => ({
          ...tc,
          trusted_user: tc.user,
        })),
      ]

      setTrustedContacts(allContacts.filter((tc) => tc.status === 'accepted'))
      setPendingRequests(allContacts.filter((tc) => tc.status === 'pending'))
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const addTrustedContact = async (trustedUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('trusted_circles')
        .insert({
          user_id: user.id,
          trusted_user_id: trustedUserId,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      await loadTrustedCircle()
      return data
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const acceptRequest = async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('trusted_circles')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('trusted_user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Award points for accepting
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-points`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              points: 15,
              reason: 'added_to_trusted_circle',
            }),
          }
        )
      }

      await loadTrustedCircle()
      return data
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const rejectRequest = async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('trusted_circles')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .eq('trusted_user_id', user.id)
        .select()
        .single()

      if (error) throw error

      await loadTrustedCircle()
      return data
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const removeTrustedContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('trusted_circles')
        .delete()
        .eq('id', contactId)

      if (error) throw error

      await loadTrustedCircle()
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  return {
    trustedContacts,
    pendingRequests,
    loading,
    error,
    addTrustedContact,
    acceptRequest,
    rejectRequest,
    removeTrustedContact,
    refresh: loadTrustedCircle,
  }
}


