
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";

interface Merchandise {
  id: string;
  name: string;
  description: string;
  price_coins: number | null;
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
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { balance, transferCoins, refreshWallet } = useWallet();

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
        .gt('inventory', 0)
        .not('price_coins', 'is', null);

      if (error) throw error;
      setMerchandise(data || []);
    } catch (error) {
      console.error('Error fetching merchandise:', error);
      toast({
        title: "Error",
        description: "Failed to load merchandise. Please try again.",
        variant: "destructive",
      });
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

    if (!item.price_coins) {
      toast({
        title: "Error",
        description: "This item doesn't have a valid price",
        variant: "destructive",
      });
      return;
    }

    if (balance < item.price_coins) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${item.price_coins} coins but only have ${balance}. Please buy more coins.`,
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(item.id);

    try {
      // Transfer coins to creator
      const success = await transferCoins(
        item.creator_id,
        item.price_coins,
        `Purchase: ${item.name}`,
        item.id
      );

      if (!success) {
        throw new Error("Failed to process payment");
      }

      // Create order record
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          merchandise_id: item.id,
          price: item.price_coins,
          quantity: 1,
          status: 'completed'
        });

      if (orderError) throw orderError;

      // Update inventory
      await supabase
        .from('merchandise')
        .update({ inventory: item.inventory - 1 })
        .eq('id', item.id);

      toast({
        title: "Purchase Successful!",
        description: `You have successfully purchased ${item.name} for ${item.price_coins} coins`,
      });

      // Refresh data
      fetchMerchandise();
      refreshWallet();
    } catch (error: any) {
      console.error('Error purchasing merchandise:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to complete purchase",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
            <Coins className="w-4 h-4" />
            Your Balance: {balance} Coins
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            {merchandise.length} Items Available
          </Badge>
        </div>
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
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Package className="w-12 h-12 text-muted-foreground" />
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
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold flex items-center gap-1">
                    <Coins className="w-5 h-5" />
                    {item.price_coins}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.inventory} in stock
                  </span>
                </div>
                
                <Button 
                  onClick={() => handlePurchase(item)}
                  disabled={item.inventory === 0 || processingPayment === item.id || !item.price_coins}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {processingPayment === item.id ? 'Processing...' : 'Buy Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {merchandise.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No merchandise available</h3>
          <p className="text-muted-foreground">Check back later for new items from creators!</p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
