import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, Check, CheckCheck, X, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  updated_at: string;
  other_user?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

interface MessageRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  message: string | null;
  created_at: string;
  sender?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface MessagesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MessagesPanel = ({ open, onOpenChange }: MessagesPanelProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && open) {
      loadConversations();
      loadRequests();
    }
  }, [user, open]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages-${selectedConversation.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          scrollToBottom();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (data) {
      // Load other user profiles
      const convosWithUsers = await Promise.all(data.map(async (conv) => {
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .eq('user_id', otherUserId)
          .single();

        return {
          ...conv,
          other_user: profile ? { id: profile.user_id, ...profile } : undefined
        };
      }));

      setConversations(convosWithUsers);
    }
    setLoading(false);
  };

  const loadRequests = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('message_requests')
      .select('*')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (data) {
      // Load sender profiles
      const requestsWithProfiles = await Promise.all(data.map(async (req) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('user_id', req.sender_id)
          .single();

        return { ...req, sender: profile || undefined };
      }));

      setRequests(requestsWithProfiles);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      scrollToBottom();

      // Mark as read
      if (user) {
        await supabase
          .from('direct_messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id);
      }
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;
    setSending(true);

    const { error } = await supabase.from('direct_messages').insert({
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      content: newMessage.trim()
    });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);
    }
    setSending(false);
  };

  const acceptRequest = async (request: MessageRequest) => {
    if (!user) return;

    // Update request status
    await supabase
      .from('message_requests')
      .update({ status: 'accepted' })
      .eq('id', request.id);

    // Create conversation
    const { data: conv } = await supabase
      .from('conversations')
      .insert({
        user1_id: request.sender_id,
        user2_id: user.id
      })
      .select()
      .single();

    if (conv) {
      // Notify sender
      await supabase.from('notifications').insert({
        user_id: request.sender_id,
        type: 'message_request_accepted',
        title: 'Message Request Accepted',
        message: 'Your message request was accepted. You can now chat!',
        data: { conversation_id: conv.id }
      });

      toast.success("Request accepted! You can now chat.");
      loadConversations();
      loadRequests();
    }
  };

  const declineRequest = async (requestId: string) => {
    await supabase
      .from('message_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    toast.success("Request declined");
    loadRequests();
  };

  const getInitials = (name: string | null | undefined, username: string | undefined) => {
    if (name) return name.slice(0, 2).toUpperCase();
    if (username) return username.slice(0, 2).toUpperCase();
    return 'U';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>Messages</SheetTitle>
        </SheetHeader>

        {!selectedConversation ? (
          <Tabs defaultValue="chats" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="chats" className="flex-1">Chats</TabsTrigger>
              <TabsTrigger value="requests" className="flex-1 relative">
                Requests
                {requests.length > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {requests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chats" className="flex-1 mt-0">
              <ScrollArea className="h-[calc(100vh-180px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <Send className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No conversations yet</p>
                    <p className="text-sm text-muted-foreground">Visit a user's profile to send a message request</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className="w-full p-4 hover:bg-muted/50 transition-colors flex items-center gap-3 text-left"
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {getInitials(conv.other_user?.display_name, conv.other_user?.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {conv.other_user?.display_name || conv.other_user?.username || 'User'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message || 'No messages yet'}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conv.updated_at), 'MMM d')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="requests" className="flex-1 mt-0">
              <ScrollArea className="h-[calc(100vh-180px)]">
                {requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <UserPlus className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No pending requests</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {requests.map(req => (
                      <div key={req.id} className="p-4 flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={req.sender?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">
                            {getInitials(req.sender?.display_name, req.sender?.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {req.sender?.display_name || req.sender?.username || 'User'}
                          </p>
                          {req.message && (
                            <p className="text-sm text-muted-foreground mt-1">{req.message}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => acceptRequest(req)}>
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => declineRequest(req.id)}>
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-3 border-b border-border flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
                ←
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedConversation.other_user?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {getInitials(selectedConversation.other_user?.display_name, selectedConversation.other_user?.username)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">
                {selectedConversation.other_user?.display_name || selectedConversation.other_user?.username}
              </span>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        msg.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        <span className="text-xs">
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </span>
                        {msg.sender_id === user?.id && (
                          msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MessagesPanel;