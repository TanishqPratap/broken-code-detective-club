
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Menu, 
  Home, 
  Search, 
  Compass, 
  ShoppingBag, 
  Radio, 
  User, 
  Bell,
  LogOut,
  LogIn
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";

const MobileNavbar = () => {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/discover", icon: Compass, label: "Discover" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
    { to: "/live", icon: Radio, label: "Live" },
  ];

  return (
    <>
      <div className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <Link to="/" className="font-bold">
          CreatorHub
        </Link>
        
        <div className="flex items-center space-x-2">
          {user && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/notifications">
                <Bell className="h-4 w-4" />
              </Link>
            </Button>
          )}
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 flex flex-col space-y-2">
                {navItems.map((item) => (
                  <Button
                    key={item.to}
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to={item.to}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                ))}
                
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      asChild
                      onClick={() => setIsOpen(false)}
                    >
                      <Link to="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className="justify-start"
                      asChild
                      onClick={() => setIsOpen(false)}
                    >
                      <Link to="/creator">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className="justify-start text-red-600 hover:text-red-700"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      setIsOpen(false);
                      setShowAuthModal(true);
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default MobileNavbar;
