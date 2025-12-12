import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User, Coins } from "lucide-react";
import Navbar from "@/components/Navbar";
import AvatarUpload from "@/components/AvatarUpload";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWallet } from "@/hooks/useWallet";
import WalletModal from "@/components/WalletModal";

interface Profile {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: 'creator' | 'subscriber' | 'admin';
  is_verified: boolean | null;
  subscription_price: number | null;
  chat_rate: number | null;
  subscription_price_coins: number | null;
  chat_rate_coins: number | null;
  created_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { balance, loading: walletLoading } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    role: 'subscriber' as 'creator' | 'subscriber' | 'admin',
    subscription_price_coins: '',
    chat_rate_coins: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive"
        });
        return;
      }

      setProfile(data);
      setEditForm({
        display_name: data.display_name || '',
        bio: data.bio || '',
        role: data.role,
        subscription_price_coins: data.subscription_price_coins?.toString() || '',
        chat_rate_coins: data.chat_rate_coins?.toString() || ''
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const updateData = {
        display_name: editForm.display_name || null,
        bio: editForm.bio || null,
        role: editForm.role,
        subscription_price_coins: editForm.subscription_price_coins ? parseInt(editForm.subscription_price_coins) : null,
        chat_rate_coins: editForm.chat_rate_coins ? parseInt(editForm.chat_rate_coins) : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive"
        });
        return;
      }

      await fetchProfile();
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (profile) {
      setProfile({ ...profile, avatar_url: newAvatarUrl });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to view your profile</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        {!isMobile && <Navbar onAuthClick={() => {}} />}
        <div className={`${isMobile ? 'px-4 py-4 pt-20' : 'container mx-auto px-4 py-16'}`}>
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        {!isMobile && <Navbar onAuthClick={() => {}} />}
        <div className={`${isMobile ? 'px-4 py-4 pt-20' : 'container mx-auto px-4 py-16'}`}>
          <Card>
            <CardHeader>
              <CardTitle>Profile Not Found</CardTitle>
              <CardDescription>Unable to load your profile information</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {!isMobile && <Navbar onAuthClick={() => {}} />}
      
      <div className={`${isMobile ? 'px-4 py-4 pt-20 pb-32' : 'container mx-auto px-4 py-16'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">My Profile</h1>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <User className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-6">
            {/* Profile Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-6">
                  {isEditing ? (
                    <AvatarUpload
                      currentAvatarUrl={profile.avatar_url}
                      userId={profile.id}
                      displayName={profile.display_name}
                      username={profile.username}
                      onAvatarUpdate={handleAvatarUpdate}
                    />
                  ) : (
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback className="text-2xl">
                        {profile.display_name?.[0] || profile.username[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold">
                        {profile.display_name || profile.username}
                      </h2>
                      {profile.is_verified && (
                        <Badge variant="secondary">Verified</Badge>
                      )}
                      <Badge variant={profile.role === 'creator' ? 'default' : 'outline'}>
                        {profile.role}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">@{profile.username}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Wallet Section */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  My Wallet
                </CardTitle>
                <CardDescription>Your coin balance for subscriptions and tips</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Coins className="w-6 h-6 text-yellow-500" />
                      <span className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                        {walletLoading ? "..." : balance}
                      </span>
                      <span className="text-muted-foreground">Coins</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowWalletModal(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    Buy Coins
                  </Button>
                </div>
              </CardContent>
            </Card>

            <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  {isEditing ? "Edit your profile details" : "Your profile details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="display_name">Display Name</Label>
                    {isEditing ? (
                      <Input
                        id="display_name"
                        value={editForm.display_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                        placeholder="Enter your display name"
                      />
                    ) : (
                      <p className="mt-1 text-sm">{profile.display_name || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    ) : (
                      <p className="mt-1 text-sm">{profile.bio || "No bio added yet"}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="role">Account Type</Label>
                    {isEditing ? (
                      <Select
                        value={editForm.role}
                        onValueChange={(value: 'creator' | 'subscriber' | 'admin') => 
                          setEditForm(prev => ({ ...prev, role: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subscriber">Subscriber</SelectItem>
                          <SelectItem value="creator">Creator</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1 text-sm capitalize">{profile.role}</p>
                    )}
                  </div>

                  {(profile.role === 'creator' || editForm.role === 'creator') && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Coins className="w-5 h-5 text-yellow-500" />
                          Creator Pricing (in Coins)
                        </h3>
                        
                        <div>
                          <Label htmlFor="subscription_price_coins" className="flex items-center gap-2">
                            Monthly Subscription Price
                            <Coins className="w-4 h-4 text-yellow-500" />
                          </Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            How many coins subscribers pay per month to access your content
                          </p>
                          {isEditing ? (
                            <Input
                              id="subscription_price_coins"
                              type="number"
                              step="1"
                              min="0"
                              value={editForm.subscription_price_coins}
                              onChange={(e) => setEditForm(prev => ({ ...prev, subscription_price_coins: e.target.value }))}
                              placeholder="e.g., 5"
                            />
                          ) : (
                            <div className="mt-1 flex items-center gap-1">
                              {profile.subscription_price_coins ? (
                                <>
                                  <Coins className="w-4 h-4 text-yellow-500" />
                                  <span className="font-medium">{profile.subscription_price_coins}</span>
                                  <span className="text-sm text-muted-foreground">coins/month</span>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">Not set</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="chat_rate_coins" className="flex items-center gap-2">
                            Hourly Chat Rate
                            <Coins className="w-4 h-4 text-yellow-500" />
                          </Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            How many coins users pay per hour for private chat sessions
                          </p>
                          {isEditing ? (
                            <Input
                              id="chat_rate_coins"
                              type="number"
                              step="1"
                              min="0"
                              value={editForm.chat_rate_coins}
                              onChange={(e) => setEditForm(prev => ({ ...prev, chat_rate_coins: e.target.value }))}
                              placeholder="e.g., 10"
                            />
                          ) : (
                            <div className="mt-1 flex items-center gap-1">
                              {profile.chat_rate_coins ? (
                                <>
                                  <Coins className="w-4 h-4 text-yellow-500" />
                                  <span className="font-medium">{profile.chat_rate_coins}</span>
                                  <span className="text-sm text-muted-foreground">coins/hour</span>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">Not set</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <Label>Username</Label>
                    <p className="mt-1 text-sm">@{profile.username}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="mt-1 text-sm">{profile.email}</p>
                  </div>
                  <div>
                    <Label>Member Since</Label>
                    <p className="mt-1 text-sm">
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <Label>Verification Status</Label>
                    <div className="mt-1">
                      <Badge variant={profile.is_verified ? "default" : "outline"}>
                        {profile.is_verified ? "Verified" : "Not Verified"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
