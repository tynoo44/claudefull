-- Migration: Update RPC functions to use existing conversation_memory table
-- Date: 2025-01-07
-- Purpose: Replace conversation_tracking functions with conversation_memory compatible versions

-- Drop old functions if they exist
DROP FUNCTION IF EXISTS append_to_conversation(UUID, TEXT, TEXT, INTEGER, JSONB, TEXT);
DROP FUNCTION IF EXISTS calculate_qualification_score(INTEGER, JSONB, JSONB);

-- Create new function to work with conversation_memory table
CREATE OR REPLACE FUNCTION append_to_conversation_memory(
    p_conversation_id UUID,
    p_lead_id UUID,
    p_user_message TEXT,
    p_ai_response TEXT,
    p_current_phase INTEGER,
    p_phase_info JSONB DEFAULT '{}',
    p_detected_intent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_memory_id UUID;
    v_qualification_score JSONB;
    v_lead_profile JSONB;
    v_conversation_summary TEXT;
    v_previous_phase INTEGER;
    v_phase_changed BOOLEAN := FALSE;
    v_result JSONB;
    v_score_value DECIMAL(3,2);
BEGIN
    -- Start transaction
    BEGIN
        -- Check if memory record exists
        SELECT id, current_phase, lead_profile, qualification_score, conversation_summary
        INTO v_memory_id, v_previous_phase, v_lead_profile, v_qualification_score, v_conversation_summary
        FROM conversation_memory 
        WHERE conversation_id = p_conversation_id OR lead_id = p_lead_id;
        
        IF v_memory_id IS NULL THEN
            -- Create new memory record
            v_lead_profile := '{}';
            v_qualification_score := '{"score": 0.0, "breakdown": {}}';
            v_previous_phase := 1;
            
            INSERT INTO conversation_memory (
                lead_id,
                conversation_id, 
                current_phase,
                lead_profile,
                qualification_score,
                conversation_summary,
                last_interaction
            ) VALUES (
                p_lead_id,
                p_conversation_id,
                p_current_phase,
                v_lead_profile,
                v_qualification_score,
                CONCAT('Conversación iniciada. Usuario: "', LEFT(p_user_message, 100), '"'),
                NOW()
            ) RETURNING id INTO v_memory_id;
        END IF;
        
        -- Check if phase changed
        IF v_previous_phase != p_current_phase THEN
            v_phase_changed := TRUE;
        END IF;
        
        -- Calculate qualification score
        v_score_value := calculate_conversation_qualification_score(
            p_current_phase,
            LENGTH(p_user_message || p_ai_response),
            p_phase_info
        );
        
        -- Update qualification score structure
        v_qualification_score := jsonb_build_object(
            'score', v_score_value,
            'breakdown', jsonb_build_object(
                'phase_score', CASE p_current_phase
                    WHEN 1 THEN 0.10  -- Situación Actual
                    WHEN 2 THEN 0.25  -- Dolor
                    WHEN 3 THEN 0.40  -- Situación Deseada
                    WHEN 4 THEN 0.60  -- Obstáculo
                    WHEN 5 THEN 0.80  -- Oferta
                    ELSE 0.05
                END,
                'engagement_score', LEAST(LENGTH(p_user_message || p_ai_response)::DECIMAL / 500.0 * 0.30, 0.30),
                'info_completeness', CASE 
                    WHEN jsonb_array_length(jsonb_object_keys(p_phase_info)) > 0 THEN
                        LEAST(jsonb_array_length(jsonb_object_keys(p_phase_info))::DECIMAL / 10.0 * 0.30, 0.30)
                    ELSE 0.0
                END
            ),
            'last_update', NOW()
        );
        
        -- Update lead profile with phase info
        v_lead_profile := v_lead_profile || p_phase_info;
        
        -- Update conversation summary
        v_conversation_summary := CONCAT(
            COALESCE(v_conversation_summary, ''),
            E'\n[Fase ', p_current_phase, '] Usuario: "', LEFT(p_user_message, 150), '"',
            E'\nIA: "', LEFT(p_ai_response, 150), '"'
        );
        
        -- Update memory record
        UPDATE conversation_memory SET
            conversation_id = COALESCE(conversation_id, p_conversation_id),
            current_phase = p_current_phase,
            lead_profile = v_lead_profile,
            qualification_score = v_qualification_score,
            conversation_summary = v_conversation_summary,
            last_interaction = NOW(),
            updated_at = NOW()
        WHERE id = v_memory_id;
        
        -- Update conversations table if it exists
        UPDATE conversations 
        SET updated_at = NOW()
        WHERE id = p_conversation_id;
        
        -- Prepare result
        v_result := jsonb_build_object(
            'success', true,
            'memory_id', v_memory_id,
            'conversation_id', p_conversation_id,
            'lead_id', p_lead_id,
            'current_phase', p_current_phase,
            'previous_phase', v_previous_phase,
            'phase_changed', v_phase_changed,
            'qualification_score', v_score_value,
            'score_breakdown', v_qualification_score->'breakdown'
        );
        
        RETURN v_result;
        
    EXCEPTION WHEN OTHERS THEN
        -- Rollback and return error
        RAISE WARNING 'Error in append_to_conversation_memory: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'conversation_id', p_conversation_id,
            'lead_id', p_lead_id
        );
    END;
END;
$$;

-- Helper function to calculate qualification score
CREATE OR REPLACE FUNCTION calculate_conversation_qualification_score(
    p_current_phase INTEGER,
    p_content_length INTEGER,
    p_phase_info JSONB
)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_base_score DECIMAL(3,2) := 0.0;
    v_engagement_score DECIMAL(3,2) := 0.0;
    v_info_score DECIMAL(3,2) := 0.0;
BEGIN
    -- Base score by phase (40% weight)
    v_base_score := CASE p_current_phase
        WHEN 1 THEN 0.10  -- Situación Actual
        WHEN 2 THEN 0.25  -- Dolor
        WHEN 3 THEN 0.40  -- Situación Deseada
        WHEN 4 THEN 0.60  -- Obstáculo
        WHEN 5 THEN 0.80  -- Oferta
        ELSE 0.05
    END;
    
    -- Engagement score based on content length (30% weight)
    v_engagement_score := LEAST(p_content_length::DECIMAL / 500.0 * 0.30, 0.30);
    
    -- Information completeness score (30% weight)
    -- Count non-null fields in phase_info
    v_info_score := CASE 
        WHEN jsonb_array_length(jsonb_object_keys(p_phase_info)) > 0 THEN
            LEAST(jsonb_array_length(jsonb_object_keys(p_phase_info))::DECIMAL / 10.0 * 0.30, 0.30)
        ELSE 0.0
    END;
    
    -- Calculate total score
    RETURN LEAST(v_base_score + v_engagement_score + v_info_score, 1.0);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION append_to_conversation_memory TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_conversation_qualification_score TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION append_to_conversation_memory IS 'Updates conversation memory with new message turn and phase information using existing conversation_memory table';
COMMENT ON FUNCTION calculate_conversation_qualification_score IS 'Calculates lead qualification score for conversation_memory table format';