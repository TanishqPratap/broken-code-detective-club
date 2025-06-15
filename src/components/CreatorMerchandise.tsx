
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CreatorMerchandiseModal from "./CreatorMerchandiseModal";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CreatorMerchandise = () => {
  const { user } = useAuth();
  const [merch, setMerch] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fetchMerch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("merchandise")
      .select("*")
      .eq("creator_id", user?.id)
      .order("created_at", { ascending: false });
    if (!error) setMerch(data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchMerch(); }, [user]);

  const removeProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    const { error } = await supabase.from("merchandise").delete().eq("id", id);
    if (!error) {
      setMerch(merch => merch.filter(m => m.id !== id));
      toast.success("Deleted.");
    } else {
      toast.error("Failed to delete.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Your Merchandise</h2>
        <Button onClick={() => { setEditing(null); setShowModal(true); }} variant="default">
          Add Merchandise
        </Button>
      </div>
      {loading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : merch.length === 0 ? (
        <div className="text-gray-400">No merchandise yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {merch.map(item => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="truncate flex items-center gap-2">
                  {item.name}
                  {item.is_published ? (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 rounded">Published</span>
                  ) : (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 rounded">Draft</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-full h-28 object-cover mb-2 rounded" />
                )}
                <div className="text-sm mb-2">{item.description}</div>
                <div className="font-bold text-lg mb-2">${item.price}</div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(item); setShowModal(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => removeProduct(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {item.is_digital
                    ? "Digital"
                    : `Inventory: ${item.inventory ?? 0}`}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {item.created_at ? `Created: ${new Date(item.created_at).toLocaleDateString()}` : ""}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreatorMerchandiseModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onProductSaved={fetchMerch}
        creatorId={user?.id}
        product={editing}
      />
    </div>
  );
};

export default CreatorMerchandise;
