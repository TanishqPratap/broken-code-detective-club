
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heart, User, Video, Search, Plus, MessageSquare, Home, Compass, Film, Bell, PlusSquare, Menu } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface NavbarProps {
  onAuthClick: () => void;
}

const Navbar = ({ onAuthClick }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/search", label: "Search", icon: Search },
    { path: "/discover", label: "Explore", icon: Compass },
    { path: "/posts", label: "Reels", icon: Film },
    { path: "/dm", label: "Messages", icon: MessageSquare },
    { path: "/notifications", label: "Notifications", icon: Bell },
    { path: "/creator", label: "Create", icon: PlusSquare },
    { path: "/live", label: "Live", icon: Video },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-40 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <Link to="/" className="flex items-center space-x-3">
          <Heart className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            CreatorHub
          </span>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="space-y-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={`${path}-${label}`} to={path}>
              <div
                className={`flex items-center space-x-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive(path)
                    ? "bg-gray-100 dark:bg-gray-800 font-semibold"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive(path) ? "text-primary" : ""}`} />
                <span className="text-base">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="space-y-4">
          <ThemeToggle />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt="User" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-base">Profile</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white dark:bg-gray-800" align="end" forceMount>
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
                <DropdownMenuItem onClick={signOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={onAuthClick} className="w-full">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
