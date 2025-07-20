-- Create RPC function to update conversation details
CREATE OR REPLACE FUNCTION public.update_conversation_details(
  p_conversation_id uuid,
  p_lead_id uuid,
  p_user_message text,
  p_ai_response text,
  p_current_phase integer,
  p_phase_info jsonb DEFAULT '{}'::jsonb,
  p_detected_intent text DEFAULT NULL
)
RETURNS TABLE (
  success boolean,
  memory_id uuid,
  conversation_id uuid,
  lead_id uuid,
  current_phase integer,
  previous_phase integer,
  phase_changed boolean,
  qualification_score numeric,
  score_breakdown jsonb,
  error text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_previous_phase integer;
  v_phase_score numeric;
  v_engagement_score numeric;
  v_info_completeness numeric;
  v_qualification_score numeric;
  v_conversation_state jsonb;
  v_phase_history jsonb;
  v_lead_profile jsonb;
  v_next_steps text[];
  v_conversation_summary text;
BEGIN
  -- Get current conversation data
  SELECT 
    COALESCE(c.current_phase, 1),
    COALESCE(c.conversation_state, '{}'::jsonb),
    COALESCE(c.phase_history, '[]'::jsonb),
    COALESCE(c.lead_profile, '{}'::jsonb)
  INTO 
    v_previous_phase,
    v_conversation_state,
    v_phase_history,
    v_lead_profile
  FROM conversations c
  WHERE c.id = p_conversation_id;

  -- Check if conversation exists
  IF v_previous_phase IS NULL THEN
    -- Initialize new conversation
    v_previous_phase := 1;
    v_conversation_state := '{}'::jsonb;
    v_phase_history := '[]'::jsonb;
    v_lead_profile := '{}'::jsonb;
  END IF;

  -- Update conversation state
  v_conversation_state := v_conversation_state || jsonb_build_object(
    'last_user_message', p_user_message,
    'last_ai_response', p_ai_response,
    'last_update', now()::text,
    'total_messages', COALESCE((v_conversation_state->>'total_messages')::integer, 0) + 1
  );

  -- Update phase history if phase changed
  IF p_current_phase != v_previous_phase THEN
    v_phase_history := v_phase_history || jsonb_build_array(
      jsonb_build_object(
        'from_phase', v_previous_phase,
        'to_phase', p_current_phase,
        'timestamp', now()::text,
        'reason', p_detected_intent
      )
    );
  END IF;

  -- Calculate qualification scores
  -- Phase score (progress through sales phases)
  v_phase_score := LEAST(p_current_phase / 5.0, 1.0);

  -- Engagement score (based on message count and phase progress)
  v_engagement_score := CASE 
    WHEN (v_conversation_state->>'total_messages')::integer > 20 THEN 1.0
    WHEN (v_conversation_state->>'total_messages')::integer > 10 THEN 0.8
    WHEN (v_conversation_state->>'total_messages')::integer > 5 THEN 0.6
    ELSE 0.4
  END;

  -- Info completeness (check if we have key information)
  v_info_completeness := 0.0;
  IF v_lead_profile->>'current_situation' IS NOT NULL THEN
    v_info_completeness := v_info_completeness + 0.25;
  END IF;
  IF v_lead_profile->>'pain_points' IS NOT NULL THEN
    v_info_completeness := v_info_completeness + 0.25;
  END IF;
  IF v_lead_profile->>'desired_situation' IS NOT NULL THEN
    v_info_completeness := v_info_completeness + 0.25;
  END IF;
  IF v_lead_profile->>'obstacles' IS NOT NULL THEN
    v_info_completeness := v_info_completeness + 0.25;
  END IF;

  -- Overall qualification score
  v_qualification_score := (v_phase_score * 0.4) + (v_engagement_score * 0.3) + (v_info_completeness * 0.3);

  -- Generate next steps based on current phase
  v_next_steps := CASE p_current_phase
    WHEN 1 THEN ARRAY['Identificar situación actual del lead', 'Establecer rapport y confianza']
    WHEN 2 THEN ARRAY['Profundizar en los puntos de dolor', 'Cuantificar el impacto del problema']
    WHEN 3 THEN ARRAY['Explorar la situación deseada', 'Confirmar objetivos del lead']
    WHEN 4 THEN ARRAY['Identificar obstáculos específicos', 'Presentar cómo podemos ayudar']
    WHEN 5 THEN ARRAY['Presentar la oferta', 'Agendar llamada de cierre']
    ELSE ARRAY['Hacer seguimiento', 'Mantener la relación']
  END;

  -- Generate conversation summary
  v_conversation_summary := format(
    'Conversación en fase %s con %s mensajes intercambiados. Score de cualificación: %s%%',
    p_current_phase,
    COALESCE((v_conversation_state->>'total_messages')::integer, 0),
    round(v_qualification_score * 100)
  );

  -- Update or insert conversation record
  INSERT INTO conversations (
    id,
    lead_id,
    opened_at,
    updated_at,
    current_phase,
    qualification_score,
    conversation_state,
    phase_history,
    phase_info,
    lead_profile,
    conversation_summary,
    next_steps,
    last_analysis_timestamp
  ) VALUES (
    p_conversation_id,
    p_lead_id,
    now(),
    now(),
    p_current_phase,
    jsonb_build_object(
      'score', v_qualification_score,
      'breakdown', jsonb_build_object(
        'phase_score', v_phase_score,
        'engagement_score', v_engagement_score,
        'info_completeness', v_info_completeness
      )
    ),
    v_conversation_state,
    v_phase_history,
    p_phase_info,
    v_lead_profile,
    v_conversation_summary,
    v_next_steps,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = now(),
    current_phase = EXCLUDED.current_phase,
    qualification_score = EXCLUDED.qualification_score,
    conversation_state = EXCLUDED.conversation_state,
    phase_history = EXCLUDED.phase_history,
    phase_info = conversations.phase_info || EXCLUDED.phase_info, -- Merge phase info
    lead_profile = conversations.lead_profile || EXCLUDED.lead_profile, -- Merge lead profile
    conversation_summary = EXCLUDED.conversation_summary,
    next_steps = EXCLUDED.next_steps,
    last_analysis_timestamp = EXCLUDED.last_analysis_timestamp;

  -- Return result
  RETURN QUERY
  SELECT 
    true as success,
    p_conversation_id as memory_id,
    p_conversation_id as conversation_id,
    p_lead_id as lead_id,
    p_current_phase as current_phase,
    v_previous_phase as previous_phase,
    (p_current_phase != v_previous_phase) as phase_changed,
    v_qualification_score as qualification_score,
    jsonb_build_object(
      'phase_score', v_phase_score,
      'engagement_score', v_engagement_score,
      'info_completeness', v_info_completeness
    ) as score_breakdown,
    NULL::text as error;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY
    SELECT 
      false as success,
      NULL::uuid as memory_id,
      p_conversation_id as conversation_id,
      p_lead_id as lead_id,
      p_current_phase as current_phase,
      v_previous_phase as previous_phase,
      false as phase_changed,
      0.0 as qualification_score,
      NULL::jsonb as score_breakdown,
      SQLERRM as error;
END;
$$;