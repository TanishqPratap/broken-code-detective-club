
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
import ContentView from "@/pages/ContentView";
import Features from "@/pages/Features";
import Security from "@/pages/Security";
import HelpCenter from "@/pages/HelpCenter";
import Community from "@/pages/Community";
import Contact from "@/pages/Contact";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import CookiePolicy from "@/pages/CookiePolicy";
import DMCA from "@/pages/DMCA";
import Marketplace from "@/pages/Marketplace";

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
                  <Route path="posts/:postId" element={<PostView />} />
                  <Route path="vibes" element={<Vibes />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="search" element={<Search />} />
                  <Route path="discover" element={<Discover />} />
                  <Route path="live" element={<Live />} />
                  <Route path="creator" element={<Creator />} />
                  <Route path="creator/:creatorId" element={<CreatorProfile />} />
                  <Route path="dm" element={<PaidDM />} />
                  <Route path="marketplace" element={<Marketplace />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="notification-settings" element={<NotificationSettings />} />
                  <Route path="trailer/:trailerId" element={<TrailerView />} />
                  <Route path="watch/:streamId" element={<Watch />} />
                  <Route path="stream-payment-success" element={<StreamPaymentSuccess />} />
                  <Route path="content/:contentId" element={<ContentView />} />
                  <Route path="features" element={<Features />} />
                  <Route path="security" element={<Security />} />
                  <Route path="help-center" element={<HelpCenter />} />
                  <Route path="community" element={<Community />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="terms-of-service" element={<TermsOfService />} />
                  <Route path="cookie-policy" element={<CookiePolicy />} />
                  <Route path="dmca" element={<DMCA />} />
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
