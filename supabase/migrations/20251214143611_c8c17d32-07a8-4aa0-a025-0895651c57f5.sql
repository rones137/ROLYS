-- Create upvotes table for anime/manga/novels
CREATE TABLE public.upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('anime', 'manga', 'novel', 'user_novel', 'user_manga')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate upvotes
CREATE UNIQUE INDEX upvotes_unique_idx ON public.upvotes (user_id, media_id, media_type);

-- Enable Row Level Security
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Upvotes are viewable by everyone" 
ON public.upvotes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own upvotes" 
ON public.upvotes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own upvotes" 
ON public.upvotes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add upvote_count to novels table
ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0;

-- Add upvote_count to manga table  
ALTER TABLE public.manga ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0;

-- Create function to update upvote counts
CREATE OR REPLACE FUNCTION public.update_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.media_type = 'user_novel' THEN
      UPDATE public.novels SET upvote_count = upvote_count + 1 WHERE id = NEW.media_id::uuid;
    ELSIF NEW.media_type = 'user_manga' THEN
      UPDATE public.manga SET upvote_count = upvote_count + 1 WHERE id = NEW.media_id::uuid;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.media_type = 'user_novel' THEN
      UPDATE public.novels SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = OLD.media_id::uuid;
    ELSIF OLD.media_type = 'user_manga' THEN
      UPDATE public.manga SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = OLD.media_id::uuid;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for upvote count updates
CREATE TRIGGER update_upvote_count_trigger
AFTER INSERT OR DELETE ON public.upvotes
FOR EACH ROW
EXECUTE FUNCTION public.update_upvote_count();