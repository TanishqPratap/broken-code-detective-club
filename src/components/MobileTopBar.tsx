
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, User, Video, Menu } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface MobileTopBarProps {
  onAuthClick: () => void;
}

const MobileTopBar = ({ onAuthClick }: MobileTopBarProps) => {
  const { user, signOut } = useAuth();

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 flex items-center justify-between px-4">
      <Link to="/" className="flex items-center space-x-2">
        <Heart className="w-6 h-6 text-brand-blue" />
        <span className="text-xl font-bold bg-gradient-to-r from-brand-navy to-brand-blue bg-clip-text text-sky-600">
          CreatorHub
        </span>
      </Link>
      
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white dark:bg-gray-800" align="end">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/creator" className="flex items-center">
                  <Video className="mr-2 h-4 w-4" />
                  <span>Creator Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/discover" className="flex items-center">
                  <span>Discover</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/live" className="flex items-center">
                  <span>Live Streams</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/vibes" className="flex items-center">
                  <span>Vibes</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dm" className="flex items-center">
                  <span>Messages</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={onAuthClick} size="sm">
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
};

export default MobileTopBar;
