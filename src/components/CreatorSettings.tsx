
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, User, DollarSign, Settings as SettingsIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  subscription_price: number | null;
  chat_rate: number | null;
  is_verified: boolean;
}

const CreatorSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: '',
    bio: '',
    subscription_price: null,
    chat_rate: null,
    is_verified: false
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, bio, subscription_price, chat_rate, is_verified')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData({
          display_name: data.display_name || '',
          bio: data.bio || '',
          subscription_price: data.subscription_price,
          chat_rate: data.chat_rate,
          is_verified: data.is_verified || false
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.display_name?.trim() || null,
          bio: profileData.bio?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePricing = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_price: profileData.subscription_price,
          chat_rate: profileData.chat_rate,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Pricing updated successfully!");
    } catch (error) {
      console.error('Error updating pricing:', error);
      toast.error("Failed to update pricing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Creator Settings</h1>
          <p className="text-muted-foreground">Manage your creator profile and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <DollarSign className="w-4 h-4 mr-2" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your public profile information that subscribers will see
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={profileData.display_name || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Your display name"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell your subscribers about yourself..."
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="verified"
                  checked={profileData.is_verified}
                  disabled={true}
                />
                <Label htmlFor="verified" className="text-sm text-muted-foreground">
                  Verified Creator {profileData.is_verified ? '(Verified)' : '(Contact support for verification)'}
                </Label>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Settings</CardTitle>
              <CardDescription>
                Configure your subscription and chat pricing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="subscription-price">Monthly Subscription Price ($)</Label>
                <Input
                  id="subscription-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={profileData.subscription_price || ''}
                  onChange={(e) => setProfileData(prev => ({ 
                    ...prev, 
                    subscription_price: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                  placeholder="9.99"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Set your monthly subscription price for premium content access
                </p>
              </div>

              <div>
                <Label htmlFor="chat-rate">Paid DM Rate ($ per hour)</Label>
                <Input
                  id="chat-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={profileData.chat_rate || ''}
                  onChange={(e) => setProfileData(prev => ({ 
                    ...prev, 
                    chat_rate: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                  placeholder="20.00"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Set your hourly rate for paid direct messages
                </p>
              </div>

              <Button onClick={handleSavePricing} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Pricing
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Account Preferences</CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for new subscribers and messages
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Auto-reply to DMs</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically send a welcome message to new DM conversations
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Make your profile discoverable in the creator directory
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  Export Account Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreatorSettings;
