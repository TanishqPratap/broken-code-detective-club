
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the JWT token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { userId } = await req.json()

    if (userId !== user.id) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders })
    }

    // For production, you would use Stream's server-side SDK to generate tokens
    // For now, we'll create a simple token (in production, use proper JWT with your Stream secret)
    const streamApiKey = 'jbbw9vqpfkrx'
    const streamSecret = Deno.env.get('STREAM_SECRET_KEY')

    if (!streamSecret) {
      return new Response('Stream secret not configured', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Simple token generation - in production, use Stream's proper JWT library
    const payload = {
      user_id: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    }

    // Note: This is a simplified token. In production, use proper JWT signing with Stream's library
    const token = btoa(JSON.stringify(payload))

    return new Response(
      JSON.stringify({ token }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
