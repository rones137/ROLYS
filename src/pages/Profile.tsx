import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, MapPin, Link as LinkIcon, Calendar, Users, Heart, 
  BookOpen, Image as ImageIcon, MessageSquare, Settings
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
      loadProfile();
      loadContent();
      loadFollowStats();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const loadContent = async () => {
    if (!user) return;

    const [novelsResult, mangaResult] = await Promise.all([
      supabase.from('novels').select('*').eq('author_id', user.id).eq('status', 'published'),
      supabase.from('manga').select('*').eq('author_id', user.id).eq('status', 'published')
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
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <User className="w-24 h-24 text-muted-foreground mb-6" />
        <h2 className="text-3xl font-bold text-foreground mb-3">Sign In Required</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Please sign in to view your profile.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="relative mb-8">
        {/* Banner */}
        <div className="h-48 rounded-xl overflow-hidden bg-gradient-to-r from-primary/30 to-secondary/30">
          {profile?.banner_url && (
            <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Avatar & Basic Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 px-4">
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 pb-2">
            <h1 className="text-3xl font-bold text-foreground">
              {profile?.display_name || profile?.username || 'User'}
            </h1>
            {profile?.username && profile?.display_name && (
              <p className="text-muted-foreground">@{profile.username}</p>
            )}
          </div>

          <Button onClick={() => navigate('/settings')} variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{followStats.followers}</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{followStats.following}</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{novels.length}</div>
            <div className="text-sm text-muted-foreground">Novels</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{manga.length}</div>
            <div className="text-sm text-muted-foreground">Manga</div>
          </CardContent>
        </Card>
      </div>

      {/* Bio & Details */}
      <Card className="mb-8">
        <CardContent className="p-6">
          {profile?.bio && (
            <p className="text-foreground mb-4">{profile.bio}</p>
          )}
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {profile?.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile?.website && (
              <a 
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                <span>{profile.website}</span>
              </a>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {profile?.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : 'Recently'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="novels" className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="novels" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Novels ({novels.length})
          </TabsTrigger>
          <TabsTrigger value="manga" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            Manga ({manga.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="novels">
          {novels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No published novels yet</p>
              <Button variant="link" onClick={() => navigate('/novel-editor')}>
                Start writing your first novel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {novels.map(novel => (
                <Card key={novel.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-[3/4] bg-muted">
                    {novel.cover_url && (
                      <img src={novel.cover_url} alt={novel.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground truncate">{novel.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{novel.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="manga">
          {manga.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No published manga yet</p>
              <Button variant="link" onClick={() => navigate('/manga-editor')}>
                Start creating your first manga
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {manga.map(m => (
                <Card key={m.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-[3/4] bg-muted">
                    {m.cover_url && (
                      <img src={m.cover_url} alt={m.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground truncate">{m.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{m.description}</p>
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
