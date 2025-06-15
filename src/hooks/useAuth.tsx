
import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id || 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // If the event is SIGNED_OUT, ensure we're on the home page
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, redirecting to home...');
          // Clear any cached data
          setSession(null);
          setUser(null);
          setTimeout(() => {
            if (window.location.pathname !== '/') {
              window.location.href = '/';
            }
          }, 100);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('Starting sign out process...');
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      
      // Always attempt to sign out from Supabase with proper scope
      console.log('Attempting to sign out from Supabase...');
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Supabase sign out error:', error);
        // Even if there's an error, we've cleared local state
        if (error.message.includes('Session not found')) {
          console.log('Session was already invalid, proceeding with local cleanup');
        } else {
          // For other errors, still proceed but log them
          console.warn('Sign out error, but proceeding with local cleanup:', error.message);
        }
      } else {
        console.log('Successfully signed out from Supabase');
      }
      
      // Clear any remaining session data
      await supabase.auth.getSession().then(() => {
        console.log('Session cleared');
      });
      
      // Always show success message
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
        variant: "default"
      });

      // Force navigation to home page
      console.log('Navigating to home page...');
      setTimeout(() => {
        window.location.href = '/';
      }, 200);
      
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      
      // Even on unexpected errors, clear state and redirect
      setUser(null);
      setSession(null);
      
      toast({
        title: "Signed out",
        description: "You have been signed out.",
        variant: "default"
      });
      
      // Force navigation
      setTimeout(() => {
        window.location.href = '/';
      }, 200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
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
