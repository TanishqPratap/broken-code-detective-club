import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"
import Home from "@/pages/Home";
import Creator from "@/pages/Creator";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LivepeerProvider } from "@livepeer.studio/react";
import Profile from "./pages/Profile";
import Post from "./pages/Post";
import Watch from "./pages/Watch";
import Shop from "@/pages/Shop";

const queryClient = new QueryClient();

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <LivepeerProvider>
            <div className="min-h-screen">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/creator" element={<Creator />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/post/:id" element={<Post />} />
                <Route path="/watch/:id" element={<Watch />} />
                <Route path="/shop" element={<Shop />} />
              </Routes>
            </div>
          </LivepeerProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
