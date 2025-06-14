
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Content {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  media_url: string | null;
  is_premium: boolean;
  price: number | null;
  created_at: string;
}

interface ContentEditModalProps {
  open: boolean;
  onClose: () => void;
  content: Content;
  onContentUpdated: () => void;
}

const ContentEditModal = ({ open, onClose, content, onContentUpdated }: ContentEditModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (content) {
      setTitle(content.title);
      setDescription(content.description || '');
      setIsPremium(content.is_premium);
      setPrice(content.price?.toString() || '');
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (isPremium && (!price || parseFloat(price) <= 0)) {
      toast.error("Please enter a valid price for premium content");
      return;
    }

    setUpdating(true);

    try {
      const { error } = await supabase
        .from('content')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          is_premium: isPremium,
          price: isPremium ? parseFloat(price) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', content.id);

      if (error) throw error;

      toast.success("Content updated successfully!");
      onContentUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error("Failed to update content");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Content</DialogTitle>
          <DialogDescription>
            Update your content details and pricing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter content title"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your content..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-premium"
              checked={isPremium}
              onCheckedChange={setIsPremium}
            />
            <Label htmlFor="edit-premium">Premium Content</Label>
          </div>

          {isPremium && (
            <div>
              <Label htmlFor="edit-price">Price ($)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="9.99"
                required
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={updating} className="flex-1">
              {updating ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Content'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContentEditModal;
