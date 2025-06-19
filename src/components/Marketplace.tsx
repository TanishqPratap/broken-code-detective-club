
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Merchandise {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_digital: boolean;
  inventory: number;
  creator_id: string;
  profiles: {
    display_name: string;
    username: string;
  };
}

const Marketplace = () => {
  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMerchandise();
  }, []);

  const fetchMerchandise = async () => {
    try {
      const { data, error } = await supabase
        .from('merchandise')
        .select(`
          *,
          profiles:creator_id (
            display_name,
            username
          )
        `)
        .eq('is_published', true)
        .gt('inventory', 0);

      if (error) throw error;
      setMerchandise(data || []);
    } catch (error) {
      console.error('Error fetching merchandise:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: Merchandise) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a purchase",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          merchandise_id: item.id,
          quantity: 1,
          price: item.price,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Order Placed",
        description: `Your order for ${item.name} has been placed successfully!`,
      });

      // Refresh merchandise to update inventory
      fetchMerchandise();
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading marketplace...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          {merchandise.length} Items Available
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {merchandise.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="aspect-square relative">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
              )}
              {item.is_digital && (
                <Badge className="absolute top-2 right-2">Digital</Badge>
              )}
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                by {item.profiles?.display_name || item.profiles?.username}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {item.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold flex items-center">
                    <DollarSign className="w-5 h-5" />
                    {item.price}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.inventory} in stock
                  </span>
                </div>
                
                <Button 
                  onClick={() => handlePurchase(item)}
                  disabled={item.inventory === 0}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Buy Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {merchandise.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No merchandise available</h3>
          <p className="text-gray-600">Check back later for new items from creators!</p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
