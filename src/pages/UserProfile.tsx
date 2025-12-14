import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, MapPin, Link as LinkIcon, Calendar, UserPlus, UserMinus,
  BookOpen, Image as ImageIcon, ThumbsUp, Eye, Loader2, MessageCircle,
  UserCheck, Send
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  created_at: string;
}

interface FollowStats {
  followers: number;
  following: number;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [followStats, setFollowStats] = useState<FollowStats>({ followers: 0, following: 0 });
  const [novels, setNovels] = useState<any[]>([]);
  const [manga, setManga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [hasRequestPending, setHasRequestPending] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [messageRequestOpen, setMessageRequestOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (userId) {
      loadAll();
    }
  }, [userId, user]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      loadProfile(),
      loadContent(),
      loadFollowStats(),
      checkFollowStatus(),
      checkFriendStatus(),
      checkRequestStatus()
    ]);
    setLoading(false);
  };

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) setProfile(data);
  };

  const loadContent = async () => {
    const [novelsResult, mangaResult] = await Promise.all([
      supabase.from('novels').select('*').eq('author_id', userId).eq('status', 'published').order('upvote_count', { ascending: false }),
      supabase.from('manga').select('*').eq('author_id', userId).eq('status', 'published').order('upvote_count', { ascending: false })
    ]);

    if (novelsResult.data) setNovels(novelsResult.data);
    if (mangaResult.data) setManga(mangaResult.data);
  };

  const loadFollowStats = async () => {
    const [followersResult, followingResult] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId)
    ]);

    setFollowStats({
      followers: followersResult.count || 0,
      following: followingResult.count || 0
    });
  };

  const checkFollowStatus = async () => {
    if (!user || user.id === userId) return;
    
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const checkFriendStatus = async () => {
    if (!user || user.id === userId) return;
    
    const { data } = await supabase
      .from('friends')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
      .maybeSingle();

    setIsFriend(!!data);
  };

  const checkRequestStatus = async () => {
    if (!user || user.id === userId) return;
    
    const { data } = await supabase
      .from('message_requests')
      .select('id, status')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
      .maybeSingle();

    setHasRequestPending(data?.status === 'pending' || data?.status === 'accepted');
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please sign in to follow users");
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
        setIsFollowing(false);
        setFollowStats(prev => ({ ...prev, followers: prev.followers - 1 }));
        toast.success("Unfollowed");
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
        setIsFollowing(true);
        setFollowStats(prev => ({ ...prev, followers: prev.followers + 1 }));
        
        // Create notification
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'follow',
          title: 'New Follower',
          message: `${profile?.display_name || profile?.username || 'Someone'} started following you`,
          data: { follower_id: user.id }
        });
        
        toast.success("Following!");
      }
    } catch (error) {
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!user) {
      toast.error("Please sign in");
      return;
    }

    try {
      if (isFriend) {
        await supabase.from('friends').delete()
          .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`);
        setIsFriend(false);
        toast.success("Removed from friends");
      } else {
        await supabase.from('friends').insert({ user_id: user.id, friend_id: userId });
        setIsFriend(true);
        toast.success("Added as friend! They can now message you directly.");
      }
    } catch (error) {
      toast.error("Failed to update friend status");
    }
  };

  const sendMessageRequest = async () => {
    if (!user) return;
    setSendingRequest(true);

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (existingConv) {
        toast.info("You already have a conversation with this user");
        setMessageRequestOpen(false);
        return;
      }

      // Check if they are friends (can message directly)
      if (isFriend) {
        // Create conversation directly
        await supabase.from('conversations').insert({
          user1_id: user.id,
          user2_id: userId
        });
        toast.success("Conversation started!");
        setMessageRequestOpen(false);
        return;
      }

      // Send message request
      await supabase.from('message_requests').insert({
        sender_id: user.id,
        receiver_id: userId,
        message: messageText.trim() || null
      });

      // Notify user
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'message_request',
        title: 'New Message Request',
        message: `${profile?.display_name || profile?.username || 'Someone'} wants to message you`,
        data: { sender_id: user.id }
      });

      toast.success("Message request sent!");
      setHasRequestPending(true);
      setMessageRequestOpen(false);
      setMessageText("");
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error("You already sent a request to this user");
      } else {
        toast.error("Failed to send request");
      }
    } finally {
      setSendingRequest(false);
    }
  };

  const getInitials = () => {
    if (profile?.display_name) return profile.display_name.slice(0, 2).toUpperCase();
    if (profile?.username) return profile.username.slice(0, 2).toUpperCase();
    return 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">User Not Found</h2>
        <p className="text-muted-foreground mb-6">This user doesn't exist or their profile is not available.</p>
        <Button size="sm" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Banner */}
      <div className="relative h-40 sm:h-52 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/10">
        {profile.banner_url && (
          <img 
            src={profile.banner_url} 
            alt="Banner" 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Profile Info */}
      <div className="relative px-4 sm:px-6 -mt-16 sm:-mt-20 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
            <AvatarImage 
              src={profile.avatar_url || undefined} 
              alt={profile.display_name || 'User'} 
              className="object-cover"
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 pt-2 sm:pt-0 sm:pb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {profile.display_name || profile.username || 'User'}
            </h1>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
          </div>

          {!isOwnProfile && (
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleFollow} 
                disabled={followLoading}
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                className="gap-1.5"
              >
                {followLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <><UserMinus className="w-4 h-4" /> Unfollow</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Follow</>
                )}
              </Button>

              <Button
                onClick={handleAddFriend}
                variant={isFriend ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                {isFriend ? "Friend" : "Add Friend"}
              </Button>

              <Dialog open={messageRequestOpen} onOpenChange={setMessageRequestOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5"
                    disabled={hasRequestPending && !isFriend}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {hasRequestPending && !isFriend ? "Request Sent" : "Message"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {isFriend ? "Start Conversation" : "Send Message Request"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    {!isFriend && (
                      <p className="text-sm text-muted-foreground">
                        Send a message request to {profile.display_name || profile.username}. 
                        They'll need to accept before you can chat.
                      </p>
                    )}
                    <Textarea
                      placeholder={isFriend ? "Type your message..." : "Add a message (optional)..."}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={sendMessageRequest} 
                      disabled={sendingRequest}
                      className="w-full gap-2"
                    >
                      {sendingRequest ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {isFriend ? "Send Message" : "Send Request"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 px-4 sm:px-0 mb-6">
        {[
          { value: followStats.followers, label: "Followers" },
          { value: followStats.following, label: "Following" },
          { value: novels.length, label: "Novels" },
          { value: manga.length, label: "Manga" }
        ].map((stat, i) => (
          <Card key={i} className="bg-card/50 border-border/50">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bio & Details */}
      {(profile.bio || profile.location || profile.website) && (
        <Card className="mx-4 sm:mx-0 mb-6 bg-card/50">
          <CardContent className="p-4 sm:p-6">
            {profile.bio && <p className="text-foreground mb-4 text-sm sm:text-base">{profile.bio}</p>}
            
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <a 
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">{profile.website}</span>
                </a>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {format(new Date(profile.created_at), 'MMM yyyy')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="novels" className="px-4 sm:px-0">
        <TabsList className="w-full justify-start mb-4 h-auto p-1">
          <TabsTrigger value="novels" className="gap-1.5 text-xs sm:text-sm px-3 py-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Novels</span> ({novels.length})
          </TabsTrigger>
          <TabsTrigger value="manga" className="gap-1.5 text-xs sm:text-sm px-3 py-2">
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Manga</span> ({manga.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="novels">
          {novels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No published novels yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {novels.map(novel => (
                <Card 
                  key={novel.id} 
                  className="overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group border-border/50"
                  onClick={() => navigate(`/read/novel/${novel.id}`)}
                >
                  <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                    {novel.cover_url ? (
                      <img 
                        src={novel.cover_url} 
                        alt={novel.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs px-1.5 py-0.5">
                        <ThumbsUp className="w-3 h-3 mr-0.5" />{novel.upvote_count || 0}
                      </Badge>
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs px-1.5 py-0.5">
                        <Eye className="w-3 h-3 mr-0.5" />{novel.view_count || 0}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-2 sm:p-3">
                    <h3 className="font-medium text-foreground truncate text-sm">{novel.title}</h3>
                    {novel.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{novel.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="manga">
          {manga.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No published manga yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {manga.map(m => (
                <Card 
                  key={m.id} 
                  className="overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group border-border/50"
                  onClick={() => navigate(`/read/manga/${m.id}`)}
                >
                  <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                    {m.cover_url ? (
                      <img 
                        src={m.cover_url} 
                        alt={m.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs px-1.5 py-0.5">
                        <ThumbsUp className="w-3 h-3 mr-0.5" />{m.upvote_count || 0}
                      </Badge>
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs px-1.5 py-0.5">
                        <Eye className="w-3 h-3 mr-0.5" />{m.view_count || 0}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-2 sm:p-3">
                    <h3 className="font-medium text-foreground truncate text-sm">{m.title}</h3>
                    {m.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{m.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;