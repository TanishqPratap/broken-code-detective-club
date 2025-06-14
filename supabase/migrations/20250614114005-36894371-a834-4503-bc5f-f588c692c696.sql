
-- Enable Row Level Security for the messages table, just in case
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- POLICY: Allow users to view messages in their own conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- POLICY: Allow users to send messages as themselves
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
);

-- POLICY: Allow users to update their own messages
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- POLICY: Allow users to delete messages they are part of
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON public.messages;
CREATE POLICY "Users can delete messages in their conversations"
ON public.messages
FOR DELETE
USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- RPC FUNCTION: Securely clear chat between two users
CREATE OR REPLACE FUNCTION public.clear_chat(user1_id uuid, user2_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if the user calling the function is one of the participants
  IF auth.uid() = user1_id OR auth.uid() = user2_id THEN
    DELETE FROM public.messages
    WHERE (sender_id = user1_id AND recipient_id = user2_id)
       OR (sender_id = user2_id AND recipient_id = user1_id);
  ELSE
    RAISE EXCEPTION 'You are not authorized to clear this chat';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
