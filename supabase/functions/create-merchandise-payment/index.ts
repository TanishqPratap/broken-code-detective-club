
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to get USD to INR exchange rate
async function getUSDToINRRate(): Promise<number> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    return data.rates.INR || 83;
  } catch (error) {
    console.log('Exchange rate API failed, using fallback rate:', error);
    return 83;
  }
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

    const { merchandiseId, amount, quantity = 1 } = await req.json();

    if (!merchandiseId || !amount) {
      throw new Error("Missing required parameters");
    }

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    // Get merchandise details
    const { data: merchandiseData } = await supabaseClient
      .from('merchandise')
      .select('name, creator_id, profiles:creator_id(display_name, username)')
      .eq('id', merchandiseId)
      .single();

    // Get current USD to INR exchange rate
    const exchangeRate = await getUSDToINRRate();
    console.log('Current USD to INR exchange rate:', exchangeRate);

    // Convert USD amount to INR
    const amountInINR = amount * exchangeRate;
    console.log(`Converting ${amount} USD to ${amountInINR} INR`);

    // Create a shorter receipt (max 40 chars)
    const timestamp = Date.now().toString().slice(-8);
    const merchandiseIdShort = merchandiseId.slice(0, 8);
    const receipt = `merch_${merchandiseIdShort}_${timestamp}`;

    // Create Razorpay order
    const orderData = {
      amount: Math.round(amountInINR * 100), // Convert INR to paise
      currency: "INR",
      receipt: receipt,
      notes: {
        merchandiseId,
        userId: user.id,
        itemName: merchandiseData?.name || 'Unknown Item',
        originalAmountUSD: amount,
        exchangeRate: exchangeRate,
        amountINR: amountInINR,
        quantity: quantity,
        type: 'merchandise'
      }
    };

    console.log('Creating Razorpay order for merchandise:', orderData);

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const responseText = await razorpayResponse.text();
    console.log('Razorpay response status:', razorpayResponse.status);
    console.log('Razorpay response:', responseText);

    if (!razorpayResponse.ok) {
      console.error('Razorpay API error:', responseText);
      throw new Error(`Razorpay API error: ${responseText}`);
    }

    const order = JSON.parse(responseText);

    return new Response(JSON.stringify({ 
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: razorpayKeyId,
      amount_usd: amount,
      amount_inr: amountInINR,
      exchange_rate: exchangeRate
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error creating merchandise payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
