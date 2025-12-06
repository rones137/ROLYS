import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { SideNav } from "./components/layout/SideNav";
import { TopHeader } from "./components/layout/TopHeader";
import { useTheme } from "./hooks/useTheme";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import MyList from "./pages/MyList";
import Lookup from "./pages/Lookup";
import Rankings from "./pages/Rankings";
import Trending from "./pages/Trending";
import Upcoming from "./pages/Upcoming";
import Search from "./pages/Search";
import Community from "./pages/Community";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import AnimeDetail from "./pages/AnimeDetail";
import NovelEditor from "./pages/NovelEditor";
import MangaEditor from "./pages/MangaEditor";
import Votes from "./pages/Votes";
import Barint from "./pages/Barint";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const AppLayout = () => {
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <SideNav isOpen={sideNavOpen} onClose={() => setSideNavOpen(false)} />
      
      <div className="min-h-screen">
        <TopHeader onMenuClick={() => setSideNavOpen(!sideNavOpen)} />
        
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
            <Route path="/community" element={<Community />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Placeholder title="Help & Support" description="Get help and support" />} />
            <Route path="/anime/:id" element={<AnimeDetail />} />
            <Route path="/novel-editor" element={<NovelEditor />} />
            <Route path="/manga-editor" element={<MangaEditor />} />
            <Route path="/votes" element={<Votes />} />
            <Route path="/barint" element={<Barint />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
