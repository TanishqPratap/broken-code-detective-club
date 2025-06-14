
import {
  BarChart3,
  Video,
  Users,
  Settings,
} from "lucide-react";
import { MessageSquare } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";

interface CreatorSidebarProps {
  active: string;
  onSelect: (section: string) => void;
}

const items = [
  { key: "overview", icon: BarChart3, title: "Overview" },
  { key: "livestream", icon: Video, title: "Live Stream" },
  { key: "content", icon: Users, title: "Content" },
  { key: "settings", icon: Settings, title: "Settings" },
];

const CreatorSidebar = ({ active, onSelect }: CreatorSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Add a Paid DMs menu item that navigates to "/dm"
  const dmItem = {
    key: "paiddm",
    icon: MessageSquare,
    title: "Paid DMs",
    onClick: () => navigate("/dm"),
    isActive: location.pathname.startsWith("/dm"),
  };

  return (
    <Sidebar className="min-h-screen bg-white">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Creator Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={active === item.key}
                    onClick={() => onSelect(item.key)}
                  >
                    <button type="button" className="w-full flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Paid DM navigation */}
              <SidebarMenuItem key={dmItem.key}>
                <SidebarMenuButton
                  asChild
                  isActive={dmItem.isActive}
                  onClick={dmItem.onClick}
                >
                  <button type="button" className="w-full flex items-center gap-2">
                    <dmItem.icon className="w-4 h-4" />
                    <span>{dmItem.title}</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default CreatorSidebar;
