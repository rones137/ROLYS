import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, MapPin, Link as LinkIcon, Calendar, 
  BookOpen, Image as ImageIcon, Settings, ThumbsUp, Eye, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

interface FollowStats {
  followers: number;
  following: number;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [followStats, setFollowStats] = useState<FollowStats>({ followers: 0, following: 0 });
  const [novels, setNovels] = useState<any[]>([]);
  const [manga, setManga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAll();
    }
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadProfile(), loadContent(), loadFollowStats()]);
    setLoading(false);
  };

  const loadProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) setProfile(data);
  };

  const loadContent = async () => {
    if (!user) return;

    const [novelsResult, mangaResult] = await Promise.all([
      supabase.from('novels').select('*').eq('author_id', user.id).order('created_at', { ascending: false }),
      supabase.from('manga').select('*').eq('author_id', user.id).order('created_at', { ascending: false })
    ]);

    if (novelsResult.data) setNovels(novelsResult.data);
    if (mangaResult.data) setManga(mangaResult.data);
  };

  const loadFollowStats = async () => {
    if (!user) return;

    const [followersResult, followingResult] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', user.id),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', user.id)
    ]);

    setFollowStats({
      followers: followersResult.count || 0,
      following: followingResult.count || 0
    });
  };

  const getInitials = () => {
    if (profile?.display_name) return profile.display_name.slice(0, 2).toUpperCase();
    if (profile?.username) return profile.username.slice(0, 2).toUpperCase();
    return 'U';
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h2>
        <p className="text-muted-foreground mb-6">Please sign in to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Banner */}
      <div className="relative h-40 sm:h-52 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/10">
        {profile?.banner_url && (
          <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Profile Info */}
      <div className="relative px-4 sm:px-6 -mt-16 sm:-mt-20 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 pt-2 sm:pt-0 sm:pb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {profile?.display_name || profile?.username || 'User'}
            </h1>
            {profile?.username && (
              <p className="text-muted-foreground text-sm">@{profile.username}</p>
            )}
          </div>

          <Button onClick={() => navigate('/settings')} variant="outline" size="sm" className="gap-1.5">
            <Settings className="w-4 h-4" />
            Edit Profile
          </Button>
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
      {(profile?.bio || profile?.location || profile?.website) && (
        <Card className="mx-4 sm:mx-0 mb-6 bg-card/50">
          <CardContent className="p-4 sm:p-6">
            {profile?.bio && <p className="text-foreground mb-4 text-sm sm:text-base">{profile.bio}</p>}
            
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              {profile?.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile?.website && (
                <a 
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{profile.website}</span>
                </a>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {profile?.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : 'Recently'}</span>
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
              <p className="text-sm mb-2">No novels yet</p>
              <Button variant="link" size="sm" onClick={() => navigate('/novel-editor')}>
                Start writing
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {novels.map(novel => (
                <Card 
                  key={novel.id} 
                  className="overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group border-border/50"
                  onClick={() => navigate(novel.status === 'published' ? `/read/novel/${novel.id}` : `/novel-editor?id=${novel.id}`)}
                >
                  <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                    {novel.cover_url ? (
                      <img src={novel.cover_url} alt={novel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <Badge 
                      variant={novel.status === 'published' ? 'default' : 'secondary'} 
                      className="absolute top-1.5 right-1.5 text-xs"
                    >
                      {novel.status}
                    </Badge>
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
              <p className="text-sm mb-2">No manga yet</p>
              <Button variant="link" size="sm" onClick={() => navigate('/manga-editor')}>
                Start creating
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {manga.map(m => (
                <Card 
                  key={m.id} 
                  className="overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group border-border/50"
                  onClick={() => navigate(m.status === 'published' ? `/read/manga/${m.id}` : `/manga-editor?id=${m.id}`)}
                >
                  <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                    {m.cover_url ? (
                      <img src={m.cover_url} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <Badge 
                      variant={m.status === 'published' ? 'default' : 'secondary'} 
                      className="absolute top-1.5 right-1.5 text-xs"
                    >
                      {m.status}
                    </Badge>
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

export default Profile;