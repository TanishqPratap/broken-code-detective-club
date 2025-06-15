
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to create HMAC SHA256 signature
async function createSignature(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user?.email) throw new Error("User not authenticated");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, streamId, recipientId, amount, message } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      throw new Error("Missing required payment verification parameters");
    }

    if (!streamId && !recipientId) {
      throw new Error("Either streamId or recipientId is required");
    }

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay key secret not configured");
    }

    // Verify payment signature
    const verificationMessage = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = await createSignature(verificationMessage, razorpayKeySecret);

    console.log('Verifying tip payment signature:', { verificationMessage, expectedSignature, receivedSignature: razorpay_signature });

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Payment verification failed - invalid signature");
    }

    console.log('Tip payment signature verified successfully');

    let tipData;

    if (streamId) {
      // Stream tip
      const { data: streamData } = await supabaseClient
        .from('live_streams')
        .select('creator_id')
        .eq('id', streamId)
        .single();

      if (!streamData) {
        throw new Error("Stream not found");
      }

      const { data: insertedTip, error: tipError } = await supabaseClient
        .from('stream_tips')
        .insert({
          tipper_id: user.id,
          stream_id: streamId,
          amount: amount,
          message: message || null
        })
        .select()
        .single();

      if (tipError) {
        console.error('Database insert error:', tipError);
        throw new Error(`Failed to save stream tip: ${tipError.message}`);
      }

      tipData = insertedTip;
      console.log('Stream tip saved successfully:', tipData);
    } else {
      // DM tip
      const { data: insertedTip, error: tipError } = await supabaseClient
        .from('tips')
        .insert({
          tipper_id: user.id,
          creator_id: recipientId,
          amount: amount,
          message: message || null,
          stripe_payment_intent_id: razorpay_payment_id
        })
        .select()
        .single();

      if (tipError) {
        console.error('Database insert error:', tipError);
        throw new Error(`Failed to save DM tip: ${tipError.message}`);
      }

      tipData = insertedTip;
      console.log('DM tip saved successfully:', tipData);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Payment verified and tip saved",
      tip: tipData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error verifying tip payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
