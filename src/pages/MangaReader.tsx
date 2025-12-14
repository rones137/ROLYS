import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  ChevronLeft, ChevronRight, Image, ThumbsUp, Eye,
  Menu, X, ArrowLeft, Loader2, ZoomIn, ZoomOut
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MangaPage {
  id: string;
  imageUrl: string;
  order: number;
}

interface MangaChapter {
  id: string;
  title: string;
  pages: MangaPage[];
  order: number;
}

interface MangaData {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  chapters: MangaChapter[];
  author_id: string;
  upvote_count: number;
  view_count: number;
  author?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const MangaReader = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [manga, setManga] = useState<MangaData | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (id) {
      loadManga();
      incrementView();
    }
  }, [id]);

  useEffect(() => {
    if (user && manga) {
      checkUpvote();
    }
  }, [user, manga]);

  const loadManga = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('manga')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      const chapters = (data.chapters as unknown as MangaChapter[]) || [];
      
      const { data: authorData } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('user_id', data.author_id)
        .maybeSingle();

      setManga({
        ...data,
        chapters,
        author: authorData || undefined
      });
      setUpvoteCount(data.upvote_count || 0);
    }
    setLoading(false);
  };

  const incrementView = async () => {
    if (id) {
      await supabase.from('manga').update({ view_count: (manga?.view_count || 0) + 1 }).eq('id', id);
    }
  };

  const checkUpvote = async () => {
    if (!user || !id) return;
    const { data } = await supabase
      .from('upvotes')
      .select('id')
      .eq('user_id', user.id)
      .eq('media_type', 'user_manga')
      .maybeSingle();
    setHasUpvoted(!!data);
  };

  const handleUpvote = async () => {
    if (!user) {
      toast.error("Please sign in to upvote");
      return;
    }

    try {
      if (hasUpvoted) {
        await supabase.from('upvotes').delete().eq('user_id', user.id).eq('media_type', 'user_manga');
        setHasUpvoted(false);
        setUpvoteCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase.from('upvotes').insert({ user_id: user.id, media_id: 0, media_type: 'user_manga' });
        setHasUpvoted(true);
        setUpvoteCount(prev => prev + 1);
      }
    } catch (error) {
      toast.error("Failed to update upvote");
    }
  };

  const scrollToChapter = (index: number) => {
    setActiveChapter(index);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <Image className="w-24 h-24 text-muted-foreground mb-6" />
        <h2 className="text-3xl font-bold text-foreground mb-3">Manga Not Found</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          This manga doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const currentChapter = manga.chapters[activeChapter];

  return (
    <div className="flex h-[calc(100vh-80px)] animate-fade-in">
      {/* Sidebar */}
      <div className={cn(
        "fixed md:relative z-40 h-full bg-card border-r border-border transition-all duration-300",
        showSidebar ? "w-72 translate-x-0" : "w-0 -translate-x-full md:translate-x-0"
      )}>
        <div className="p-4 border-b border-border">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            {manga.cover_url && (
              <img src={manga.cover_url} alt={manga.title} className="w-16 h-20 object-cover rounded-lg" />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-foreground line-clamp-2">{manga.title}</h2>
              <button 
                onClick={() => navigate(`/user/${manga.author_id}`)}
                className="flex items-center gap-2 mt-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Avatar className="w-5 h-5">
                  <AvatarImage src={manga.author?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {(manga.author?.display_name || manga.author?.username)?.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <span>{manga.author?.display_name || manga.author?.username}</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button 
              size="sm" 
              variant={hasUpvoted ? "default" : "outline"}
              onClick={handleUpvote}
              className="flex-1 gap-1"
            >
              <ThumbsUp className={cn("w-4 h-4", hasUpvoted && "fill-current")} />
              {upvoteCount}
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <Eye className="w-4 h-4" />
              {manga.view_count || 0}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(50, zoom - 10))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground flex-1 text-center">{zoom}%</span>
            <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(200, zoom + 10))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-280px)] p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Chapters</h3>
          <div className="space-y-1">
            {manga.chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => scrollToChapter(index)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  activeChapter === index 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted text-foreground"
                )}
              >
                {chapter.title} ({chapter.pages?.length || 0} pages)
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Mobile toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 left-4 z-50 md:hidden shadow-lg"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        {showSidebar ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      {/* Main content - Vertical scroll reader */}
      <div className="flex-1 overflow-hidden bg-background/50">
        <ScrollArea ref={scrollRef} className="h-full">
          <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-foreground mb-4 px-4">{currentChapter?.title}</h1>
            
            {currentChapter?.pages?.length > 0 ? (
              <div className="space-y-2">
                {currentChapter.pages.map((page, index) => (
                  <div key={page.id} className="flex justify-center">
                    <img 
                      src={page.imageUrl} 
                      alt={`Page ${index + 1}`}
                      className="max-w-full transition-all"
                      style={{ width: `${zoom}%` }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Image className="w-16 h-16 mb-4 opacity-50" />
                <p>No pages in this chapter</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-12 px-4 pt-6 border-t border-border">
              <Button
                variant="outline"
                disabled={activeChapter === 0}
                onClick={() => scrollToChapter(activeChapter - 1)}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Chapter {activeChapter + 1} / {manga.chapters.length}
              </span>
              <Button
                variant="outline"
                disabled={activeChapter === manga.chapters.length - 1}
                onClick={() => scrollToChapter(activeChapter + 1)}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default MangaReader;