
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Creator from "./pages/Creator";
import CreatorProfile from "./pages/CreatorProfile";
import Discover from "./pages/Discover";
import Watch from "./pages/Watch";
import Posts from "./pages/Posts";
import PostView from "./pages/PostView";
import TrailerView from "./pages/TrailerView";
import NotFound from "./pages/NotFound";
import StreamPaymentSuccess from "./pages/StreamPaymentSuccess";
import PaidDM from "./pages/PaidDM";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/creator" element={<Creator />} />
            <Route path="/creator/:creatorId" element={<CreatorProfile />} />
            <Route path="/creator/:creatorId/trailer/:trailerId" element={<TrailerView />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/posts/:postId" element={<PostView />} />
            <Route path="/watch/:streamId" element={<Watch />} />
            <Route path="/dm" element={<PaidDM />} />
            <Route path="/stream-payment-success" element={<StreamPaymentSuccess />} />
            {/* Handle legacy routes */}
            <Route path="/creators/:creatorId" element={<Navigate to="/creator/:creatorId" replace />} />
            <Route path="/user/:userId" element={<Navigate to="/creator/:userId" replace />} />
            {/* Catch all 404s */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
