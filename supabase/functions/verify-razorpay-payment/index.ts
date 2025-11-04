import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHONEPE_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";

function createPhonePeSignature(endpoint: string, saltKey: string): string {
  const stringToHash = endpoint + saltKey;
  const hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
  return hash;
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

    const { transactionId, streamId } = await req.json();

    if (!transactionId || !streamId) {
      throw new Error("Missing required payment verification parameters");
    }

    const merchantId = Deno.env.get("PHONEPE_CLIENT_ID");
    const saltKey = Deno.env.get("PHONEPE_CLIENT_SECRET");
    
    if (!merchantId || !saltKey) {
      throw new Error("PhonePe credentials not configured");
    }

    const endpoint = `/pg/v1/status/${merchantId}/${transactionId}`;
    const xVerify = createPhonePeSignature(endpoint, saltKey) + "###1";

    console.log('Checking stream payment status:', { transactionId });

    const response = await fetch(`${PHONEPE_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify
      }
    });

    const result = await response.json();

    if (!result.success || result.data.state !== 'COMPLETED') {
      throw new Error("Payment verification failed - invalid status");
    }

    console.log('Payment verified successfully');

    // Update subscription status to active
    const { data: updateData, error: updateError } = await supabaseClient
      .from('stream_subscriptions')
      .update({ 
        status: 'active',
        stripe_payment_intent_id: transactionId
      })
      .eq('stream_id', streamId)
      .eq('subscriber_id', user.id)
      .eq('stripe_payment_intent_id', transactionId)
      .select();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    console.log('Subscription updated successfully:', updateData);

    if (!updateData || updateData.length === 0) {
      throw new Error("No subscription found to update");
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Payment verified and subscription activated",
      subscription: updateData[0]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
