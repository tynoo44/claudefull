-- Migration: Create RPC for fetching conversations with last message
-- Date: 2025-07-20
-- Purpose: Solve N+1 query problem identified in the audit.

CREATE OR REPLACE FUNCTION get_conversations_with_details_rpc()
RETURNS TABLE (
  -- Columns from 'conversations' table
  id uuid,
  lead_id uuid,
  opened_at timestamptz,
  updated_at timestamptz,
  -- Columns from the last message
  last_message_text text,
  last_message_created_at timestamptz,
  last_message_sender_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.lead_id,
    c.opened_at,
    c.updated_at,
    m.text AS last_message_text,
    m.created_at AS last_message_created_at,
    m.sender_type::text AS last_message_sender_type
  FROM
    conversations c
  LEFT JOIN LATERAL (
    SELECT
      msg.text,
      msg.created_at,
      msg.sender_type
    FROM
      messages msg
    WHERE
      msg.conversation_id = c.id
    ORDER BY
      msg.created_at DESC
    LIMIT 1
  ) m ON true;
END;
$$ LANGUAGE plpgsql;