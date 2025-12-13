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
    const refunded = formData.get("refunded") as string;
    const disputed = formData.get("disputed") as string;
    
    // Extract URL parameters passed from our app (contains user_id)
    const urlParams = formData.get("url_params") as string;
    let userId: string | null = null;
    
    if (urlParams) {
      try {
        const params = JSON.parse(urlParams);
        userId = params.user_id || null;
      } catch (e) {
        console.log("Could not parse url_params:", urlParams);
      }
    }
    
    console.log("Gumroad webhook received:", {
      saleId,
      productId,
      email,
      price,
      productName,
      refunded,
      disputed,
      userId,
      urlParams
    });

    // Verify this is a completed, non-refunded purchase
    if (refunded === "true") {
      console.log("Purchase was refunded, not adding coins");
      return new Response(
        JSON.stringify({ message: "Refunded purchase, no coins added" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (disputed === "true") {
      console.log("Purchase is disputed, not adding coins");
      return new Response(
        JSON.stringify({ message: "Disputed purchase, no coins added" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!saleId) {
      console.error("Missing sale_id - this is not a valid Gumroad webhook");
      return new Response(
        JSON.stringify({ error: "Missing sale_id" }),
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

    // Find the user - prefer user_id from URL params, fallback to email
    let profile = null;
    
    if (userId) {
      console.log("Looking up user by user_id:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error finding user by id:", error);
      } else {
        profile = data;
      }
    }
    
    // Fallback to email lookup if user_id not found
    if (!profile && email) {
      console.log("Looking up user by email:", email);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", email.trim())
        .maybeSingle();
      
      if (error) {
        console.error("Error finding user by email:", error);
      } else {
        profile = data;
      }
    }

    if (!profile) {
      console.error("User not found for userId:", userId, "or email:", email);
      return new Response(
        JSON.stringify({ error: "User not found. Please contact support with your Gumroad receipt." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Found user profile:", profile.id);

    // Find the coin package by matching price
    const priceInCents = parseInt(price) || 0;
    const priceInUsd = priceInCents / 100;

    console.log("Looking for coin package with price:", priceInUsd, "USD (from", priceInCents, "cents)");

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
        JSON.stringify({ error: "Coin package not found for this price. Please contact support." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Found coin package:", coinPackage.id, "with", coinPackage.coins, "coins");

    // Add coins to user's wallet using the add_coins function
    const { data: success, error: addError } = await supabase.rpc("add_coins", {
      p_user_id: profile.id,
      p_amount: coinPackage.coins,
      p_transaction_type: "purchase",
      p_description: `Purchased ${coinPackage.coins} coins via Gumroad (Sale: ${saleId})`,
      p_gumroad_sale_id: saleId,
    });

    if (addError) {
      console.error("Error adding coins:", addError);
      throw addError;
    }

    console.log("SUCCESS! Coins added:", {
      userId: profile.id,
      coins: coinPackage.coins,
      saleId,
      priceUsd: priceInUsd
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Added ${coinPackage.coins} coins to user wallet`,
        userId: profile.id,
        coins: coinPackage.coins
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
