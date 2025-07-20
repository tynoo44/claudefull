-- Add conversation tracking columns to conversations table if they don't exist
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS current_phase integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS qualification_score jsonb DEFAULT '{"score": 0, "breakdown": {}}'::jsonb,
ADD COLUMN IF NOT EXISTS conversation_state jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS phase_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS phase_info jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS lead_profile jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS conversation_summary text,
ADD COLUMN IF NOT EXISTS next_steps text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_analysis_timestamp timestamp with time zone DEFAULT now();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_current_phase ON public.conversations(current_phase);
CREATE INDEX IF NOT EXISTS idx_conversations_qualification_score ON public.conversations((qualification_score->>'score')::numeric);

-- Add comment to explain the structure
COMMENT ON COLUMN public.conversations.current_phase IS 'Current sales phase (1-5): 1=Situación Actual, 2=Dolor, 3=Situación Deseada, 4=Obstáculo, 5=Oferta';
COMMENT ON COLUMN public.conversations.qualification_score IS 'JSONB with score (0-1) and breakdown of phase_score, engagement_score, info_completeness';
COMMENT ON COLUMN public.conversations.conversation_state IS 'JSONB tracking conversation metadata like message count, last messages, etc';
COMMENT ON COLUMN public.conversations.phase_history IS 'JSONB array tracking phase transitions with timestamps';
COMMENT ON COLUMN public.conversations.phase_info IS 'JSONB with phase-specific information collected';
COMMENT ON COLUMN public.conversations.lead_profile IS 'JSONB with lead profile information collected during conversation';
COMMENT ON COLUMN public.conversations.conversation_summary IS 'AI-generated summary of the conversation';
COMMENT ON COLUMN public.conversations.next_steps IS 'Array of suggested next actions based on current phase';
COMMENT ON COLUMN public.conversations.last_analysis_timestamp IS 'Last time the conversation was analyzed/updated';