
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

const MerchandiseList = () => {
  const [items, setItems] = useState<Merchandise[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handlePurchase = async (item: Merchandise) => {
    if (!user) {
      toast.error("Please sign in to purchase items");
      return;
    }

    // For now, just show a message - in a real app this would integrate with payment
    toast.success(`Added ${item.name} to cart! (Payment integration coming soon)`);
    
    // Here you would typically:
    // 1. Create an order record
    // 2. Redirect to payment
    // 3. Handle payment confirmation
    console.log("Would purchase:", item);
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center min-h-[120px]">
        <span className="animate-pulse text-gray-500">Loading products…</span>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-gray-400 text-center py-8">
        <p className="text-lg">No merchandise available yet.</p>
        <p className="text-sm mt-2">Check back soon for amazing products from our creators!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map(item => (
        <Card key={item.id} className="relative group overflow-hidden hover:shadow-lg transition-shadow">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-48 object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop";
              }}
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-lg line-clamp-2">{item.name}</CardTitle>
            {item.description && (
              <CardDescription className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {item.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xl text-primary">${item.price}</span>
                {item.is_digital && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Digital</span>
                )}
              </div>
              
              {!item.is_digital && item.inventory !== null && (
                <p className="text-xs text-gray-500">
                  {item.inventory > 0 ? `${item.inventory} in stock` : "Out of stock"}
                </p>
              )}
              
              <Button
                className="w-full"
                onClick={() => handlePurchase(item)}
                disabled={!item.is_digital && (item.inventory === null || item.inventory <= 0)}
              >
                {item.is_digital ? "Buy & Download" : "Add to Cart"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MerchandiseList;
