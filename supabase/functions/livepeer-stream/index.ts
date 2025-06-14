
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
    const { action, streamData } = await req.json()
    const livepeerApiKey = Deno.env.get('LIVEPEER_API_KEY')
    
    if (!livepeerApiKey) {
      throw new Error('Livepeer API key not configured')
    }

    let response;
    
    if (action === 'create') {
      // Create a new stream
      response = await fetch('https://livepeer.studio/api/stream', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${livepeerApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: streamData.title,
          record: true,
        }),
      })
    } else if (action === 'get') {
      // Get stream info
      response = await fetch(`https://livepeer.studio/api/stream/${streamData.streamId}`, {
        headers: {
          'Authorization': `Bearer ${livepeerApiKey}`,
        },
      })
    }

    if (!response?.ok) {
      throw new Error(`Livepeer API error: ${response?.status}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
