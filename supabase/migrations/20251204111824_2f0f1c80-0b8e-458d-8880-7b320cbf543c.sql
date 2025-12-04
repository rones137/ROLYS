-- Create novels table for the novel editor
CREATE TABLE public.novels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  content JSONB DEFAULT '[]'::jsonb,
  chapters JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_nsfw BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create manga table for the manga editor
CREATE TABLE public.manga (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  pages JSONB DEFAULT '[]'::jsonb,
  chapters JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_nsfw BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes/polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  poll_type TEXT DEFAULT 'single' CHECK (poll_type IN ('single', 'multiple')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'results_after_close')),
  ends_at TIMESTAMP WITH TIME ZONE,
  is_closed BOOLEAN DEFAULT false,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll votes table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id, option_index)
);

-- Create roomins table (sub-communities)
CREATE TABLE public.roomins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  rules TEXT,
  tags TEXT[],
  is_restricted BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Barint chat history table
CREATE TABLE public.barint_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roomins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barint_chats ENABLE ROW LEVEL SECURITY;

-- Novels policies
CREATE POLICY "Published novels are viewable by everyone" ON public.novels
  FOR SELECT USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "Users can create their own novels" ON public.novels
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own novels" ON public.novels
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own novels" ON public.novels
  FOR DELETE USING (auth.uid() = author_id);

-- Manga policies
CREATE POLICY "Published manga are viewable by everyone" ON public.manga
  FOR SELECT USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "Users can create their own manga" ON public.manga
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own manga" ON public.manga
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own manga" ON public.manga
  FOR DELETE USING (auth.uid() = author_id);

-- Polls policies
CREATE POLICY "Public polls are viewable by everyone" ON public.polls
  FOR SELECT USING (visibility = 'public' OR creator_id = auth.uid());

CREATE POLICY "Users can create polls" ON public.polls
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their polls" ON public.polls
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their polls" ON public.polls
  FOR DELETE USING (auth.uid() = creator_id);

-- Poll votes policies
CREATE POLICY "Vote counts are viewable by everyone" ON public.poll_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote on polls" ON public.poll_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their votes" ON public.poll_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Roomins policies
CREATE POLICY "Roomins are viewable by everyone" ON public.roomins
  FOR SELECT USING (true);

CREATE POLICY "Community owners can create roomins" ON public.roomins
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Roomin creators can update" ON public.roomins
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Roomin creators can delete" ON public.roomins
  FOR DELETE USING (auth.uid() = creator_id);

-- Barint chats policies
CREATE POLICY "Users can view their own chats" ON public.barint_chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chats" ON public.barint_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats" ON public.barint_chats
  FOR UPDATE USING (auth.uid() = user_id);

-- Create storage bucket for novel/manga assets
INSERT INTO storage.buckets (id, name, public) VALUES ('creative-assets', 'creative-assets', true);

-- Storage policies for creative assets
CREATE POLICY "Creative assets are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'creative-assets');

CREATE POLICY "Users can upload creative assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'creative-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their creative assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'creative-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their creative assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'creative-assets' AND auth.uid()::text = (storage.foldername(name))[1]);