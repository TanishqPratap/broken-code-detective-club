
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Upload, 
  BarChart3, 
  Settings, 
  Users, 
  DollarSign,
  Radio,
  Package,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const CreatorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/creator",
    },
    {
      icon: Upload,
      label: "Content",
      href: "/creator/content",
    },
    {
      icon: Radio,
      label: "Live Stream",
      href: "/creator/stream",
    },
    {
      icon: Package,
      label: "Merchandise",
      href: "/creator/merchandise",
    },
    {
      icon: Users,
      label: "Subscribers",
      href: "/creator/subscribers",
    },
    {
      icon: BarChart3,
      label: "Analytics",
      href: "/creator/analytics",
    },
    {
      icon: DollarSign,
      label: "Earnings",
      href: "/creator/earnings",
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/creator/settings",
    },
  ];

  return (
    <div className="hidden h-screen w-64 flex-col border-r bg-background lg:flex">
      <div className="flex h-14 items-center border-b px-6">
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-bold">Creator Studio</span>
        </Link>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default CreatorSidebar;
