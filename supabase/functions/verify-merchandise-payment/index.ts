
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      merchandiseId,
      amount,
      quantity = 1
    } = await req.json();

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret not configured");
    }

    // Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(razorpayKeySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(body)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    console.log('Payment signature verified successfully');

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
      // Don't throw here as payment is already successful
    }

    console.log('Merchandise order created successfully');

    return new Response(JSON.stringify({ 
      success: true,
      payment_id: razorpay_payment_id,
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
