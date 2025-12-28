// Hook: useLocation
// Location tracking and sharing

import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface UserLocation {
  id: string
  user_id: string
  latitude: number
  longitude: number
  is_sharing: boolean
  updated_at: string
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadLocation()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('user-location-realtime')
      .on<UserLocation>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations',
        },
        (payload) => {
          if (payload.new) {
            setLocation(payload.new as UserLocation)
            setIsSharing(payload.new.is_sharing)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadLocation = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setLocation(data)
        setIsSharing(data.is_sharing)
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const updateLocation = async (latitude: number, longitude: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('user_locations')
        .upsert(
          {
            user_id: user.id,
            latitude,
            longitude,
            is_sharing: isSharing,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )
        .select()
        .single()

      if (error) throw error

      setLocation(data)
      return data
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const toggleSharing = async (share: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (!location) {
        // Get current location first
        const position = await getCurrentPosition()
        await updateLocation(position.latitude, position.longitude)
      }

      const { data, error } = await supabase
        .from('user_locations')
        .update({
          is_sharing: share,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setLocation(data)
      setIsSharing(share)
      return data
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
    })
  }

  const requestLocation = async () => {
    try {
      const position = await getCurrentPosition()
      await updateLocation(position.coords.latitude, position.coords.longitude)
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  return {
    location,
    isSharing,
    loading,
    error,
    updateLocation,
    toggleSharing,
    requestLocation,
    refresh: loadLocation,
  }
}


