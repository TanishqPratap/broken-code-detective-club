
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Merchandise = {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_digital: boolean;
  digital_download_url: string | null;
  inventory: number | null;
  is_published: boolean;
  created_at: string;
};

// Currency conversion rates (in a real app, this would come from an API)
const CURRENCY_RATES = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  INR: 83.12,
  JPY: 149.50,
  CAD: 1.35,
  AUD: 1.52
};

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$'
};

const MerchandiseList = () => {
  const [items, setItems] = useState<Merchandise[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<keyof typeof CURRENCY_RATES>('USD');
  const { user } = useAuth();

  useEffect(() => {
    const fetchMerch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("merchandise")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(12);
      if (!error && data) {
        setItems(data as Merchandise[]);
      }
      setLoading(false);
    };
    fetchMerch();
  }, []);

  const convertPrice = (price: number) => {
    const convertedPrice = price * CURRENCY_RATES[currency];
    return convertedPrice.toLocaleString('en-US', {
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2
    });
  };

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (item: Merchandise) => {
    if (!user) {
      toast.error("Please sign in to purchase items");
      return;
    }

    const razorpayLoaded = await initializeRazorpay();
    if (!razorpayLoaded) {
      toast.error("Failed to load payment gateway");
      return;
    }

    const convertedPrice = item.price * CURRENCY_RATES[currency];
    const amountInPaise = Math.round(convertedPrice * 100); // Razorpay expects amount in smallest currency unit

    const options = {
      key: "Test_key", // Your test key
      amount: amountInPaise,
      currency: currency,
      name: "CreatorHub",
      description: item.name,
      image: "/placeholder.svg",
      handler: async function (response: any) {
        try {
          // Create order record
          const { error } = await supabase
            .from("orders")
            .insert([
              {
                buyer_id: user.id,
                merchandise_id: item.id,
                quantity: 1,
                price: convertedPrice,
                status: "completed",
                digital_delivery_url: item.is_digital ? item.digital_download_url : null
              }
            ]);

          if (error) throw error;

          toast.success(`Successfully purchased ${item.name}!`);
          
          if (item.is_digital && item.digital_download_url) {
            window.open(item.digital_download_url, '_blank');
          }
        } catch (error: any) {
          toast.error("Failed to process order: " + error.message);
        }
      },
      prefill: {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email,
      },
      theme: {
        color: "#3B82F6",
      },
      modal: {
        ondismiss: function() {
          toast.info("Payment cancelled");
        }
      }
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <span className="text-gray-500">Loading products...</span>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-gray-400 text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🛍️</div>
          <p className="text-xl mb-2">No merchandise available yet.</p>
          <p className="text-sm">Check back soon for amazing products from our creators!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Currency Selector */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Currency:</span>
          <Select value={currency} onValueChange={(value: keyof typeof CURRENCY_RATES) => setCurrency(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(CURRENCY_RATES).map((curr) => (
                <SelectItem key={curr} value={curr}>
                  {curr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
          <Card key={item.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md">
            <div className="relative">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop";
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">📦</span>
                </div>
              )}
              {item.is_digital && (
                <div className="absolute top-2 right-2">
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-medium">
                    Digital
                  </span>
                </div>
              )}
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                {item.name}
              </CardTitle>
              {item.description && (
                <CardDescription className="text-sm text-gray-600 line-clamp-2">
                  {item.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="pt-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xl text-blue-600">
                    {CURRENCY_SYMBOLS[currency]}{convertPrice(item.price)}
                  </span>
                  {currency !== 'USD' && (
                    <span className="text-xs text-gray-500">
                      (${item.price} USD)
                    </span>
                  )}
                </div>
                
                {!item.is_digital && item.inventory !== null && (
                  <p className="text-xs text-gray-500">
                    {item.inventory > 0 ? (
                      <span className="text-green-600">✓ {item.inventory} in stock</span>
                    ) : (
                      <span className="text-red-500">✗ Out of stock</span>
                    )}
                  </p>
                )}
                
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  onClick={() => handlePurchase(item)}
                  disabled={!item.is_digital && (item.inventory === null || item.inventory <= 0)}
                >
                  {item.is_digital ? "Buy & Download" : "Buy Now"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MerchandiseList;
