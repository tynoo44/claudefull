-- Performance optimization indexes for Setter AI
-- Created: 2025-01-20

-- Index for ordering conversations by updated_at (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
ON public.conversations(updated_at DESC);

-- Composite index for efficient unread message queries
-- Covers: conversation_id, sender_type, created_at for WHERE and COUNT operations
CREATE INDEX IF NOT EXISTS idx_messages_unread_query 
ON public.messages(conversation_id, sender_type, created_at DESC);

-- Foreign key index for prompts table (identified by Supabase advisor)
CREATE INDEX IF NOT EXISTS idx_prompts_created_by 
ON public.prompts(created_by);

-- Additional composite index for messages table to speed up latest message lookup
CREATE INDEX IF NOT EXISTS idx_messages_conversation_latest 
ON public.messages(conversation_id, created_at DESC);

-- Index for leads table to optimize status-based queries
CREATE INDEX IF NOT EXISTS idx_leads_updated_at 
ON public.leads(updated_at DESC);

-- Analyze tables to update statistics after creating indexes
ANALYZE public.conversations;
ANALYZE public.messages;
ANALYZE public.leads;
ANALYZE public.prompts;