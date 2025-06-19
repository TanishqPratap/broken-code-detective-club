
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Package, Edit, Trash2, DollarSign, TrendingUp } from "lucide-react";
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
  is_published: boolean;
  created_at: string;
}

interface SalesData {
  totalSales: number;
  totalRevenue: number;
  recentOrders: any[];
}

const MerchandiseManagement = () => {
  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalRevenue: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Merchandise | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_digital: false,
    inventory: '',
    is_published: false
  });

  useEffect(() => {
    if (user) {
      fetchMerchandise();
      fetchSalesData();
    }
  }, [user]);

  const fetchMerchandise = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('merchandise')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMerchandise(data || []);
    } catch (error) {
      console.error('Error fetching merchandise:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesData = async () => {
    if (!user) return;

    try {
      // Get orders for creator's merchandise
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          merchandise:merchandise_id (
            name,
            creator_id
          )
        `)
        .in('merchandise_id', 
          await supabase
            .from('merchandise')
            .select('id')
            .eq('creator_id', user.id)
            .then(({ data }) => data?.map(item => item.id) || [])
        )
        .eq('status', 'completed');

      if (error) throw error;

      const totalSales = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.price), 0) || 0;

      setSalesData({
        totalSales,
        totalRevenue,
        recentOrders: orders?.slice(0, 5) || []
      });
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const data = {
        creator_id: user.id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: formData.image_url || null,
        is_digital: formData.is_digital,
        inventory: parseInt(formData.inventory),
        is_published: formData.is_published
      };

      if (editingItem) {
        const { error } = await supabase
          .from('merchandise')
          .update(data)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        toast({
          title: "Merchandise Updated",
          description: "Your merchandise has been updated successfully!",
        });
      } else {
        const { error } = await supabase
          .from('merchandise')
          .insert(data);
        
        if (error) throw error;
        
        toast({
          title: "Merchandise Added",
          description: "Your merchandise has been added successfully!",
        });
      }

      resetForm();
      fetchMerchandise();
    } catch (error: any) {
      console.error('Error saving merchandise:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save merchandise",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: Merchandise) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      image_url: item.image_url || '',
      is_digital: item.is_digital,
      inventory: item.inventory.toString(),
      is_published: item.is_published
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('merchandise')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Merchandise Deleted",
        description: "Your merchandise has been deleted successfully!",
      });

      fetchMerchandise();
    } catch (error: any) {
      console.error('Error deleting merchandise:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete merchandise",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      is_digital: false,
      inventory: '',
      is_published: false
    });
    setEditingItem(null);
    setShowAddModal(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Merchandise Management</h2>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Merchandise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Merchandise' : 'Add New Merchandise'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="inventory">Inventory</Label>
                <Input
                  id="inventory"
                  type="number"
                  value={formData.inventory}
                  onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_digital"
                  checked={formData.is_digital}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_digital: checked })}
                />
                <Label htmlFor="is_digital">Digital Product</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">Published</Label>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingItem ? 'Update' : 'Add'} Merchandise
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sales Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Orders completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesData.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From merchandise sales
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {merchandise.filter(item => item.is_published).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Published merchandise
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Merchandise List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {merchandise.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <div className="flex gap-2">
                  {item.is_published ? (
                    <Badge variant="default">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                  {item.is_digital && <Badge variant="outline">Digital</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {item.description}
              </p>
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">${item.price}</span>
                <span className="text-sm text-muted-foreground">
                  {item.inventory} in stock
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {merchandise.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No merchandise yet</h3>
          <p className="text-gray-600 mb-4">Start selling by adding your first merchandise item!</p>
          <Button onClick={() => setShowAddModal(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Your First Item
          </Button>
        </div>
      )}
    </div>
  );
};

export default MerchandiseManagement;
