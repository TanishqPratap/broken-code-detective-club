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

    const { 
      transactionId,
      merchandiseId,
      amount,
      quantity = 1
    } = await req.json();

    const merchantId = Deno.env.get("PHONEPE_CLIENT_ID");
    const saltKey = Deno.env.get("PHONEPE_CLIENT_SECRET");
    
    if (!merchantId || !saltKey) {
      throw new Error("PhonePe credentials not configured");
    }

    const endpoint = `/pg/v1/status/${merchantId}/${transactionId}`;
    const xVerify = createPhonePeSignature(endpoint, saltKey) + "###1";

    console.log('Checking merchandise payment status:', { transactionId });

    const response = await fetch(`${PHONEPE_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify
      }
    });

    const result = await response.json();

    if (!result.success || result.data.state !== 'COMPLETED') {
      throw new Error("Payment not completed");
    }

    console.log('Payment verified successfully');

    // Create the order record
    const { error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        buyer_id: user.id,
        merchandise_id: merchandiseId,
        quantity: quantity,
        price: amount,
        status: 'completed'
      });

    if (orderError) throw orderError;

    // Update merchandise inventory
    const { error: inventoryError } = await supabaseClient
      .from('merchandise')
      .update({
        inventory: supabaseClient.raw('inventory - ?', [quantity])
      })
      .eq('id', merchandiseId);

    if (inventoryError) {
      console.error('Error updating inventory:', inventoryError);
    }

    console.log('Merchandise order created successfully');

    return new Response(JSON.stringify({ 
      success: true,
      payment_id: transactionId,
      order_status: 'completed'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error verifying merchandise payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
