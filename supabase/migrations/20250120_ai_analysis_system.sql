-- Migration: Sistema de Análisis AI Perfeccionado
-- Fecha: 2025-01-20
-- Descripción: Nuevas tablas para análisis automático, conversaciones AI y insights

-- 1. Tabla para análisis de conversaciones
CREATE TABLE IF NOT EXISTS conversation_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Datos del análisis
  analysis_data JSONB NOT NULL DEFAULT '{}',
  sentiment_scores JSONB NOT NULL DEFAULT '{}', -- Por mensaje y global
  phase_progress JSONB NOT NULL DEFAULT '{}', -- Progreso detallado por fase
  key_insights TEXT[] DEFAULT '{}', -- Insights accionables
  warnings TEXT[] DEFAULT '{}', -- Alertas importantes
  action_threads TEXT[] DEFAULT '{}', -- Hilos de conversación para explotar
  
  -- Métricas calculadas
  urgency_score INTEGER DEFAULT 5 CHECK (urgency_score >= 0 AND urgency_score <= 10),
  capacity_score INTEGER DEFAULT 5 CHECK (capacity_score >= 0 AND capacity_score <= 10),
  engagement_score INTEGER DEFAULT 5 CHECK (engagement_score >= 0 AND engagement_score <= 10),
  
  -- Control
  is_current BOOLEAN DEFAULT true,
  last_message_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_conversation_analysis_conversation ON conversation_analysis(conversation_id);
CREATE INDEX idx_conversation_analysis_lead ON conversation_analysis(lead_id);
CREATE INDEX idx_conversation_analysis_current ON conversation_analysis(is_current) WHERE is_current = true;

-- 2. Tabla para conversaciones con la IA
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Mensajes del chat con la IA
  messages JSONB NOT NULL DEFAULT '[]', -- Array de {role, content, timestamp}
  
  -- Metadata
  total_messages INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_ai_conversations_conversation ON ai_conversations(conversation_id);
CREATE INDEX idx_ai_conversations_lead ON ai_conversations(lead_id);

-- 3. Tabla para insights extraídos automáticamente
CREATE TABLE IF NOT EXISTS lead_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Información del negocio
  business_info JSONB DEFAULT '{}', -- tipo, tamaño, industria, etc
  pain_points TEXT[] DEFAULT '{}', -- Dolores identificados
  goals TEXT[] DEFAULT '{}', -- Objetivos expresados
  obstacles TEXT[] DEFAULT '{}', -- Obstáculos mencionados
  
  -- Perfil de personalidad
  personality_profile JSONB DEFAULT '{}', -- Estilo comunicación, edad, etc
  communication_preferences JSONB DEFAULT '{}', -- Formal/casual, horarios, etc
  
  -- Tags automáticos
  auto_tags TEXT[] DEFAULT '{}',
  
  -- Control
  confidence_score DECIMAL(3,2) DEFAULT 0.5, -- 0-1 confianza en los datos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único por lead
CREATE UNIQUE INDEX idx_lead_insights_lead ON lead_insights(lead_id);

-- 4. Función para marcar análisis antiguos como no actuales
CREATE OR REPLACE FUNCTION mark_old_analysis_not_current()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_analysis
  SET is_current = false
  WHERE conversation_id = NEW.conversation_id
    AND id != NEW.id
    AND is_current = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mantener solo un análisis actual por conversación
CREATE TRIGGER ensure_single_current_analysis
AFTER INSERT ON conversation_analysis
FOR EACH ROW
WHEN (NEW.is_current = true)
EXECUTE FUNCTION mark_old_analysis_not_current();

-- 5. Función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_conversation_analysis_updated_at
BEFORE UPDATE ON conversation_analysis
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON ai_conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_insights_updated_at
BEFORE UPDATE ON lead_insights
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. Vista para obtener el análisis más reciente con datos del lead
CREATE OR REPLACE VIEW current_conversation_analysis AS
SELECT 
  ca.*,
  l.username,
  l.full_name,
  l.procedence,
  c.current_phase,
  c.qualification_score
