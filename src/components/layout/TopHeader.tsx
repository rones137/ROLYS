import { Menu, Search, Bell, LogIn, LogOut, User, Settings, Eye, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignInDialog } from "@/components/auth/SignInDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessagesPanel } from "@/components/messaging/MessagesPanel";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";

interface TopHeaderProps {
  onMenuClick: () => void;
}

export const TopHeader = ({ onMenuClick }: TopHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [signInOpen, setSignInOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadProfile();
      loadUnreadCounts();
    } else {
      setProfile(null);
      setUnreadNotifications(0);
      setUnreadMessages(0);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setProfile(data);
  };

  const loadUnreadCounts = async () => {
    if (!user) return;

    // Unread notifications
    const { count: notifCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setUnreadNotifications(notifCount || 0);

    // Unread message requests
    const { count: msgCount } = await supabase
      .from('message_requests')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    setUnreadMessages(msgCount || 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Hamburger Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label="Toggle menu"
            className="shrink-0 h-9 w-9"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-muted/30 border-border/50 focus:border-primary/50 focus-visible:ring-primary/20 text-sm"
              />
            </div>
          </form>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {user && (
              <>
                {/* Messages Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9"
                  onClick={() => setMessagesOpen(true)}
                  aria-label="Messages"
                >
                  <Send className="w-4 h-4" />
                  {unreadMessages > 0 && (
                    <Badge 
                      className="absolute -top-0.5 -right-0.5 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-primary"
                    >
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </Badge>
                  )}
                </Button>

                {/* Notifications Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9"
                  onClick={() => setNotificationsOpen(true)}
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifications > 0 && (
                    <Badge 
                      className="absolute -top-0.5 -right-0.5 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-primary"
                    >
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0 h-9 w-9">
                    <Avatar className="h-8 w-8 border border-primary/30">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{profile?.display_name || profile?.username || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <Eye className="w-4 h-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                size="sm"
                className="h-9 px-3 text-sm font-medium"
                onClick={() => setSignInOpen(true)}
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
      <MessagesPanel open={messagesOpen} onOpenChange={setMessagesOpen} />
      <NotificationsPanel open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </header>
  );
};