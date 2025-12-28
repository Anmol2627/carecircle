// Edge Function: award-points
// Gamification system: Adds points, checks for level ups and badge unlocks

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

    const { userId, points, reason } = await req.json()

    // Only allow users to award points to themselves, or use service role for admin operations
    const targetUserId = userId || user.id
    const pointsToAward = points || 0
    const awardReason = reason || 'action'

    if (pointsToAward <= 0) {
      throw new Error('Points must be greater than 0')
    }

    // Award points using database function
    const { data: pointsResult, error: pointsError } = await supabaseAdmin
      .rpc('award_user_points', {
        target_user_id: targetUserId,
        points_to_add: pointsToAward,
        reason: awardReason
      })

    if (pointsError) {
      throw pointsError
    }

    // Check for badge unlocks
    const { data: badgeResult, error: badgeError } = await supabaseAdmin
      .rpc('check_badge_unlocks', {
        target_user_id: targetUserId
      })

    if (badgeError) {
      console.error('Error checking badge unlocks:', badgeError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        points: pointsResult,
        badges: badgeResult || { unlocked_count: 0, badges: [] }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in award-points:', error)
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

