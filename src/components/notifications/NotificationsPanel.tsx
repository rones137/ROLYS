import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bell, UserPlus, MessageSquare, Heart, BookOpen, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  data: any;
}

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationsPanel = ({ open, onOpenChange }: NotificationsPanelProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      loadNotifications();
    }
  }, [user, open]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.data?.follower_id) {
      navigate(`/user/${notification.data.follower_id}`);
    } else if (notification.data?.conversation_id) {
      // Open messages
    } else if (notification.data?.novel_id) {
      navigate(`/read/novel/${notification.data.novel_id}`);
    } else if (notification.data?.manga_id) {
      navigate(`/read/manga/${notification.data.manga_id}`);
    }
    
    onOpenChange(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'follow': return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'message_request': return <MessageSquare className="w-5 h-5 text-yellow-500" />;
      case 'message_request_accepted': return <Check className="w-5 h-5 text-green-500" />;
      case 'like': return <Heart className="w-5 h-5 text-red-500" />;
      case 'new_chapter': return <BookOpen className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border flex-row items-center justify-between">
          <SheetTitle>Notifications</SheetTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 hover:bg-muted/50 transition-colors flex items-start gap-3 text-left ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''} text-foreground`}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsPanel;