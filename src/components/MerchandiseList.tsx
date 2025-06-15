
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Merchandise = {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_digital: boolean;
  digital_download_url: string | null;
};

const MerchandiseList = () => {
  const [items, setItems] = useState<Merchandise[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center min-h-[120px]">
        <span className="animate-pulse text-gray-500">Loading products…</span>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-gray-400 text-center py-4">No merchandise available yet. Check back soon!</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
      {items.map(item => (
        <Card key={item.id} className="relative group overflow-hidden">
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-40 object-cover rounded-t"
              loading="lazy"
            />
          )}
          <CardHeader>
            <CardTitle className="truncate">{item.name}</CardTitle>
            <CardDescription className="truncate text-sm text-gray-600 dark:text-gray-300">
              {item.description?.slice(0, 80)}
              {item.description && item.description.length > 80 ? "…" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <span className="font-bold text-lg text-primary">${item.price}</span>
              <Button
                variant="default"
                className="w-full"
                disabled
                title="Purchase flow coming soon!"
              >
                {item.is_digital ? "Buy & Download" : "Buy Now"}
              </Button>
              {/* In a real app, this would connect to checkout/modal etc. */}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MerchandiseList;
