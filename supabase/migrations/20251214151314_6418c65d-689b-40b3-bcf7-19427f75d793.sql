-- Create friends table for marking users as friends
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their friends" ON public.friends;
CREATE POLICY "Users can view their friends" ON public.friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can add friends" ON public.friends;
CREATE POLICY "Users can add friends" ON public.friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove friends" ON public.friends;
CREATE POLICY "Users can remove friends" ON public.friends
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create message_requests table
CREATE TABLE IF NOT EXISTS public.message_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE public.message_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their message requests" ON public.message_requests;
CREATE POLICY "Users can view their message requests" ON public.message_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send message requests" ON public.message_requests;
CREATE POLICY "Users can send message requests" ON public.message_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their received requests" ON public.message_requests;
CREATE POLICY "Users can update their received requests" ON public.message_requests
  FOR UPDATE USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete their requests" ON public.message_requests;
CREATE POLICY "Users can delete their requests" ON public.message_requests
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);