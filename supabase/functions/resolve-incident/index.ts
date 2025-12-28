// Edge Function: resolve-incident
// Close an incident: Updates status, awards points to helpers, triggers badge checks

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

    const { incidentId } = await req.json()

    if (!incidentId) {
      throw new Error('Missing required field: incidentId')
    }

    // Get incident and verify user has permission
    const { data: incident, error: incidentError } = await supabaseAdmin
      .from('incidents')
      .select('*')
      .eq('id', incidentId)
      .single()

    if (incidentError || !incident) {
      throw new Error('Incident not found')
    }

    // Only victim or helpers can resolve
    const isVictim = incident.user_id === user.id
    const { data: helperResponse } = await supabaseAdmin
      .from('incident_helpers')
      .select('helper_id')
      .eq('incident_id', incidentId)
      .eq('helper_id', user.id)
      .single()

    if (!isVictim && !helperResponse) {
      throw new Error('Unauthorized to resolve this incident')
    }

    // Update incident status
    const { data: updatedIncident, error: updateError } = await supabaseAdmin
      .from('incidents')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString()
      })
      .eq('id', incidentId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Get all helpers who responded
    const { data: helpers, error: helpersError } = await supabaseAdmin
      .from('incident_helpers')
      .select('helper_id, status')
      .eq('incident_id', incidentId)

    if (helpersError) {
      console.error('Error fetching helpers:', helpersError)
    }

    // Award points to all helpers who completed the response
    const pointsResults = []
    if (helpers && helpers.length > 0) {
      for (const helper of helpers) {
        if (helper.status === 'completed' || helper.status === 'arrived') {
          const { data: pointsResult, error: pointsError } = await supabaseAdmin
            .rpc('award_user_points', {
              target_user_id: helper.helper_id,
              points_to_add: 100,
              reason: 'sos_completed'
            })

          if (!pointsError && pointsResult) {
            pointsResults.push({
              helper_id: helper.helper_id,
              ...pointsResult
            })

            // Check for badge unlocks
            await supabaseAdmin.rpc('check_badge_unlocks', {
              target_user_id: helper.helper_id
            })
          }
        }
      }
    }

    // Award points to victim for using the system (if they're the one resolving)
    if (isVictim) {
      const { data: victimPoints } = await supabaseAdmin
        .rpc('award_user_points', {
          target_user_id: user.id,
          points_to_add: 10,
          reason: 'check_in_timer_used'
        })
    }

    // Update helper statuses to completed
    if (helpers && helpers.length > 0) {
      await supabaseAdmin
        .from('incident_helpers')
        .update({ status: 'completed' })
        .eq('incident_id', incidentId)
        .neq('status', 'completed')
    }

    return new Response(
      JSON.stringify({
        success: true,
        incident: updatedIncident,
        helpersAwarded: pointsResults.length,
        pointsResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in resolve-incident:', error)
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

