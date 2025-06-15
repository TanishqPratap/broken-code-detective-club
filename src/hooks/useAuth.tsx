
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

  // Only set up listener once
  useEffect(() => {
    console.log("[AuthProvider] Initializing AuthProvider and listeners...");

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AuthProvider onAuthStateChange]", event, session?.user?.id || "No session");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // For debug: fire on sign out
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        toast({
          title: "Signed out successfully",
          description: "You have been signed out.",
          variant: "default"
        });
      }
    });

    // Initial session fetch (fires INITIAL_SESSION event above)
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[AuthProvider useEffect] getSession result:", session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signOut = async () => {
    console.log("[AuthProvider signOut] Sign out requested");

    setLoading(true);
    try {
      // Remove local auth state immediately
      setUser(null);
      setSession(null);

      // Extra: try clearing browser storage (optional)
      try {
        localStorage.removeItem("supabase.auth.token");
        sessionStorage.removeItem("supabase.auth.token");
        localStorage.removeItem("sb-access-token");
        localStorage.removeItem("sb-refresh-token");
      } catch (e) {
        console.log("[signOut] Error clearing storage:", e);
      }

      // Call Supabase sign out (do not reload)
      const { error } = await supabase.auth.signOut({ scope: "global" });

      if (error) {
        console.error("[signOut] Supabase sign out error:", error);
      } else {
        console.log("[signOut] Signed out from Supabase");
      }
      
      // Do NOT reload page: let Provider update state, UI should react automatically
      // Optionally, a route navigation can be handled by your app's layout component if (!user) return <Navigate ... />

    } catch (err) {
      console.error("[signOut] Unexpected error:", err);
      setUser(null);
      setSession(null);
      toast({
        title: "Signed out",
        description: "You have been signed out.",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  // Log on every change (debug)
  useEffect(() => {
    console.log("[AuthProvider] Current state -> user:", user, "session:", session, "loading:", loading);
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
