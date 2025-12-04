import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getTrendingAnime, searchAnimeAniList, convertToAnimeData } from "@/lib/anilist";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bot, Send, Sparkles, Search, TrendingUp, Users, BookOpen, Tv, Star, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: any[];
  timestamp: Date;
}

const SUGGESTION_PROMPTS = [
  { icon: TrendingUp, text: "What's trending this season?", action: "trending" },
  { icon: Star, text: "Recommend anime like Attack on Titan", action: "similar" },
  { icon: Users, text: "Best anime communities to join", action: "communities" },
  { icon: BookOpen, text: "Top rated manga adaptations", action: "manga" },
];

const Barint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey there! 👋 I'm Barint, your anime assistant. I can help you discover new anime, find communities, and get personalized recommendations. What would you like to explore today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Simple keyword-based responses for now
      let response: Message;
      const lowerText = messageText.toLowerCase();

      if (lowerText.includes("trending") || lowerText.includes("popular") || lowerText.includes("this season")) {
        const data = await getTrendingAnime(1, 6);
        response = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Here are the hottest anime trending right now! 🔥",
          recommendations: data.media.map((a: any) => convertToAnimeData(a)),
          timestamp: new Date(),
        };
      } else if (lowerText.includes("recommend") || lowerText.includes("like") || lowerText.includes("similar")) {
        // Extract anime name from the query
        const match = lowerText.match(/(?:like|similar to)\s+(.+?)(?:\?|$)/i);
        if (match) {
          const searchResult = await searchAnimeAniList(match[1], 1, 6);
          response = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Based on your interest, here are some anime you might enjoy:`,
            recommendations: searchResult.media.map((a: any) => convertToAnimeData(a)),
            timestamp: new Date(),
          };
        } else {
          const data = await getTrendingAnime(1, 6);
          response = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Here are some top recommendations for you!",
            recommendations: data.media.map((a: any) => convertToAnimeData(a)),
            timestamp: new Date(),
          };
        }
      } else if (lowerText.includes("community") || lowerText.includes("communities")) {
        response = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "You can explore communities in the Community section! There you'll find groups for different anime genres, discussions, and fan content. Would you like me to take you there?",
          timestamp: new Date(),
        };
      } else if (lowerText.includes("manga")) {
        const searchResult = await searchAnimeAniList("manga adaptation", 1, 6);
        response = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Here are some popular manga adaptations:",
          recommendations: searchResult.media.map((a: any) => convertToAnimeData(a)),
          timestamp: new Date(),
        };
      } else if (lowerText.includes("search") || lowerText.includes("find")) {
        const query = messageText.replace(/search|find|for|me|please/gi, "").trim();
        if (query) {
          const searchResult = await searchAnimeAniList(query, 1, 6);
          response = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Here's what I found for "${query}":`,
            recommendations: searchResult.media.map((a: any) => convertToAnimeData(a)),
            timestamp: new Date(),
          };
        } else {
          response = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "What would you like me to search for? Just tell me the anime name or genre!",
            timestamp: new Date(),
          };
        }
      } else {
        // Default search
        const searchResult = await searchAnimeAniList(messageText, 1, 6);
        if (searchResult.media.length > 0) {
          response = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Here's what I found for "${messageText}":`,
            recommendations: searchResult.media.map((a: any) => convertToAnimeData(a)),
            timestamp: new Date(),
          };
        } else {
          response = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "I couldn't find any anime matching that. Try asking about trending anime, recommendations, or searching for a specific title!",
            timestamp: new Date(),
          };
        }
      }

      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error("Barint error:", error);
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Oops! I had trouble processing that. Please try again!",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnimeClick = (animeId: number) => {
    navigate(`/anime/${animeId}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-border mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
            Barint <Sparkles className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-muted-foreground">Your AI Anime Assistant</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4 pb-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <Avatar className={cn("w-10 h-10", message.role === "assistant" && "bg-gradient-to-br from-primary to-secondary")}>
                {message.role === "assistant" ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <>
                    <AvatarImage src={undefined} />
                    <AvatarFallback>{user?.email?.[0].toUpperCase() || "U"}</AvatarFallback>
                  </>
                )}
              </Avatar>

              <div className={cn(
                "max-w-[80%] space-y-3",
                message.role === "user" && "text-right"
              )}>
                <div
                  className={cn(
                    "inline-block px-4 py-3 rounded-2xl",
                    message.role === "assistant"
                      ? "bg-card border border-border"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Recommendations */}
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {message.recommendations.map((anime: any) => (
                      <Card
                        key={anime.mal_id || anime.anilist_id}
                        className="overflow-hidden cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleAnimeClick(anime.anilist_id || anime.mal_id)}
                      >
                        <div className="relative aspect-[2/3]">
                          <img
                            src={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url}
                            alt={anime.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-2">
                          <p className="text-sm font-medium truncate">{anime.title_english || anime.title}</p>
                          {anime.score && (
                            <div className="flex items-center gap-1 text-xs text-yellow-400">
                              <Star className="w-3 h-3 fill-yellow-400" />
                              {anime.score.toFixed(1)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-10 h-10 bg-gradient-to-br from-primary to-secondary">
                <div className="w-full h-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </Avatar>
              <div className="bg-card border border-border px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="py-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_PROMPTS.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSend(prompt.text)}
                className="gap-2"
              >
                <prompt.icon className="w-4 h-4" />
                {prompt.text}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="pt-4 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about anime..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Barint;