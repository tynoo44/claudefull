-- Migration: Schema Refactor and Cleanup
-- Date: 2025-07-20
-- Purpose: Merge conversation and conversation_memory tables, and remove unused tables.

-- Phase 1: Merge conversation_memory into conversations

-- Step 1.1: Add columns from conversation_memory to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 1 CHECK (current_phase >= 1 AND current_phase <= 5),
ADD COLUMN IF NOT EXISTS qualification_score DECIMAL(3,2) DEFAULT 0.00 CHECK (qualification_score >= 0 AND qualification_score <= 1),
ADD COLUMN IF NOT EXISTS conversation_state JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS phase_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS phase_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_analysis_timestamp TIMESTAMPTZ;

-- Step 1.2: Backfill data from conversation_memory into conversations
-- Note: This assumes a 1:1 relationship exists.
UPDATE public.conversations c
SET
    current_phase = cm.current_phase,
    qualification_score = cm.qualification_score,
    conversation_state = cm.conversation_state,
    phase_history = cm.phase_history,
    phase_info = cm.phase_info,
    last_analysis_timestamp = cm.last_analysis_timestamp
FROM public.conversation_memory cm
WHERE c.id = cm.conversation_id;

-- Step 1.3: Drop the old conversation_memory table
DROP TABLE IF EXISTS public.conversation_memory;

-- Step 1.4: Create new optimized indexes on the conversations table
CREATE INDEX IF NOT EXISTS idx_conversations_current_phase ON public.conversations(current_phase);
CREATE INDEX IF NOT EXISTS idx_conversations_qualification_score ON public.conversations(qualification_score);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);


-- Phase 2: Remove unused tables

-- Step 2.1: Drop objection_handlers table
DROP TABLE IF EXISTS public.objection_handlers;

-- Step 2.2: Drop prompt_analytics table
DROP TABLE IF EXISTS public.prompt_analytics;