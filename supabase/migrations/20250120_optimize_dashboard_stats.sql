-- Create optimized RPC for dashboard statistics
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
  total_leads bigint,
  active_conversations bigint,
  total_messages bigint,
  leads_last_7_days bigint,
  leads_last_30_days bigint,
  messages_last_24h bigint,
  messages_last_7_days bigint,
  conversations_by_status jsonb,
  leads_by_procedence jsonb,
  leads_by_status jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      -- Total counts
      (SELECT COUNT(*) FROM leads) as total_leads,
      (SELECT COUNT(*) FROM conversations) as active_conversations,
      (SELECT COUNT(*) FROM messages) as total_messages,
      -- Time-based counts
      (SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '7 days') as leads_last_7_days,
      (SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '30 days') as leads_last_30_days,
      (SELECT COUNT(*) FROM messages WHERE created_at >= NOW() - INTERVAL '24 hours') as messages_last_24h,
      (SELECT COUNT(*) FROM messages WHERE created_at >= NOW() - INTERVAL '7 days') as messages_last_7_days
  ),
  conv_status AS (
    -- Group conversations by lead status
    SELECT jsonb_object_agg(
      COALESCE(l.status, 'Unknown'), 
      count
    ) as conversations_by_status
    FROM (
      SELECT l.status, COUNT(c.id) as count
      FROM conversations c
      LEFT JOIN leads l ON l.id = c.lead_id
      GROUP BY l.status
    ) grouped
  ),
  leads_procedence AS (
    -- Group leads by procedence
    SELECT jsonb_object_agg(
      COALESCE(procedence, 'Unknown'), 
      count
    ) as leads_by_procedence
    FROM (
      SELECT procedence, COUNT(*) as count
      FROM leads
      GROUP BY procedence
    ) grouped
  ),
  leads_status AS (
    -- Group leads by status
    SELECT jsonb_object_agg(
      COALESCE(status, 'Unknown'), 
      count
    ) as leads_by_status
    FROM (
      SELECT status, COUNT(*) as count
      FROM leads
      GROUP BY status
    ) grouped
  )
  SELECT 
    s.total_leads,
    s.active_conversations,
    s.total_messages,
    s.leads_last_7_days,
    s.leads_last_30_days,
    s.messages_last_24h,
    s.messages_last_7_days,
    cs.conversations_by_status,
    lp.leads_by_procedence,
    ls.leads_by_status
  FROM stats s
  CROSS JOIN conv_status cs
  CROSS JOIN leads_procedence lp
  CROSS JOIN leads_status ls;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_dashboard_stats() IS 
'Optimized function to fetch all dashboard statistics in a single query. Eliminates multiple round trips and loading unnecessary data.';