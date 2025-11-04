
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

    const { merchandiseId, amount, quantity = 1 } = await req.json();

    if (!merchandiseId || !amount) {
      throw new Error("Missing required parameters");
    }

    const merchantId = Deno.env.get("PHONEPE_CLIENT_ID");
    const saltKey = Deno.env.get("PHONEPE_CLIENT_SECRET");
    
    if (!merchantId || !saltKey) {
      throw new Error("PhonePe credentials not configured");
    }

    const { data: merchandise } = await supabaseClient
      .from('merchandise')
      .select('name, creator_id')
      .eq('id', merchandiseId)
      .single();

    if (!merchandise) throw new Error("Merchandise not found");

    const exchangeRate = await getUSDToINRRate();
    const amountInINR = Math.round(amount * exchangeRate);
    const amountInPaise = amountInINR * 100;

    const transactionId = `MERCH_${Date.now()}_${Math.random().toString(36).substring(7)}`;
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
      message: `Purchase of ${merchandise.name} (Qty: ${quantity})`,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    const base64Payload = btoa(JSON.stringify(payload));
    const endpoint = "/pg/v1/pay";
    const xVerify = createPhonePeSignature(base64Payload, endpoint, saltKey) + "###1";

    console.log('Creating PhonePe merchandise payment:', { transactionId, merchantOrderId });

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

    console.log('PhonePe merchandise payment order created successfully');

    return new Response(JSON.stringify({
      success: true,
      transactionId: transactionId,
      merchantOrderId: merchantOrderId,
      paymentUrl: result.data.instrumentResponse.redirectInfo.url,
      amountINR: amountInINR,
      amountUSD: amount,
      exchangeRate: exchangeRate,
      merchandiseId: merchandiseId,
      quantity: quantity
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
