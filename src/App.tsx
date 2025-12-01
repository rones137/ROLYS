import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { SideNav } from "./components/layout/SideNav";
import { TopHeader } from "./components/layout/TopHeader";
import Index from "./pages/Index";
import MyList from "./pages/MyList";
import Lookup from "./pages/Lookup";
import Rankings from "./pages/Rankings";
import Trending from "./pages/Trending";
import Upcoming from "./pages/Upcoming";
import Search from "./pages/Search";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => {
  const [sideNavOpen, setSideNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SideNav isOpen={sideNavOpen} onClose={() => setSideNavOpen(false)} />
      
      <div className="md:ml-72 min-h-screen">
        <TopHeader onMenuClick={() => setSideNavOpen(true)} />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/my-list" element={<MyList />} />
            <Route path="/lookup" element={<Lookup />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/upcoming" element={<Upcoming />} />
            <Route path="/search" element={<Search />} />
            <Route path="/news" element={<Placeholder title="News Feed" description="Latest anime news and updates coming soon" />} />
            <Route path="/community" element={<Placeholder title="Community Hub" description="Connect with other anime fans" />} />
            <Route path="/settings" element={<Placeholder title="Settings" description="Customize your experience" />} />
            <Route path="/help" element={<Placeholder title="Help & Support" description="Get help and support" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