FROM conversation_analysis ca
JOIN conversations c ON ca.conversation_id = c.id
JOIN leads l ON ca.lead_id = l.id
WHERE ca.is_current = true;

-- 7. Función RPC para obtener conversaciones que necesitan análisis
CREATE OR REPLACE FUNCTION get_conversations_needing_analysis()
RETURNS TABLE (
  conversation_id UUID,
  lead_id UUID,
  last_message_at TIMESTAMPTZ,
  last_analysis_at TIMESTAMPTZ,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    SELECT 
      m.conversation_id,
      MAX(m.created_at) as last_message_at
    FROM messages m
    WHERE m.sender_type = 'lead'
    GROUP BY m.conversation_id
  ),
  latest_analysis AS (
    SELECT 
      ca.conversation_id,
      MAX(ca.created_at) as last_analysis_at
    FROM conversation_analysis ca
    WHERE ca.is_current = true
    GROUP BY ca.conversation_id
  )
  SELECT 
    lm.conversation_id,
    c.lead_id,
    lm.last_message_at,
    la.last_analysis_at,
    CASE 
      WHEN la.last_analysis_at IS NULL THEN 1
      WHEN lm.last_message_at > la.last_analysis_at + INTERVAL '2 minutes' THEN 2
      ELSE 3
    END as priority
  FROM latest_messages lm
  JOIN conversations c ON lm.conversation_id = c.id
  LEFT JOIN latest_analysis la ON lm.conversation_id = la.conversation_id
  WHERE la.last_analysis_at IS NULL 
     OR lm.last_message_at > la.last_analysis_at + INTERVAL '2 minutes'
  ORDER BY priority, lm.last_message_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Políticas de seguridad RLS
ALTER TABLE conversation_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_insights ENABLE ROW LEVEL SECURITY;

-- Políticas para conversation_analysis
CREATE POLICY "Users can view their own conversation analysis" ON conversation_analysis
  FOR SELECT USING (lead_id IN (
    SELECT id FROM leads WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create analysis for their conversations" ON conversation_analysis
  FOR INSERT WITH CHECK (lead_id IN (
    SELECT id FROM leads WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own analysis" ON conversation_analysis
  FOR UPDATE USING (lead_id IN (
    SELECT id FROM leads WHERE user_id = auth.uid()
  ));

-- Políticas para ai_conversations
CREATE POLICY "Users can view their own AI conversations" ON ai_conversations
  FOR SELECT USING (lead_id IN (
    SELECT id FROM leads WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create AI conversations" ON ai_conversations
  FOR INSERT WITH CHECK (lead_id IN (
    SELECT id FROM leads WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own AI conversations" ON ai_conversations
  FOR UPDATE USING (lead_id IN (
    SELECT id FROM leads WHERE user_id = auth.uid()
  ));

-- Políticas para lead_insights
CREATE POLICY "Users can view their own lead insights" ON lead_insights
  FOR SELECT USING (lead_id IN (
    SELECT id FROM leads WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create lead insights" ON lead_insights
  FOR INSERT WITH CHECK (lead_id IN (
    SELECT id FROM leads WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own lead insights" ON lead_insights
  FOR UPDATE USING (lead_id IN (
    SELECT id FROM leads WHERE user_id = auth.uid()
  ));

-- Comentarios para documentación
COMMENT ON TABLE conversation_analysis IS 'Almacena análisis automáticos de conversaciones con IA';
COMMENT ON TABLE ai_conversations IS 'Historial de conversaciones entre el setter y la IA asistente';
COMMENT ON TABLE lead_insights IS 'Información extraída automáticamente sobre cada lead';
COMMENT ON COLUMN conversation_analysis.analysis_data IS 'Análisis completo en formato JSON';
COMMENT ON COLUMN conversation_analysis.sentiment_scores IS 'Puntuaciones de sentimiento por mensaje y global';
COMMENT ON COLUMN conversation_analysis.phase_progress IS 'Información detallada del progreso en cada fase';