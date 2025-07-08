-- Optimize RLS policies for better performance and coverage

-- Note: RLS is already enabled on all tables, policies exist for authenticated users
-- This migration optimizes the existing setup and adds coverage for edge cases

-- Drop existing generic policies (we'll recreate them with better names and optimizations)
DROP POLICY IF EXISTS "Allow all access for authenticated users on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow all access for authenticated users on conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow all access for authenticated users on messages" ON public.messages;

-- LEADS table policies
-- Separate policies for different operations can be more performant than ALL policies
CREATE POLICY "leads_select_authenticated" ON public.leads
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "leads_insert_authenticated" ON public.leads
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "leads_update_authenticated" ON public.leads
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "leads_delete_authenticated" ON public.leads
    FOR DELETE TO authenticated
    USING (true);

-- CONVERSATIONS table policies
CREATE POLICY "conversations_select_authenticated" ON public.conversations
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "conversations_insert_authenticated" ON public.conversations
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "conversations_update_authenticated" ON public.conversations
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "conversations_delete_authenticated" ON public.conversations
    FOR DELETE TO authenticated
    USING (true);

-- MESSAGES table policies
CREATE POLICY "messages_select_authenticated" ON public.messages
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "messages_insert_authenticated" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "messages_update_authenticated" ON public.messages
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "messages_delete_authenticated" ON public.messages
    FOR DELETE TO authenticated
    USING (true);

-- Add read-only policies for anon role (useful during auth transitions)
-- This prevents errors if the app briefly operates as anon during login/logout
CREATE POLICY "leads_select_anon" ON public.leads
    FOR SELECT TO anon
    USING (false); -- No access for anon users

CREATE POLICY "conversations_select_anon" ON public.conversations
    FOR SELECT TO anon
    USING (false); -- No access for anon users

CREATE POLICY "messages_select_anon" ON public.messages
    FOR SELECT TO anon
    USING (false); -- No access for anon users

-- Add performance-optimized indexes for RLS (if user-based filtering is added later)
-- These are commented out since we're using (true) policies, but ready for future use
-- CREATE INDEX IF NOT EXISTS idx_leads_user_id_status ON public.leads(user_id, status);
-- CREATE INDEX IF NOT EXISTS idx_conversations_lead_id_updated ON public.conversations(lead_id, updated_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);