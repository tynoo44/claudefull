-- Fix duplicate foreign key constraints that are causing Supabase join errors
-- Error: "Could not embed because more than one relationship was found"

-- Drop the duplicate foreign key constraint we added in Task 34
-- Keep the original one (conversations_lead_id_fkey)
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS fk_lead;

-- Also check and fix messages table if needed
-- First, let's check if there are duplicates there too
DO $$
BEGIN
    -- Only drop fk_conversation if it exists AND there's another constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_conversation' 
        AND table_name = 'messages'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_conversation_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE public.messages DROP CONSTRAINT fk_conversation;
    END IF;
END $$;