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
    console.log("[AuthProvider useEffect] Checking initial session...");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[AuthProvider useEffect] getSession result:", session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[AuthProvider onAuthStateChange]", event, session?.user?.id || "No session");
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      console.log("[signOut] Starting sign out process...");
      setUser(null);
      setSession(null);

      // Extra: try clearing browser storage directly (last resort; should not be needed)
      try {
        localStorage.removeItem("supabase.auth.token");
        sessionStorage.removeItem("supabase.auth.token");
        localStorage.removeItem("sb-access-token");
        localStorage.removeItem("sb-refresh-token");
      } catch (e) {
        console.log("[signOut] Error clearing storage:", e);
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error("[signOut] Supabase sign out error:", error);
        if (error.message.includes('Session not found')) {
          console.log("[signOut] Session was already invalid, proceeding with local cleanup");
        } else {
          console.warn("[signOut] Unusual sign out error:", error.message);
        }
      } else {
        console.log("[signOut] Successfully signed out from Supabase");
      }

      // Confirm current session after signout
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("[signOut] Session after signOut:", session);
      });

      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
        variant: "default"
      });

      console.log("[signOut] Navigating to home page...");
      window.location.href = '/';

    } catch (error) {
      console.error('[signOut] Unexpected sign out error:', error);
      setUser(null);
      setSession(null);
      toast({
        title: "Signed out",
        description: "You have been signed out.",
        variant: "default"
      });
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  // Add a log whenever user/session changes (for testing)
  useEffect(() => {
    console.log("[AuthProvider] user:", user, "session:", session, "loading:", loading);
  }, [user, session, loading]);

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
