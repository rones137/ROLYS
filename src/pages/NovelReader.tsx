import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  ChevronLeft, ChevronRight, BookOpen, ThumbsUp, Eye, Share2,
  Menu, X, User, ArrowLeft, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface NovelData {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  chapters: Chapter[];
  author_id: string;
  upvote_count: number;
  view_count: number;
  author?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const NovelReader = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [novel, setNovel] = useState<NovelData | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);

  useEffect(() => {
    if (id) {
      loadNovel();
      incrementView();
    }
  }, [id]);

  useEffect(() => {
    if (user && novel) {
      checkUpvote();
    }
  }, [user, novel]);

  const loadNovel = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('novels')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      const chapters = (data.chapters as unknown as Chapter[]) || [];
      
      // Load author separately
      const { data: authorData } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('user_id', data.author_id)
        .maybeSingle();

      setNovel({
        ...data,
        chapters,
        author: authorData || undefined
      });
      setUpvoteCount(data.upvote_count || 0);
    }
    setLoading(false);
  };

  const incrementView = async () => {
    // Simple increment - we'll skip RPC for now
    if (id) {
      await supabase.from('novels').update({ view_count: (novel?.view_count || 0) + 1 }).eq('id', id);
    }
  };

  const checkUpvote = async () => {
    if (!user || !id) return;
    const { data } = await supabase
      .from('upvotes')
      .select('id')
      .eq('user_id', user.id)
      .eq('media_type', 'user_novel')
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
        await supabase
          .from('upvotes')
          .delete()
          .eq('user_id', user.id)
          .eq('media_type', 'user_novel');
        setHasUpvoted(false);
        setUpvoteCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase.from('upvotes').insert({
          user_id: user.id,
          media_id: 0,
          media_type: 'user_novel'
        });
        setHasUpvoted(true);
        setUpvoteCount(prev => prev + 1);
      }
    } catch (error) {
      toast.error("Failed to update upvote");
    }
  };

  const scrollToChapter = (index: number) => {
    setActiveChapter(index);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <BookOpen className="w-24 h-24 text-muted-foreground mb-6" />
        <h2 className="text-3xl font-bold text-foreground mb-3">Novel Not Found</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          This novel doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const currentChapter = novel.chapters[activeChapter];

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
            {novel.cover_url && (
              <img src={novel.cover_url} alt={novel.title} className="w-16 h-20 object-cover rounded-lg" />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-foreground line-clamp-2">{novel.title}</h2>
              <button 
                onClick={() => navigate(`/user/${novel.author_id}`)}
                className="flex items-center gap-2 mt-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Avatar className="w-5 h-5">
                  <AvatarImage src={novel.author?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {(novel.author?.display_name || novel.author?.username)?.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <span>{novel.author?.display_name || novel.author?.username}</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
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
              {novel.view_count || 0}
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-200px)] p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Chapters</h3>
          <div className="space-y-1">
            {novel.chapters.map((chapter, index) => (
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
                {chapter.title}
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

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={contentRef} className="h-full">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{currentChapter?.title}</h1>
            <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground">
              <span>Chapter {activeChapter + 1} of {novel.chapters.length}</span>
            </div>

            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: currentChapter?.content || '<p>No content yet.</p>' }}
            />

            {/* Navigation */}
            <div className="flex justify-between items-center mt-12 pt-6 border-t border-border">
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
                {activeChapter + 1} / {novel.chapters.length}
              </span>
              <Button
                variant="outline"
                disabled={activeChapter === novel.chapters.length - 1}
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

export default NovelReader;