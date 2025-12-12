import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    
    // Extract Gumroad webhook data
    const saleId = formData.get("sale_id") as string;
    const productId = formData.get("product_id") as string;
    const email = formData.get("email") as string;
    const price = formData.get("price") as string;
    const productName = formData.get("product_name") as string;
    
    console.log("Gumroad webhook received:", {
      saleId,
      productId,
      email,
      price,
      productName
    });

    if (!saleId || !email) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this sale has already been processed
    const { data: existingTransaction, error: checkError } = await supabase
      .from("coin_transactions")
      .select("id")
      .eq("gumroad_sale_id", saleId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing transaction:", checkError);
      throw checkError;
    }

    if (existingTransaction) {
      console.log("Sale already processed:", saleId);
      return new Response(
        JSON.stringify({ message: "Sale already processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the user by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      console.error("Error finding user:", profileError);
      throw profileError;
    }

    if (!profile) {
      console.error("User not found for email:", email);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the coin package by matching price or product name
    const priceInCents = parseInt(price) || 0;
    const priceInUsd = priceInCents / 100;

    const { data: coinPackage, error: packageError } = await supabase
      .from("coin_packages")
      .select("*")
      .eq("price_usd", priceInUsd)
      .eq("is_active", true)
      .maybeSingle();

    if (packageError) {
      console.error("Error finding coin package:", packageError);
      throw packageError;
    }

    if (!coinPackage) {
      console.error("Coin package not found for price:", priceInUsd);
      return new Response(
        JSON.stringify({ error: "Coin package not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add coins to user's wallet using the add_coins function
    const { data: success, error: addError } = await supabase.rpc("add_coins", {
      p_user_id: profile.id,
      p_amount: coinPackage.coins,
      p_transaction_type: "purchase",
      p_description: `Purchased ${coinPackage.coins} coins via Gumroad`,
      p_gumroad_sale_id: saleId,
    });

    if (addError) {
      console.error("Error adding coins:", addError);
      throw addError;
    }

    console.log("Coins added successfully:", {
      userId: profile.id,
      coins: coinPackage.coins,
      saleId
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Added ${coinPackage.coins} coins to user wallet` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error processing Gumroad webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
