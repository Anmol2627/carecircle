// Edge Function: check-in-timer
// Timer management: Creates check-in timer, handles expiration

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const supabaseClient = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, timerId, durationMinutes } = await req.json()

    // CREATE TIMER
    if (action === 'create') {
      if (!durationMinutes || durationMinutes <= 0) {
        throw new Error('durationMinutes must be greater than 0')
      }

      const startedAt = new Date()
      const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000)

      // Cancel any existing active timers for this user
      await supabaseAdmin
        .from('check_in_timers')
        .update({ status: 'expired' })
        .eq('user_id', user.id)
        .eq('status', 'active')

      // Create new timer
      const { data: timer, error: timerError } = await supabaseAdmin
        .from('check_in_timers')
        .insert({
          user_id: user.id,
          duration_minutes: durationMinutes,
          started_at: startedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'active'
        })
        .select()
        .single()

      if (timerError) {
        throw timerError
      }

      return new Response(
        JSON.stringify({
          success: true,
          timer,
          message: 'Check-in timer created'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // CHECK IN (mark timer as checked in)
    if (action === 'check_in') {
      if (!timerId) {
        throw new Error('Missing required field: timerId')
      }

      const { data: timer, error: timerError } = await supabaseAdmin
        .from('check_in_timers')
        .update({ status: 'checked_in' })
        .eq('id', timerId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .select()
        .single()

      if (timerError || !timer) {
        throw new Error('Timer not found or already expired/checked in')
      }

      // Award points for using check-in
      const { data: pointsResult } = await supabaseAdmin
        .rpc('award_user_points', {
          target_user_id: user.id,
          points_to_add: 10,
          reason: 'check_in_timer_used'
        })

      return new Response(
        JSON.stringify({
          success: true,
          timer,
          pointsAwarded: pointsResult
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // CHECK EXPIRED TIMERS (should be called by cron job)
    if (action === 'check_expired') {
      const now = new Date().toISOString()

      // Find all expired active timers
      const { data: expiredTimers, error: expiredError } = await supabaseAdmin
        .from('check_in_timers')
        .select('*')
        .eq('status', 'active')
        .lt('expires_at', now)

      if (expiredError) {
        throw expiredError
      }

      // Mark as expired and trigger silent alerts
      const results = []
      for (const timer of expiredTimers || []) {
        // Update timer status
        await supabaseAdmin
          .from('check_in_timers')
          .update({ status: 'expired' })
          .eq('id', timer.id)

        // Get user's current location if available
        const { data: userLocation } = await supabaseAdmin
          .from('user_locations')
          .select('latitude, longitude')
          .eq('user_id', timer.user_id)
          .single()

        // Create silent alert incident
        const { data: incident, error: incidentError } = await supabaseAdmin
          .from('incidents')
          .insert({
            user_id: timer.user_id,
            type: 'silent',
            status: 'active',
            location_lat: userLocation?.latitude || null,
            location_lng: userLocation?.longitude || null,
            description: 'Check-in timer expired without check-in'
          })
          .select()
          .single()

        if (!incidentError && incident) {
          results.push({
            timer_id: timer.id,
            user_id: timer.user_id,
            incident_id: incident.id
          })
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          expiredCount: expiredTimers?.length || 0,
          alertsCreated: results.length,
          results
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // GET ACTIVE TIMER
    if (action === 'get_active') {
      const { data: timer, error: timerError } = await supabaseAdmin
        .from('check_in_timers')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (timerError && timerError.code !== 'PGRST116') {
        throw timerError
      }

      return new Response(
        JSON.stringify({
          success: true,
          timer: timer || null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    throw new Error('Invalid action. Use: create, check_in, check_expired, or get_active')
  } catch (error) {
    console.error('Error in check-in-timer:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

