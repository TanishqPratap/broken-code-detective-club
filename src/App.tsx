
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PaidDM from "@/pages/PaidDM";
import Watch from "@/pages/Watch";
import LivepeerProvider from "@/components/LivepeerProvider";
import { StreamVideoProvider } from "@/components/StreamVideoProvider";
import { AuthProvider } from "@/hooks/useAuth";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <LivepeerProvider>
            <StreamVideoProvider>
              <div className="min-h-screen bg-background font-sans antialiased">
                <Navbar onAuthClick={() => {}} />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<div>Home Page</div>} />
                    <Route path="/watch/:assetId" element={<Watch />} />
                    <Route path="/paiddm" element={<PaidDM />} />
                  </Routes>
                </main>
                <Toaster />
              </div>
            </StreamVideoProvider>
          </LivepeerProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
