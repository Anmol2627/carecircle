// Edge Function: trigger-sos
// Handles SOS activation: Creates incident record, notifies trusted circle, finds nearby helpers

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client with service role for admin operations
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

    // Create client for user context
    const supabaseClient = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { 
      type, 
      latitude, 
      longitude, 
      description,
      emergency_type,
      voice_note_url,
      is_silent_alert,
      auto_contact,
      triggered_by_shake,
      triggered_by_calculator
    } = await req.json()

    if (!type || !latitude || !longitude) {
      throw new Error('Missing required fields: type, latitude, longitude')
    }

    // Create incident with new fields
    const { data: incident, error: incidentError } = await supabaseAdmin
      .from('incidents')
      .insert({
        user_id: user.id,
        type: type,
        emergency_type: emergency_type || null,
        location_lat: latitude,
        location_lng: longitude,
        description: description || null,
        voice_note_url: voice_note_url || null,
        is_silent_alert: is_silent_alert || false,
        triggered_by_shake: triggered_by_shake || false,
        triggered_by_calculator: triggered_by_calculator || false,
        status: 'active'
      })
      .select()
      .single()

    if (incidentError) {
      throw incidentError
    }

    // Create notifications using database function
    try {
      await supabaseAdmin.rpc('create_incident_notifications', {
        p_incident_id: incident.id
      })
    } catch (error) {
      console.error('Error creating notifications:', error)
    }

    // Auto-contact emergency services if enabled
    if (auto_contact) {
      try {
        await supabaseAdmin.rpc('auto_contact_emergency_services', {
          p_incident_id: incident.id
        })
      } catch (error) {
        console.error('Error auto-contacting emergency services:', error)
      }
    }

    // Get trusted circle contacts for response
    const { data: trustedContacts, error: contactsError } = await supabaseAdmin
      .from('trusted_circles')
      .select(`
        trusted_user_id,
        profiles:trusted_user_id (
          user_id,
          full_name,
          avatar_url,
          phone
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted')

    if (contactsError) {
      console.error('Error fetching trusted contacts:', contactsError)
    }

    // Find nearby helpers using database function (if it exists)
    let nearbyHelpers = null
    try {
      const { data, error: helpersError } = await supabaseAdmin
        .rpc('find_nearby_helpers', {
          incident_lat: latitude,
          incident_lng: longitude,
          radius_km: 2
        })
      if (!helpersError) {
        nearbyHelpers = data
      }
    } catch (error) {
      console.error('Error finding nearby helpers:', error)
    }

    // Update user location if available
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

    // TODO: Send push notifications to trusted contacts
    // TODO: Send push notifications to nearby helpers
    // This would require Expo Push Notifications or FCM setup

    return new Response(
      JSON.stringify({
        success: true,
        incident,
        notifiedCount: trustedContacts?.length || 0,
        nearbyHelpersCount: nearbyHelpers?.length || 0,
        nearbyHelpers: nearbyHelpers || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in trigger-sos:', error)
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

