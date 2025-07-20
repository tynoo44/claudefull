-- Add indexes for message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at DESC);

-- Create optimized RPC for loading messages with pagination
CREATE OR REPLACE FUNCTION public.get_messages_paginated(
  p_conversation_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  sender_type text,
  text text,
  platform_message_id text,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_count bigint;
BEGIN
  -- Get total count of messages for this conversation
  SELECT COUNT(*) INTO v_total_count
  FROM messages m
  WHERE m.conversation_id = p_conversation_id;

  -- Return paginated messages with total count
  RETURN QUERY
  SELECT 
    m.id,
    m.conversation_id,
    m.sender_type,
    m.text,
    m.platform_message_id,
    m.created_at,
    v_total_count as total_count
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_messages_paginated(uuid, integer, integer) TO authenticated;

-- Create optimized RPC for initial message load (latest messages first)
CREATE OR REPLACE FUNCTION public.get_initial_messages(
  p_conversation_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  sender_type text,
  text text,
  platform_message_id text,
  created_at timestamptz,
  total_count bigint,
  has_more boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_count bigint;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO v_total_count
  FROM messages m
  WHERE m.conversation_id = p_conversation_id;

  -- Return latest messages in chronological order
  RETURN QUERY
  WITH latest_messages AS (
    SELECT 
      m.id,
      m.conversation_id,
      m.sender_type,
      m.text,
      m.platform_message_id,
      m.created_at
    FROM messages m
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.created_at DESC
    LIMIT p_limit
  )
  SELECT 
    lm.*,
    v_total_count as total_count,
    (v_total_count > p_limit) as has_more
  FROM latest_messages lm
  ORDER BY lm.created_at ASC; -- Return in chronological order for display
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_initial_messages(uuid, integer) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_initial_messages(uuid, integer) IS 
'Optimized function to load initial messages for a conversation. Returns latest N messages in chronological order with metadata about total count and pagination.';

COMMENT ON FUNCTION public.get_messages_paginated(uuid, integer, integer) IS 
'Paginated message loading for infinite scroll. Returns messages in reverse chronological order (latest first) with total count.';