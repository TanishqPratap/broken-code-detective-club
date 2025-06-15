
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

    const { streamId, amount, message, recipientId } = await req.json();

    // Support both stream tips and DM tips
    if (!streamId && !recipientId) {
      throw new Error("Either streamId or recipientId is required");
    }

    if (!amount) {
      throw new Error("Amount is required");
    }

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    let recipientData = null;
    let tipType = 'dm_tip';
    
    if (streamId) {
      // Stream tip - get creator from stream
      const { data: streamData } = await supabaseClient
        .from('live_streams')
        .select('creator_id')
        .eq('id', streamId)
        .single();
      
      if (streamData) {
        const { data: creatorData } = await supabaseClient
          .from('profiles')
          .select('display_name, username')
          .eq('id', streamData.creator_id)
          .single();
        
        recipientData = creatorData;
        tipType = 'stream_tip';
      }
    } else if (recipientId) {
      // DM tip - get recipient details
      const { data: creatorData } = await supabaseClient
        .from('profiles')
        .select('display_name, username')
        .eq('id', recipientId)
        .single();
      
      recipientData = creatorData;
    }

    // Get current USD to INR exchange rate
    const exchangeRate = await getUSDToINRRate();
    console.log('Current USD to INR exchange rate:', exchangeRate);

    // Convert USD amount to INR
    const amountInINR = amount * exchangeRate;
    console.log(`Converting ${amount} USD to ${amountInINR} INR`);

    // Create a shorter receipt (max 40 chars)
    const timestamp = Date.now().toString().slice(-8);
    const idShort = (streamId || recipientId).slice(0, 8);
    const receipt = `${tipType}_${idShort}_${timestamp}`;

    // Create Razorpay order
    const orderData = {
      amount: Math.round(amountInINR * 100), // Convert INR to paise
      currency: "INR",
      receipt: receipt,
      notes: {
        streamId: streamId || '',
        recipientId: recipientId || '',
        userId: user.id,
        recipientName: recipientData?.display_name || recipientData?.username || 'Unknown',
        originalAmountUSD: amount,
        exchangeRate: exchangeRate,
        amountINR: amountInINR,
        message: message || '',
        type: tipType
      }
    };

    console.log(`Creating Razorpay order for ${tipType}:`, orderData);

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
    console.error('Error creating tip payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
