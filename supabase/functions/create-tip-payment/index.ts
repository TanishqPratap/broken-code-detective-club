
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHONEPE_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";

async function getUSDToINRRate(): Promise<number> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    return data.rates.INR || 83;
  } catch (error) {
    console.log('Using fallback exchange rate');
    return 83;
  }
}

function createPhonePeSignature(base64Payload: string, endpoint: string, saltKey: string): string {
  const stringToHash = base64Payload + endpoint + saltKey;
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

    const { streamId, amount, message, recipientId } = await req.json();

    // Support both stream tips and DM tips
    if (!streamId && !recipientId) {
      throw new Error("Either streamId or recipientId is required");
    }

    if (!amount) {
      throw new Error("Amount is required");
    }

    const merchantId = Deno.env.get("PHONEPE_CLIENT_ID");
    const saltKey = Deno.env.get("PHONEPE_CLIENT_SECRET");
    
    if (!merchantId || !saltKey) {
      throw new Error("PhonePe credentials not configured");
    }

    let recipientData = null;
    let tipType = 'dm_tip';
    let streamData = null;
    
    if (streamId) {
      // Stream tip - get creator from stream
      streamData = (await supabaseClient
        .from('live_streams')
        .select('creator_id')
        .eq('id', streamId)
        .single()).data;
      
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

    const exchangeRate = await getUSDToINRRate();
    const amountInINR = Math.round(amount * exchangeRate);
    const amountInPaise = amountInINR * 100;

    const transactionId = `TIP_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const merchantOrderId = `ORDER_${Date.now()}`;

    const payload = {
      merchantId: merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: user.id,
      amount: amountInPaise,
      redirectUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/phonepe-callback`,
      redirectMode: "POST",
      callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/phonepe-callback`,
      merchantOrderId: merchantOrderId,
      mobileNumber: user.phone || "9999999999",
      message: `Tip to ${recipientData?.display_name || recipientData?.username || 'Creator'}${message ? `: ${message}` : ''}`,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    const base64Payload = btoa(JSON.stringify(payload));
    const endpoint = "/pg/v1/pay";
    const xVerify = createPhonePeSignature(base64Payload, endpoint, saltKey) + "###1";

    console.log('Creating PhonePe tip payment:', { transactionId, merchantOrderId });

    const response = await fetch(`${PHONEPE_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify
      },
      body: JSON.stringify({ request: base64Payload })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to create payment order");
    }

    console.log('PhonePe tip payment order created successfully');

    return new Response(JSON.stringify({
      success: true,
      transactionId: transactionId,
      merchantOrderId: merchantOrderId,
      paymentUrl: result.data.instrumentResponse.redirectInfo.url,
      amountINR: amountInINR,
      amountUSD: amount,
      exchangeRate: exchangeRate,
      recipientId: streamData?.creator_id || recipientId,
      streamId: streamId
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
