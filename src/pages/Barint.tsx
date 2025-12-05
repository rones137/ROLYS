import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getTrendingAnime, searchAnimeAniList, convertToAnimeData, getPopularAnime, getAnimeByGenre } from "@/lib/anilist";
import { getMyList } from "@/lib/storage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bot, Send, Sparkles, TrendingUp, Users, BookOpen, Star, RefreshCw, Trash2, History
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
  { icon: Users, text: "Best anime for beginners", action: "beginners" },
  { icon: BookOpen, text: "What should I watch next?", action: "personalized" },
];

// Keywords that trigger AniList API searches
const SEARCH_TRIGGERS = ["search", "find", "show me", "looking for", "where can i find"];
const TRENDING_TRIGGERS = ["trending", "popular now", "this season", "what's hot"];
const RECOMMEND_TRIGGERS = ["recommend", "suggest", "similar to", "like", "if i liked"];
const GENRE_TRIGGERS = ["action anime", "romance anime", "comedy anime", "horror anime", "sci-fi anime", "fantasy anime", "slice of life"];

const Barint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey there! 👋 I'm Barint, your anime assistant. I can help you discover new anime, get personalized recommendations based on your watch history, and chat about all things anime. What would you like to explore today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history from Supabase
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("barint_chats")
        .select("messages")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.messages) {
        const savedMessages = data.messages as unknown as Message[];
        if (Array.isArray(savedMessages) && savedMessages.length > 0) {
          setMessages(savedMessages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
          setConversationHistory(
            savedMessages
              .filter(m => m.id !== "welcome")
              .map(m => ({ role: m.role, content: m.content }))
          );
        }
      }
    };

    loadChatHistory();
  }, [user]);

  // Save chat history
  const saveChatHistory = async (newMessages: Message[]) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("barint_chats")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      await supabase
        .from("barint_chats")
        .update({ messages: newMessages as any, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("barint_chats")
        .insert({ user_id: user.id, messages: newMessages as any });
    }
  };

  const streamAIResponse = async (
    userMessage: string,
    history: { role: string; content: string }[],
    animeContext?: any
  ): Promise<string> => {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/barint-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: [...history, { role: "user", content: userMessage }],
        animeContext,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get AI response");
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let textBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullContent += content;
            // Update message in real-time
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.role === "assistant" && lastMessage.id !== "welcome") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: fullContent } : m
                );
              }
              return prev;
            });
          }
        } catch {
          // Incomplete JSON, continue
        }
      }
    }

    return fullContent;
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    // Add placeholder for assistant response
    const assistantPlaceholder: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage, assistantPlaceholder]);
    setInput("");
    setIsLoading(true);

    try {
      const lowerText = messageText.toLowerCase();
      let animeContext: any = null;
      let recommendations: any[] = [];

      // Check for API triggers and fetch relevant data
      const needsTrending = TRENDING_TRIGGERS.some(t => lowerText.includes(t));
      const needsSearch = SEARCH_TRIGGERS.some(t => lowerText.includes(t));
      const needsRecommend = RECOMMEND_TRIGGERS.some(t => lowerText.includes(t));
      const genreMatch = GENRE_TRIGGERS.find(g => lowerText.includes(g.replace(" anime", "")));

      // Get user's watch history for personalized recommendations
      const userWatchList = getMyList();
      const watchedTitles = userWatchList.map(a => a.title || a.title_english).filter(Boolean);

      if (needsTrending) {
        const data = await getTrendingAnime(1, 6);
        recommendations = data.media.map((a: any) => convertToAnimeData(a));
        animeContext = { type: "trending", data: recommendations.map(r => ({ title: r.title, score: r.score, genres: r.genres })) };
      } else if (genreMatch) {
        const genre = genreMatch.replace(" anime", "");
        const data = await getAnimeByGenre(genre, 1, 6);
        recommendations = data.media.map((a: any) => convertToAnimeData(a));
        animeContext = { type: "genre", genre, data: recommendations.map(r => ({ title: r.title, score: r.score })) };
      } else if (needsSearch || needsRecommend) {
        // Extract search query
        let query = messageText;
        const patterns = [/(?:search|find|show me|looking for|similar to|like|recommend)\s+(.+?)(?:\?|$)/i];
        for (const pattern of patterns) {
          const match = messageText.match(pattern);
          if (match) {
            query = match[1].trim();
            break;
          }
        }
        
        if (query && query.length > 2) {
          const searchResult = await searchAnimeAniList(query, 1, 6);
          if (searchResult.media.length > 0) {
            recommendations = searchResult.media.map((a: any) => convertToAnimeData(a));
            animeContext = { type: "search", query, data: recommendations.map(r => ({ title: r.title, score: r.score, genres: r.genres })) };
          }
        }
      } else if (lowerText.includes("what should i watch") || lowerText.includes("next")) {
        // Personalized recommendations based on watch history
        if (watchedTitles.length > 0) {
          animeContext = { 
            type: "personalized", 
            watchHistory: watchedTitles.slice(0, 10),
            message: "User has watched these anime and wants personalized recommendations"
          };
          // Fetch trending as a base for AI to filter
          const data = await getPopularAnime(1, 12);
          recommendations = data.media.map((a: any) => convertToAnimeData(a));
          animeContext.availableRecommendations = recommendations.map(r => ({ title: r.title, score: r.score, genres: r.genres }));
        } else {
          const data = await getTrendingAnime(1, 6);
          recommendations = data.media.map((a: any) => convertToAnimeData(a));
          animeContext = { type: "new_user", data: recommendations.map(r => ({ title: r.title, score: r.score })) };
        }
      }

      // Include watch history context for conversational responses
      if (watchedTitles.length > 0 && !animeContext) {
        animeContext = { userWatchHistory: watchedTitles.slice(0, 5) };
      }

      // Get AI response
      const newHistory = [...conversationHistory, { role: "user", content: messageText }];
      const aiResponse = await streamAIResponse(messageText, conversationHistory, animeContext);

      // Update final message with recommendations
      setMessages(prev => {
        const updated = prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, content: aiResponse, recommendations: recommendations.length > 0 ? recommendations : undefined }
            : m
        );
        saveChatHistory(updated);
        return updated;
      });

      // Update conversation history
      setConversationHistory([...newHistory, { role: "assistant", content: aiResponse }]);

    } catch (error) {
      console.error("Barint error:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      
      setMessages(prev => {
        const updated = prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, content: `Oops! ${errorMessage}. Let me try a different approach - what anime are you interested in?` }
            : m
        );
        return updated;
      });
      
      if (errorMessage.includes("Rate limit")) {
        toast.error("Too many requests. Please wait a moment.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnimeClick = (animeId: number) => {
    navigate(`/anime/${animeId}`);
  };

  const clearChat = async () => {
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: "Hey there! 👋 I'm Barint, your anime assistant. I can help you discover new anime, get personalized recommendations based on your watch history, and chat about all things anime. What would you like to explore today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    setConversationHistory([]);
    
    if (user) {
      await supabase.from("barint_chats").delete().eq("user_id", user.id);
    }
    toast.success("Chat cleared!");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border mb-4">
        <div className="flex items-center gap-4">
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
        <div className="flex items-center gap-2">
          {user && messages.length > 1 && (
            <Button variant="ghost" size="sm" onClick={clearChat}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
          )}
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
                  {message.content ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  )}
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
                disabled={isLoading}
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
