import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Share2, Plus, Users, TrendingUp, Clock, Image as ImageIcon, X } from 'lucide-react';
import { SignInDialog } from '@/components/auth/SignInDialog';
import type { Tables } from '@/integrations/supabase/types';

interface PostWithRelations {
  id: string;
  title: string;
  content: string | null;
  author_id: string;
  community_id: string;
  created_at: string;
  likes_count: number | null;
  comments_count: number | null;
  image_urls: string[] | null;
  type: 'text' | 'image' | 'video' | 'poll';
  is_nsfw: boolean | null;
  is_spoiler: boolean | null;
  author_username?: string;
  author_display_name?: string;
  author_avatar_url?: string;
  community_name?: string;
}

type CommunityType = Tables<'communities'>;

const CommunityPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [communities, setCommunities] = useState<CommunityType[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Tables<'profiles'>>>({});
  const [loading, setLoading] = useState(true);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createCommunityOpen, setCreateCommunityOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', community_id: '' });
  const [newCommunity, setNewCommunity] = useState({ name: '', description: '' });
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [postsRes, communitiesRes, profilesRes] = await Promise.all([
      supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('communities').select('*').order('member_count', { ascending: false }).limit(10),
      supabase.from('profiles').select('*')
    ]);

    if (postsRes.data && communitiesRes.data && profilesRes.data) {
      const profileMap: Record<string, Tables<'profiles'>> = {};
      profilesRes.data.forEach(p => { profileMap[p.user_id] = p; });
      setProfiles(profileMap);
      
      const communityMap: Record<string, CommunityType> = {};
      communitiesRes.data.forEach(c => { communityMap[c.id] = c; });
      
      const enrichedPosts: PostWithRelations[] = postsRes.data.map(post => ({
        ...post,
        author_username: profileMap[post.author_id]?.username,
        author_display_name: profileMap[post.author_id]?.display_name || undefined,
        author_avatar_url: profileMap[post.author_id]?.avatar_url || undefined,
        community_name: communityMap[post.community_id]?.name
      }));
      
      setPosts(enrichedPosts);
      setCommunities(communitiesRes.data);
    }
    setLoading(false);
  };


  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      setPostImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('community-images')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('community-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleCreatePost = async () => {
    if (!user || !newPost.title || !newPost.community_id) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    let imageUrls: string[] = [];
    if (postImage) {
      const url = await uploadImage(postImage);
      if (url) imageUrls = [url];
    }

    const { error } = await supabase
      .from('posts')
      .insert({
        title: newPost.title,
        content: newPost.content,
        community_id: newPost.community_id,
        author_id: user.id,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        type: imageUrls.length > 0 ? 'image' : 'text'
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to create post', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Post created successfully' });
      setCreatePostOpen(false);
      setNewPost({ title: '', content: '', community_id: '' });
      setPostImage(null);
      setPostImagePreview(null);
      fetchData();
    }
  };

  const handleCreateCommunity = async () => {
    if (!user || !newCommunity.name) {
      toast({ title: 'Error', description: 'Please enter a community name', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('communities')
      .insert({
        name: newCommunity.name,
        description: newCommunity.description,
        owner_id: user.id
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to create community', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Community created successfully' });
      setCreateCommunityOpen(false);
      setNewCommunity({ name: '', description: '' });
      fetchData();
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to like posts', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: user.id });

    if (error) {
      if (error.code === '23505') {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      }
    }
    fetchData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community Hub</h1>
          <p className="text-muted-foreground">Connect with fellow anime fans</p>
        </div>
        {user && (
          <div className="flex gap-2">
            <Dialog open={createCommunityOpen} onOpenChange={setCreateCommunityOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  New Community
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Community</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Community name"
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                  />
                  <Button onClick={handleCreateCommunity} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newPost.community_id}
                    onChange={(e) => setNewPost({ ...newPost, community_id: e.target.value })}
                  >
                    <option value="">Select community</option>
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Post title"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  />
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="post-image"
                    />
                    <label htmlFor="post-image">
                      <Button type="button" variant="outline" className="gap-2 cursor-pointer" asChild>
                        <span><ImageIcon className="h-4 w-4" /> Add Image</span>
                      </Button>
                    </label>
                    {postImagePreview && (
                      <div className="relative mt-2">
                        <img src={postImagePreview} alt="Preview" className="max-h-40 rounded-md" />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => { setPostImage(null); setPostImagePreview(null); }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button onClick={handleCreatePost} className="w-full">Post</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feed" className="gap-2"><Clock className="h-4 w-4" /> Latest</TabsTrigger>
              <TabsTrigger value="trending" className="gap-2"><TrendingUp className="h-4 w-4" /> Trending</TabsTrigger>
              <TabsTrigger value="following" className="gap-2"><Users className="h-4 w-4" /> Following</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
              ) : posts.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No posts yet. Be the first to share something!
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.author_avatar_url} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {post.author_username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">
                              {post.author_display_name || post.author_username || 'Anonymous'}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {post.community_name || 'General'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                          </div>
                          <h3 className="font-medium text-foreground mt-1">{post.title}</h3>
                          {post.content && (
                            <p className="text-muted-foreground text-sm mt-1 line-clamp-3">{post.content}</p>
                          )}
                          {post.image_urls && post.image_urls.length > 0 && (
                            <div className="mt-3 rounded-lg overflow-hidden">
                              <img
                                src={post.image_urls[0]}
                                alt="Post image"
                                className="w-full max-h-96 object-cover"
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-muted-foreground hover:text-primary"
                              onClick={() => handleLikePost(post.id)}
                            >
                              <Heart className="h-4 w-4" />
                              {post.likes_count || 0}
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                              <MessageCircle className="h-4 w-4" />
                              {post.comments_count || 0}
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="trending" className="mt-4">
              <Card className="bg-card border-border">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Trending posts coming soon
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="following" className="mt-4">
              <Card className="bg-card border-border">
                <CardContent className="py-8 text-center text-muted-foreground">
                  {user ? 'Follow communities to see their posts here' : 'Sign in to follow communities'}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Popular Communities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {communities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No communities yet</p>
              ) : (
                communities.map((community) => (
                  <div key={community.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={community.icon_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {community.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{community.name}</p>
                      <p className="text-xs text-muted-foreground">{community.member_count || 0} members</p>
                    </div>
                    <Button size="sm" variant="outline">Join</Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {!user && (
            <Card className="bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/20">
              <CardContent className="py-6 text-center">
                <h3 className="font-semibold text-foreground mb-2">Join the Community</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign in to create posts, join communities, and connect with other fans
                </p>
                <Button className="w-full" onClick={() => setSignInOpen(true)}>Sign In</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  );
};

export default CommunityPage;
