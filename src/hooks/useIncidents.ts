// Hook: useIncidents
// CRUD operations for incidents with realtime updates

import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Incident {
  id: string
  user_id: string
  type: 'sos' | 'silent' | 'check-in' | 'escort'
  status: 'active' | 'resolved' | 'cancelled'
  location_lat: number | null
  location_lng: number | null
  description: string | null
  created_at: string | null
  resolved_at: string | null
}

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadIncidents()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('incidents-realtime')
      .on<Incident>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setIncidents((prev) => [payload.new as Incident, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setIncidents((prev) =>
              prev.map((inc) =>
                inc.id === payload.new.id ? (payload.new as Incident) : inc
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setIncidents((prev) => prev.filter((inc) => inc.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadIncidents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setIncidents(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const triggerSOS = async (
    type: Incident['type'],
    latitude: number,
    longitude: number,
    description?: string,
    options?: {
      emergency_type?: string;
      voice_note_url?: string;
      is_silent_alert?: boolean;
      auto_contact?: {
        campusSecurity?: boolean;
        police?: boolean;
        ambulance?: boolean;
        trustedCircle?: boolean;
      };
    }
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-sos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type,
            latitude,
            longitude,
            description,
            ...options,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to trigger SOS')
      }

      return await response.json()
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const respondToIncident = async (
    incidentId: string,
    latitude?: number,
    longitude?: number
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/respond-to-incident`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            incidentId,
            latitude,
            longitude,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to respond to incident')
      }

      return await response.json()
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const resolveIncident = async (incidentId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-incident`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ incidentId }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to resolve incident')
      }

      return await response.json()
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const getActiveIncidents = () => {
    return incidents.filter((inc) => inc.status === 'active')
  }

  return {
    incidents,
    activeIncidents: getActiveIncidents(),
    loading,
    error,
    triggerSOS,
    respondToIncident,
    resolveIncident,
    refresh: loadIncidents,
  }
}


