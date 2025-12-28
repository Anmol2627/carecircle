// Hook: useCheckIn
// Check-in timer management

import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface CheckInTimer {
  id: string
  user_id: string
  duration_minutes: number
  started_at: string
  expires_at: string
  status: 'active' | 'checked_in' | 'expired'
  created_at: string
}

export function useCheckIn() {
  const [activeTimer, setActiveTimer] = useState<CheckInTimer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadActiveTimer()
  }, [])

  const loadActiveTimer = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-in-timer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'get_active' }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to load timer')
      }

      const result = await response.json()
      setActiveTimer(result.timer)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const createTimer = async (durationMinutes: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-in-timer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'create',
            durationMinutes,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create timer')
      }

      const result = await response.json()
      setActiveTimer(result.timer)
      return result.timer
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const checkIn = async (timerId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-in-timer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'check_in',
            timerId,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to check in')
      }

      const result = await response.json()
      setActiveTimer(null)
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const getTimeRemaining = (): number | null => {
    if (!activeTimer || activeTimer.status !== 'active') return null

    const expiresAt = new Date(activeTimer.expires_at).getTime()
    const now = Date.now()
    const remaining = expiresAt - now

    return remaining > 0 ? remaining : 0
  }

  const isExpired = (): boolean => {
    if (!activeTimer || activeTimer.status !== 'active') return false
    return getTimeRemaining() === 0
  }

  return {
    activeTimer,
    loading,
    error,
    createTimer,
    checkIn,
    getTimeRemaining,
    isExpired,
    refresh: loadActiveTimer,
  }
}


