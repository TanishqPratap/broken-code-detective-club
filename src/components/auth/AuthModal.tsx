import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Video, Upload } from "lucide-react";
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const AuthModal = ({
  isOpen,
  onClose
}: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [accountType, setAccountType] = useState<"creator" | "subscriber">("subscriber");
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }
      setProfilePicture(file);
    }
  };
  const handleSignUp = async () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username.",
        variant: "destructive"
      });
      return;
    }
    if (!displayName.trim()) {
      toast({
        title: "Display name required",
        description: "Please enter a display name.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
            display_name: displayName.trim(),
            role: accountType
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account."
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSignIn = async () => {
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully."
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Welcome to CreatorHub</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input id="signin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input id="signin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />
            </div>
            <Button onClick={handleSignIn} disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-4">
              <Label>Account Type</Label>
              <RadioGroup value={accountType} onValueChange={value => setAccountType(value as "creator" | "subscriber")} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50">
                  <RadioGroupItem value="subscriber" id="subscriber" />
                  <Label htmlFor="subscriber" className="flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Subscriber</div>
                      <div className="text-xs text-gray-500">Follow and support creators</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50">
                  <RadioGroupItem value="creator" id="creator" />
                  <Label htmlFor="creator" className="flex items-center gap-2 cursor-pointer">
                    <Video className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Creator</div>
                      <div className="text-xs text-gray-500">Share content and earn money</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-username">Username *</Label>
              <Input id="signup-username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-name">Display Name *</Label>
              <Input id="signup-name" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Enter your display name" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-profile-picture">Profile Picture (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input id="signup-profile-picture" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <Button type="button" variant="outline" onClick={() => document.getElementById('signup-profile-picture')?.click()} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  {profilePicture ? profilePicture.name : "Choose Profile Picture"}
                </Button>
              </div>
              {profilePicture && <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Selected: {profilePicture.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setProfilePicture(null)}>
                    Remove
                  </Button>
                </div>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email *</Label>
              <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password *</Label>
              <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
            </div>
            <Button onClick={handleSignUp} disabled={loading} className="w-full">
              {loading ? "Creating account..." : `Create ${accountType === "creator" ? "Creator" : "Subscriber"} Account`}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>;
};
export default AuthModal;