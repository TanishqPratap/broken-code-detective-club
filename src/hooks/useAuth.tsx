
import { useState, useEffect, createContext, useContext } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('Starting sign out process...');
      
      // Clear local state first
      setUser(null);
      
      // Check if we have a current session before trying to sign out
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Session found, signing out from Supabase...');
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Supabase sign out error:', error);
          // Don't show error for "session not found" as user is already signed out
          if (!error.message.includes('Session not found')) {
            toast({
              title: "Sign out error",
              description: "There was an issue signing out, but you've been logged out locally.",
              variant: "destructive"
            });
          }
        }
      } else {
        console.log('No session found, user already signed out');
      }
      
      // Always show success message and redirect
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
        variant: "default"
      });

      // Navigate to home page
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
      
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      
      // Still clear local state and redirect even on error
      setUser(null);
      
      toast({
        title: "Signed out",
        description: "You have been signed out.",
        variant: "default"
      });
      
      // Navigate to home page
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
