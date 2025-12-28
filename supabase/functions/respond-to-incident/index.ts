// Edge Function: respond-to-incident
// For helpers responding to SOS: Adds helper to incident_helpers, updates location, awards points

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

    const { incidentId, latitude, longitude } = await req.json()

    if (!incidentId) {
      throw new Error('Missing required field: incidentId')
    }

    // Verify incident exists and is active
    const { data: incident, error: incidentError } = await supabaseAdmin
      .from('incidents')
      .select('*')
      .eq('id', incidentId)
      .eq('status', 'active')
      .single()

    if (incidentError || !incident) {
      throw new Error('Incident not found or not active')
    }

    // Check if already responding
    const { data: existingResponse } = await supabaseAdmin
      .from('incident_helpers')
      .select('*')
      .eq('incident_id', incidentId)
      .eq('helper_id', user.id)
      .single()

    if (existingResponse) {
      // Update existing response
      const { data: updatedResponse, error: updateError } = await supabaseAdmin
        .from('incident_helpers')
        .update({
          responded_at: new Date().toISOString(),
          status: 'responding'
        })
        .eq('id', existingResponse.id)
        .select()
        .single()

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({
          success: true,
          response: updatedResponse,
          message: 'Response updated'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Add helper to incident_helpers
    const { data: helperResponse, error: helperError } = await supabaseAdmin
      .from('incident_helpers')
      .insert({
        incident_id: incidentId,
        helper_id: user.id,
        responded_at: new Date().toISOString(),
        status: 'responding'
      })
      .select()
      .single()

    if (helperError) {
      throw helperError
    }

    // Update helper's location if provided
    if (latitude && longitude) {
      await supabaseAdmin
        .from('user_locations')
        .upsert({
          user_id: user.id,
          latitude: latitude,
          longitude: longitude,
          is_sharing: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
    }

    // Check if this is the first responder (award bonus points)
    const { data: allHelpers } = await supabaseAdmin
      .from('incident_helpers')
      .select('responded_at')
      .eq('incident_id', incidentId)
      .order('responded_at', { ascending: true })

    const isFirstResponder = allHelpers && allHelpers.length === 1

    // Award points (150 for first responder, 100 for others)
    const pointsToAward = isFirstResponder ? 150 : 100
    const { data: pointsResult, error: pointsError } = await supabaseAdmin
      .rpc('award_user_points', {
        target_user_id: user.id,
        points_to_add: pointsToAward,
        reason: isFirstResponder ? 'first_responder' : 'sos_response'
      })

    if (pointsError) {
      console.error('Error awarding points:', pointsError)
    }

    // Check for badge unlocks
    const { data: badgeResult } = await supabaseAdmin
      .rpc('check_badge_unlocks', {
        target_user_id: user.id
      })

    // TODO: Notify victim that help is coming
    // TODO: Send push notification

    return new Response(
      JSON.stringify({
        success: true,
        response: helperResponse,
        pointsAwarded: pointsResult,
        badgesUnlocked: badgeResult,
        isFirstResponder
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in respond-to-incident:', error)
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

