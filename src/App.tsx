import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Pricing from "@/pages/Pricing";
import Dashboard from "@/pages/Dashboard";
import AccountSettings from "@/pages/AccountSettings";
import Mint from "@/pages/Mint";
import Library from "@/pages/Library";
import Watch from "@/pages/Watch";
import PaidDM from "@/pages/PaidDM";
import { LivepeerProvider } from "@/components/Livepeer";
import { StreamVideoProvider } from "@/components/StreamVideoProvider";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LivepeerProvider>
          <StreamVideoProvider>
            <div className="min-h-screen bg-background font-sans antialiased">
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/account" element={<AccountSettings />} />
                  <Route path="/mint" element={<Mint />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/watch/:assetId" element={<Watch />} />
                  <Route path="/paiddm" element={<PaidDM />} />
                </Routes>
              </main>
              <Toaster />
            </div>
          </StreamVideoProvider>
        </LivepeerProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
