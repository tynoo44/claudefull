-- Add performance indexes for frequently queried columns

-- Note: idx_messages_conversation_id already exists, skipping
-- Note: idx_leads_status already exists, skipping  
-- Note: conversations(lead_id) already has unique index one_convo_per_lead, skipping

-- Add descending index on messages(created_at) for recent message queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);