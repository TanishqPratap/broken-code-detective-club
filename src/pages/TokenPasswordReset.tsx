import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const TokenPasswordReset = () => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendToken = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-reset-email', {
        body: {
          email: email.trim(),
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      toast({
        title: "Reset token sent!",
        description: "Check your email for the verification code."
      });
      setStep('reset');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset token",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim() || !token.trim() || !newPassword.trim()) {
      toast({
        title: "All fields required",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('verify-reset-token', {
        body: {
          email: email.trim(),
          token: token.trim(),
          newPassword
        }
      });

      if (error) throw error;

      toast({
        title: "Password reset successful!",
        description: "Your password has been updated. You can now sign in with your new password."
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => step === 'reset' ? setStep('request') : navigate('/')}
              className="p-1 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>
                {step === 'request' ? 'Reset Password' : 'Enter Reset Code'}
              </CardTitle>
              <CardDescription>
                {step === 'request' 
                  ? 'Enter your email to receive a reset code'
                  : 'Enter the code sent to your email and your new password'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'request' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="Enter your email address"
                />
              </div>
              <Button onClick={handleSendToken} disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send Reset Code"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setStep('reset')}
                className="w-full"
              >
                I already have a code
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input 
                  id="reset-email" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="Enter your email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Reset Code</Label>
                <Input 
                  id="token" 
                  type="text" 
                  value={token} 
                  onChange={e => setToken(e.target.value)} 
                  placeholder="Enter the 6-digit code"
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="Enter your new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm your new password"
                />
              </div>
              <Button onClick={handleResetPassword} disabled={loading} className="w-full">
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setStep('request')}
                className="w-full"
              >
                Request New Code
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenPasswordReset;