
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onProductSaved: () => void;
  creatorId: string;
  product?: any;
}

const defaultForm = {
  name: "",
  description: "",
  price: "",
  image_url: "",
  is_digital: false,
  digital_download_url: "",
  inventory: 0,
  is_published: false,
};

const CreatorMerchandiseModal = ({
  open,
  onClose,
  onProductSaved,
  creatorId,
  product,
}: Props) => {
  const [form, setForm] = useState(product || defaultForm);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when modal opens or product changes
  React.useEffect(() => {
    setForm(product || defaultForm);
  }, [open, product]);

  const saveMerchandise = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.name || !form.price) {
        toast({ title: "Error", description: "Name and price are required", variant: "destructive" });
        setLoading(false);
        return;
      }
      const changes = {
        creator_id: creatorId,
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        image_url: form.image_url,
        is_digital: form.is_digital,
        digital_download_url: form.is_digital ? form.digital_download_url : null,
        inventory: form.is_digital ? null : Number(form.inventory),
        is_published: form.is_published,
      };
      let res;
      if (product?.id) {
        res = await supabase
          .from("merchandise")
          .update({ ...changes, updated_at: new Date().toISOString() })
          .eq("id", product.id);
      } else {
        res = await supabase.from("merchandise").insert([{ ...changes }]);
      }
      if (res.error) throw res.error;
      toast({ title: "Saved 👍", description: "Product saved.", variant: "default" });
      onProductSaved();
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{product ? "Edit Merchandise" : "Add Merchandise"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={saveMerchandise}>
            <Input
              placeholder="Product name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              placeholder="Short description"
              value={form.description || ""}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <Input
              type="number"
              min={0}
              placeholder="Price (USD)"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              required
            />
            <Input
              placeholder="Image URL"
              value={form.image_url || ""}
              onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
            />
            <div className="flex items-center gap-2 my-1">
              <Switch
                checked={!!form.is_digital}
                onCheckedChange={v => setForm(f => ({ ...f, is_digital: v }))}
                id="is_digital"
              />
              <label htmlFor="is_digital" className="text-sm">
                Digital product (download)?
              </label>
            </div>
            {form.is_digital ? (
              <Input
                placeholder="Download URL"
                value={form.digital_download_url || ""}
                onChange={e => setForm(f => ({ ...f, digital_download_url: e.target.value }))}
              />
            ) : (
              <Input
                type="number"
                min={0}
                placeholder="Inventory (stock)"
                value={form.inventory ?? 0}
                onChange={e => setForm(f => ({ ...f, inventory: e.target.value }))}
              />
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={!!form.is_published}
                onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))}
                id="is_published"
              />
              <label htmlFor="is_published" className="text-sm">Published?</label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {product ? "Update" : "Add"}
              </Button>
              <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatorMerchandiseModal;
