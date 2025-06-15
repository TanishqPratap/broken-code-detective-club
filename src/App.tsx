
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import Index from "@/pages/Index";
import Profile from "@/pages/Profile";
import CreatorProfile from "@/pages/CreatorProfile";
import Creator from "@/pages/Creator";
import Search from "@/pages/Search";
import Discover from "@/pages/Discover";
import Vibes from "@/pages/Vibes";
import Live from "@/pages/Live";
import Watch from "@/pages/Watch";
import PaidDM from "@/pages/PaidDM";
import Notifications from "@/pages/Notifications";
import NotificationSettings from "@/pages/NotificationSettings";
import PostView from "@/pages/PostView";
import Posts from "@/pages/Posts";
import ContentView from "@/pages/ContentView";
import TrailerView from "@/pages/TrailerView";
import StreamPaymentSuccess from "@/pages/StreamPaymentSuccess";
import NotFound from "@/pages/NotFound";
import Layout from "@/components/Layout";
import MobileLayout from "@/components/MobileLayout";
import RouteGuard from "@/components/RouteGuard";
import { useIsMobile } from "@/hooks/use-mobile";

const AppContent = () => {
  const { loading } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const LayoutComponent = isMobile ? MobileLayout : Layout;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LayoutComponent />}>
          <Route index element={<Index />} />
          <Route path="profile" element={<RouteGuard><Profile /></RouteGuard>} />
          <Route path="profile/:username" element={<CreatorProfile />} />
          <Route path="creator" element={<RouteGuard><Creator /></RouteGuard>} />
          <Route path="search" element={<Search />} />
          <Route path="discover" element={<Discover />} />
          <Route path="vibes" element={<Vibes />} />
          <Route path="vibes/:id" element={<PostView />} />
          <Route path="live" element={<Live />} />
          <Route path="watch/:streamId" element={<Watch />} />
          <Route path="dm" element={<RouteGuard><PaidDM /></RouteGuard>} />
          <Route path="notifications" element={<RouteGuard><Notifications /></RouteGuard>} />
          <Route path="notification-settings" element={<RouteGuard><NotificationSettings /></RouteGuard>} />
          <Route path="post/:id" element={<PostView />} />
          <Route path="posts" element={<Posts />} />
          <Route path="content/:id" element={<ContentView />} />
          <Route path="trailer/:id" element={<TrailerView />} />
          <Route path="stream-payment-success" element={<RouteGuard><StreamPaymentSuccess /></RouteGuard>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
