import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bot, Send, Sparkles, TrendingUp, Users, BookOpen, Star, RefreshCw,
  Trash2, Copy, Check, Zap, MessageSquare, Plus, X, Image, Search,
  Calendar, Quote, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}

const WELCOME_MSG = "Hey there! 👋 I'm **Barint**, your AI anime assistant. I can search anime databases, recommend shows, identify characters, share quotes, and much more. Try asking me anything about anime!\n\n*Tip: Type \"activate birant mode\" for roast mode 🔥*";

const SUGGESTIONS = [
  { icon: TrendingUp, text: "What's trending this season?", color: "text-red-400" },
  { icon: Star, text: "Recommend anime like Frieren", color: "text-yellow-400" },
  { icon: Users, text: "Best anime for beginners", color: "text-blue-400" },
  { icon: Search, text: "Tell me about Jujutsu Kaisen", color: "text-green-400" },
  { icon: Image, text: "Show me anime wallpapers", color: "text-purple-400" },
  { icon: Quote, text: "Give me an iconic anime quote", color: "text-pink-400" },
  { icon: Calendar, text: "When does Solo Leveling season 2 air?", color: "text-cyan-400" },
  { icon: BookOpen, text: "Find manga similar to Berserk", color: "text-orange-400" },
];

const Barint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: WELCOME_MSG, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"barint" | "birant">("barint");
  const [intensity, setIntensity] = useState(50);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat sessions
  useEffect(() => {
    if (!user) return;
    const loadSessions = async () => {
      const { data } = await supabase
        .from("barint_chats")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        const sessions: ChatSession[] = data.map((d: any) => ({
          id: d.id,
          title: generateTitle(d.messages as any[] || []),
          messages: ((d.messages as any[]) || []).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
          updatedAt: new Date(d.updated_at),
        }));
        setChatSessions(sessions);
        // Load most recent
        setActiveChatId(sessions[0].id);
        setMessages(sessions[0].messages.length > 0 ? sessions[0].messages : [
          { id: "welcome", role: "assistant", content: WELCOME_MSG, timestamp: new Date() },
        ]);
      }
    };
    loadSessions();
  }, [user]);

  const generateTitle = (msgs: any[]): string => {
    const firstUser = msgs.find((m: any) => m.role === "user");
    if (!firstUser) return "New Chat";
    return firstUser.content.slice(0, 40) + (firstUser.content.length > 40 ? "..." : "");
  };

  const saveChatHistory = useCallback(async (newMessages: Message[], chatId?: string) => {
    if (!user) return;
    const id = chatId || activeChatId;

    if (id) {
      await supabase
        .from("barint_chats")
        .update({ messages: newMessages as any, updated_at: new Date().toISOString() })
        .eq("id", id);
    } else {
      const { data } = await supabase
        .from("barint_chats")
        .insert({ user_id: user.id, messages: newMessages as any })
        .select("id")
        .single();
      if (data) {
        setActiveChatId(data.id);
        setChatSessions(prev => [{
          id: data.id,
          title: generateTitle(newMessages),
          messages: newMessages,
          updatedAt: new Date(),
        }, ...prev]);
      }
    }
  }, [user, activeChatId]);

  const streamAIResponse = async (
    userMessage: string,
    history: Message[],
    signal: AbortSignal,
  ): Promise<string> => {
    const apiMessages = history
      .filter(m => m.id !== "welcome")
      .map(m => ({ role: m.role, content: m.content }));

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/barint-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: [...apiMessages, { role: "user", content: userMessage }],
        mode,
        intensity,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Network error" }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    // Check mode headers
    const newMode = response.headers.get("X-Barint-Mode");
    if (newMode && (newMode === "barint" || newMode === "birant")) {
      setMode(newMode);
    }
    const newIntensity = response.headers.get("X-Barint-Intensity");
    if (newIntensity) setIntensity(parseInt(newIntensity));

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
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.id !== "welcome") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: fullContent } : m);
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

    // Mode switch detection on client side
    const modeMatch = messageText.match(/activate\s+(birant|barint)\s*(?:mode)?(?:\s+(\d+))?/i);
    if (modeMatch) {
      const newMode = modeMatch[1].toLowerCase() as "barint" | "birant";
      const newIntensity = modeMatch[2] ? parseInt(modeMatch[2]) : 50;
      setMode(newMode);
      setIntensity(newIntensity);
    }

    const userMessage: Message = {
      id: crypto.randomUUID(), role: "user", content: messageText, timestamp: new Date(),
    };
    const assistantPlaceholder: Message = {
      id: crypto.randomUUID(), role: "assistant", content: "", timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage, assistantPlaceholder];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    abortRef.current = new AbortController();

    try {
      const aiResponse = await streamAIResponse(messageText, [...messages, userMessage], abortRef.current.signal);

      setMessages(prev => {
        const updated = prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content: aiResponse } : m
        );
        saveChatHistory(updated);
        return updated;
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, content: `Oops! ${errorMessage}. Try again?` } : m
      ));
      if (errorMessage.includes("Rate limit")) toast.error("Too many requests. Please wait.");
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const copyMessage = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const newChat = () => {
    setActiveChatId(null);
    setMessages([{ id: "welcome", role: "assistant", content: WELCOME_MSG, timestamp: new Date() }]);
  };

  const loadChat = (session: ChatSession) => {
    setActiveChatId(session.id);
    setMessages(session.messages.length > 0 ? session.messages : [
      { id: "welcome", role: "assistant", content: WELCOME_MSG, timestamp: new Date() },
    ]);
    setSidebarOpen(false);
  };

  const deleteChat = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("barint_chats").delete().eq("id", sessionId);
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeChatId === sessionId) newChat();
    toast.success("Chat deleted");
  };

  const clearChat = async () => {
    if (activeChatId) {
      await supabase.from("barint_chats").delete().eq("id", activeChatId);
      setChatSessions(prev => prev.filter(s => s.id !== activeChatId));
    }
    newChat();
    toast.success("Chat cleared!");
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-200 md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-0"
      )}>
        <div className="flex flex-col h-full p-3">
          <Button onClick={newChat} className="w-full mb-3 gap-2" variant="outline" size="sm">
            <Plus className="w-4 h-4" /> New Chat
          </Button>
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {chatSessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => loadChat(session)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm hover:bg-muted transition-colors group",
                    activeChatId === session.id && "bg-muted"
                  )}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1">{session.title}</span>
                  <button
                    onClick={(e) => deleteChat(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-3 px-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <MessageSquare className="w-5 h-5" />
            </Button>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              mode === "birant"
                ? "bg-gradient-to-br from-orange-500 to-red-600"
                : "bg-gradient-to-br from-primary to-secondary"
            )}>
              {mode === "birant" ? <Flame className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground flex items-center gap-2">
                {mode === "birant" ? "Birant" : "Barint"}
                {mode === "birant"
                  ? <Zap className="w-4 h-4 text-orange-400" />
                  : <Sparkles className="w-4 h-4 text-primary" />
                }
              </h1>
              <p className="text-xs text-muted-foreground">
                {mode === "birant" ? `Roast Mode (${intensity}%)` : "AI Anime Assistant"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 1 && (
              <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4 pb-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}
              >
                <Avatar className={cn(
                  "w-8 h-8 flex-shrink-0",
                  message.role === "assistant" && (mode === "birant"
                    ? "bg-gradient-to-br from-orange-500 to-red-600"
                    : "bg-gradient-to-br from-primary to-secondary")
                )}>
                  {message.role === "assistant" ? (
                    <div className="w-full h-full flex items-center justify-center">
                      {mode === "birant"
                        ? <Flame className="w-4 h-4 text-white" />
                        : <Bot className="w-4 h-4 text-white" />
                      }
                    </div>
                  ) : (
                    <>
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="text-xs">{user?.email?.[0].toUpperCase() || "U"}</AvatarFallback>
                    </>
                  )}
                </Avatar>

                <div className={cn("max-w-[85%] space-y-2", message.role === "user" && "text-right")}>
                  <div className={cn(
                    "inline-block px-4 py-3 rounded-2xl relative group",
                    message.role === "assistant"
                      ? "bg-card border border-border"
                      : "bg-primary text-primary-foreground"
                  )}>
                    {message.content ? (
                      message.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:my-2 prose-img:rounded-xl prose-img:max-h-64 prose-a:text-primary">
                          <ReactMarkdown
                            components={{
                              img: ({ src, alt }) => (
                                <img src={src} alt={alt || "Anime"} className="rounded-xl max-h-64 my-2" loading="lazy" />
                              ),
                              a: ({ href, children }) => (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )
                    ) : (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {mode === "birant" ? "Preparing roast..." : "Thinking..."}
                        </span>
                      </div>
                    )}

                    {/* Copy button */}
                    {message.role === "assistant" && message.content && message.id !== "welcome" && (
                      <button
                        onClick={() => copyMessage(message.id, message.content)}
                        className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded-full p-1.5 shadow-sm"
                      >
                        {copiedId === message.id
                          ? <Check className="w-3 h-3 text-green-500" />
                          : <Copy className="w-3 h-3 text-muted-foreground" />
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Stop button */}
            {isLoading && (
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={stopGeneration} className="text-xs">
                  Stop generating
                </Button>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="py-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SUGGESTIONS.map((s, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(s.text)}
                  className="gap-1.5 text-xs h-auto py-2 justify-start"
                  disabled={isLoading}
                >
                  <s.icon className={cn("w-3.5 h-3.5 flex-shrink-0", s.color)} />
                  <span className="truncate">{s.text}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="pt-3 border-t border-border">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "birant" ? "Say something... if you dare 🔥" : "Ask me anything about anime..."}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Barint;
