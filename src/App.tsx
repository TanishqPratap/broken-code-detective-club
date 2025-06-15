
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "@/pages/Index";
import Creator from "@/pages/Creator";
import Profile from "@/pages/Profile";
import Search from "@/pages/Search";
import Posts from "@/pages/Posts";
import PostView from "@/pages/PostView";
import ContentView from "@/pages/ContentView";
import TrailerView from "@/pages/TrailerView";
import CreatorProfile from "@/pages/CreatorProfile";
import Discover from "@/pages/Discover";
import Live from "@/pages/Live";
import Watch from "@/pages/Watch";
import Vibes from "@/pages/Vibes";
import Notifications from "@/pages/Notifications";
import NotificationSettings from "@/pages/NotificationSettings";
import PaidDM from "@/pages/PaidDM";
import StreamPaymentSuccess from "@/pages/StreamPaymentSuccess";
import NotFound from "@/pages/NotFound";
import MobileLayout from "@/components/MobileLayout";
import Layout from "@/components/Layout";
import LivepeerProvider from "@/components/LivepeerProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import "./App.css";

const queryClient = new QueryClient();

function AppContent() {
  const isMobile = useIsMobile();

  return (
    <Router>
      <Routes>
        {isMobile ? (
          <Route path="/" element={<MobileLayout />}>
            <Route index element={<Index />} />
            <Route path="creator" element={<Creator />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:username" element={<CreatorProfile />} />
            <Route path="search" element={<Search />} />
            <Route path="posts" element={<Posts />} />
            <Route path="post/:id" element={<PostView />} />
            <Route path="content/:id" element={<ContentView />} />
            <Route path="trailer/:id" element={<TrailerView />} />
            <Route path="discover" element={<Discover />} />
            <Route path="live" element={<Live />} />
            <Route path="watch/:playbackId" element={<Watch />} />
            <Route path="vibes" element={<Vibes />} />
            <Route path="vibes/:id" element={<PostView />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="notification-settings" element={<NotificationSettings />} />
            <Route path="dm" element={<PaidDM />} />
            <Route path="dm/:sessionId" element={<PaidDM />} />
            <Route path="payment-success" element={<StreamPaymentSuccess />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="creator" element={<Creator />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:username" element={<CreatorProfile />} />
            <Route path="search" element={<Search />} />
            <Route path="posts" element={<Posts />} />
            <Route path="post/:id" element={<PostView />} />
            <Route path="content/:id" element={<ContentView />} />
            <Route path="trailer/:id" element={<TrailerView />} />
            <Route path="discover" element={<Discover />} />
            <Route path="live" element={<Live />} />
            <Route path="watch/:playbackId" element={<Watch />} />
            <Route path="vibes" element={<Vibes />} />
            <Route path="vibes/:id" element={<PostView />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="notification-settings" element={<NotificationSettings />} />
            <Route path="dm" element={<PaidDM />} />
            <Route path="dm/:sessionId" element={<PaidDM />} />
            <Route path="payment-success" element={<StreamPaymentSuccess />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <LivepeerProvider>
            <AppContent />
            <Toaster />
          </LivepeerProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
