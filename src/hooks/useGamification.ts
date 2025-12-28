// Hook: useGamification
// Points, levels, and badges management

import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface Badge {
  id: string
  name: string
  icon: string
  description: string | null
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  points_required: number
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  unlocked_at: string
  badge: Badge
}

export interface Profile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  level: number | null
  points: number | null
  badge: string | null
}

export function useGamification(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      loadCurrentUserProfile()
    } else {
      loadProfile(userId)
    }
    loadAllBadges()
  }, [userId])

  useEffect(() => {
    if (profile) {
      loadUserBadges(profile.user_id)
    }
  }, [profile])

  const loadCurrentUserProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await loadProfile(user.id)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const loadProfile = async (targetUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err) {
      setError(err as Error)
    }
  }

  const loadAllBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('points_required', { ascending: true })

      if (error) throw error
      setBadges(data || [])
    } catch (err) {
      setError(err as Error)
    }
  }

  const loadUserBadges = async (targetUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges (*)
        `)
        .eq('user_id', targetUserId)
        .order('unlocked_at', { ascending: false })

      if (error) throw error
      setUserBadges(data || [])
    } catch (err) {
      setError(err as Error)
    }
  }

  const awardPoints = async (points: number, reason: string = 'action') => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-points`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            points,
            reason,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to award points')
      }

      const result = await response.json()

      // Refresh profile
      if (profile) {
        await loadProfile(profile.user_id)
      }

      return result
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const getUnlockedBadges = () => {
    return userBadges.map((ub) => ub.badge)
  }

  const getLockedBadges = () => {
    const unlockedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id))
    return badges.filter((badge) => !unlockedBadgeIds.has(badge.id))
  }

  const getNextLevelPoints = () => {
    if (!profile || !profile.level) return 500
    return (profile.level + 1) * 500
  }

  const getProgressToNextLevel = () => {
    if (!profile || !profile.points) return 0
    const currentLevelPoints = (profile.level || 1) * 500
    const nextLevelPoints = getNextLevelPoints()
    const progress = ((profile.points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100
    return Math.max(0, Math.min(100, progress))
  }

  return {
    profile,
    badges,
    userBadges,
    unlockedBadges: getUnlockedBadges(),
    lockedBadges: getLockedBadges(),
    loading,
    error,
    awardPoints,
    getNextLevelPoints,
    getProgressToNextLevel,
    refresh: () => {
      if (profile) loadProfile(profile.user_id)
      loadAllBadges()
    },
  }
}


