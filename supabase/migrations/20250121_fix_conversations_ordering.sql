-- Fix the conversations loading order by adding proper pagination support

DROP FUNCTION IF EXISTS public.get_conversations_with_details_optimized();

CREATE OR REPLACE FUNCTION public.get_conversations_with_details_optimized(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  lead_id uuid,
  opened_at timestamptz,
  updated_at timestamptz,
  current_phase integer,
  qualification_score jsonb,
  last_message_text text,
  last_message_created_at timestamptz,
  last_message_sender_type text,
  unread_count bigint,
  lead_username text,
  lead_full_name text,
  lead_profile_pic text,
  lead_status text,
  lead_instagram_id text,
  lead_procedence text,
  lead_tags text[],
  lead_notes text,
  lead_followers_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH unread_counts AS (
    -- Pre-aggregate unread counts for all conversations
    SELECT 
      m.conversation_id,
      COUNT(*) FILTER (
        WHERE m.sender_type = 'Lead' 
        AND m.created_at >= NOW() - INTERVAL '24 hours'
      ) as unread_count
    FROM messages m
    GROUP BY m.conversation_id
  ),
  latest_messages AS (
    -- Get latest message for each conversation using DISTINCT ON
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      m.text,
      m.created_at,
      m.sender_type
    FROM messages m
    ORDER BY m.conversation_id, m.created_at DESC
  )
  SELECT
    c.id,
    c.lead_id,
    c.opened_at,
    c.updated_at,
    c.current_phase,
    c.qualification_score,
    lm.text AS last_message_text,
    lm.created_at AS last_message_created_at,
    lm.sender_type::text AS last_message_sender_type,
    COALESCE(uc.unread_count, 0) AS unread_count,
    l.username AS lead_username,
    l.full_name AS lead_full_name,
    l.profile_pic AS lead_profile_pic,
    l.status AS lead_status,
    l.instagram_id AS lead_instagram_id,
    l.procedence AS lead_procedence,
    l.tags AS lead_tags,
    l.notes AS lead_notes,
    l.followers_count AS lead_followers_count
  FROM conversations c
  LEFT JOIN latest_messages lm ON lm.conversation_id = c.id
  LEFT JOIN unread_counts uc ON uc.conversation_id = c.id
  LEFT JOIN leads l ON l.id = c.lead_id
  ORDER BY 
    COALESCE(lm.created_at, c.updated_at) DESC  -- Order by last message time, fallback to updated_at
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_conversations_with_details_optimized(integer, integer) TO authenticated;

-- Update comment
COMMENT ON FUNCTION public.get_conversations_with_details_optimized(integer, integer) IS 
'Optimized function to fetch conversations with complete lead details and message stats in a single query. 
Includes pagination support and orders by most recent activity (last message or update time).
Parameters: p_limit (default 20), p_offset (default 0)';