
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import Posts from "@/pages/Posts";
import Vibes from "@/pages/Vibes";
import Profile from "@/pages/Profile";
import Search from "@/pages/Search";
import Discover from "@/pages/Discover";
import Live from "@/pages/Live";
import Creator from "@/pages/Creator";
import CreatorProfile from "@/pages/CreatorProfile";
import PaidDM from "@/pages/PaidDM";
import Notifications from "@/pages/Notifications";
import NotificationSettings from "@/pages/NotificationSettings";
import PostView from "@/pages/PostView";
import TrailerView from "@/pages/TrailerView";
import Watch from "@/pages/Watch";
import StreamPaymentSuccess from "@/pages/StreamPaymentSuccess";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Index />} />
                  <Route path="posts" element={<Posts />} />
                  <Route path="vibes" element={<Vibes />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="search" element={<Search />} />
                  <Route path="discover" element={<Discover />} />
                  <Route path="live" element={<Live />} />
                  <Route path="creator" element={<Creator />} />
                  <Route path="creator/:creatorId" element={<CreatorProfile />} />
                  <Route path="dm" element={<PaidDM />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="notification-settings" element={<NotificationSettings />} />
                  <Route path="post/:postId" element={<PostView />} />
                  <Route path="trailer/:trailerId" element={<TrailerView />} />
                  <Route path="watch/:streamId" element={<Watch />} />
                  <Route path="stream-payment-success" element={<StreamPaymentSuccess />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
