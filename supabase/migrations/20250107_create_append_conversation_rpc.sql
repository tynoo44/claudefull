-- Migration: Create RPC function for atomic conversation tracking updates
-- Date: 2025-01-07
-- Purpose: Create function to safely append conversation data and update tracking

-- Create or replace the RPC function
CREATE OR REPLACE FUNCTION append_to_conversation(
    p_conversation_id UUID,
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
    v_tracking_id UUID;
    v_qualification_score DECIMAL(3,2);
    v_phase_changed BOOLEAN := FALSE;
    v_previous_phase INTEGER;
    v_conversation_state JSONB;
    v_phase_history JSONB;
    v_result JSONB;
BEGIN
    -- Start transaction
    BEGIN
        -- Check if tracking record exists, create if not
        SELECT id, current_phase, conversation_state, phase_history 
        INTO v_tracking_id, v_previous_phase, v_conversation_state, v_phase_history
        FROM conversation_tracking 
        WHERE conversation_id = p_conversation_id;
        
        IF v_tracking_id IS NULL THEN
            -- Create new tracking record
            INSERT INTO conversation_tracking (
                conversation_id, 
                current_phase,
                conversation_state,
                phase_history
            ) VALUES (
                p_conversation_id,
                p_current_phase,
                '{}',
                '[]'
            ) RETURNING id INTO v_tracking_id;
            
            v_conversation_state := '{}';
            v_phase_history := '[]';
            v_previous_phase := 1;
        END IF;
        
        -- Check if phase changed
        IF v_previous_phase != p_current_phase THEN
            v_phase_changed := TRUE;
            -- Add phase transition to history
            v_phase_history := v_phase_history || jsonb_build_object(
                'from_phase', v_previous_phase,
                'to_phase', p_current_phase,
                'timestamp', NOW(),
                'trigger_message', p_user_message
            );
        END IF;
        
        -- Update conversation state with new turn
        v_conversation_state := v_conversation_state || jsonb_build_object(
            'last_user_message', p_user_message,
            'last_ai_response', p_ai_response,
            'last_update', NOW(),
            'total_messages', COALESCE((v_conversation_state->>'total_messages')::INTEGER, 0) + 2
        );
        
        -- Calculate qualification score based on phase and engagement
        v_qualification_score := calculate_qualification_score(
            p_current_phase,
            v_conversation_state,
            p_phase_info
        );
        
        -- Update tracking record
        UPDATE conversation_tracking SET
            current_phase = p_current_phase,
            qualification_score = v_qualification_score,
            conversation_state = v_conversation_state,
            phase_history = v_phase_history,
            phase_info = phase_info || p_phase_info,
            last_analysis_timestamp = NOW(),
            updated_at = NOW()
        WHERE id = v_tracking_id;
        
        -- Update conversations table timestamp (safe operation)
        UPDATE conversations 
        SET updated_at = NOW()
        WHERE id = p_conversation_id;
        
        -- Prepare result
        v_result := jsonb_build_object(
            'success', true,
            'tracking_id', v_tracking_id,
            'conversation_id', p_conversation_id,
            'current_phase', p_current_phase,
            'previous_phase', v_previous_phase,
            'phase_changed', v_phase_changed,
            'qualification_score', v_qualification_score,
            'total_messages', (v_conversation_state->>'total_messages')::INTEGER
        );
        
        RETURN v_result;
        
    EXCEPTION WHEN OTHERS THEN
        -- Rollback and return error
        RAISE WARNING 'Error in append_to_conversation: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'conversation_id', p_conversation_id
        );
    END;
END;
$$;

-- Helper function to calculate qualification score
CREATE OR REPLACE FUNCTION calculate_qualification_score(
    p_current_phase INTEGER,
    p_conversation_state JSONB,
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
    v_total_messages INTEGER;
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
    
    -- Engagement score based on message count (30% weight)
    v_total_messages := COALESCE((p_conversation_state->>'total_messages')::INTEGER, 0);
    v_engagement_score := LEAST(v_total_messages::DECIMAL / 20.0 * 0.30, 0.30);
    
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
GRANT EXECUTE ON FUNCTION append_to_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_qualification_score TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION append_to_conversation IS 'Atomically updates conversation tracking with new message turn and phase information';
COMMENT ON FUNCTION calculate_qualification_score IS 'Calculates lead qualification score based on phase progression and collected information';