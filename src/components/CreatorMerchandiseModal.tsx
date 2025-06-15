
import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image } from "lucide-react";

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
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens or product changes
  React.useEffect(() => {
    setForm(product || defaultForm);
  }, [open, product]);

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${creatorId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('post-media')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

      setForm(f => ({ ...f, image_url: publicUrl }));
      toast({ title: "Success", description: "Image uploaded successfully!" });
    } catch (error: any) {
      toast({ 
        title: "Upload Error", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

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
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
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
            
            {/* Image upload section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Image</label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Upload className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Image className="w-4 h-4" />
                      Upload Image
                    </>
                  )}
                </Button>
                {form.image_url && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                  >
                    Remove
                  </Button>
                )}
              </div>
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Product preview"
                  className="w-full h-32 object-cover rounded border"
                />
              )}
            </div>
            
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
              <Button type="submit" className="flex-1" disabled={loading || uploading}>
                {product ? "Update" : "Add"}
              </Button>
              <Button variant="outline" type="button" onClick={onClose} disabled={loading || uploading}>
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
