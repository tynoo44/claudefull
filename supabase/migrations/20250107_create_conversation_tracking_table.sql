-- Migration: Create conversation_tracking table
-- Date: 2025-01-07
-- Purpose: Create auxiliary table for conversation state tracking without modifying existing tables

-- Create conversation_tracking table
CREATE TABLE IF NOT EXISTS conversation_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL UNIQUE,
    current_phase INTEGER DEFAULT 1 CHECK (current_phase >= 1 AND current_phase <= 5),
    qualification_score DECIMAL(3,2) DEFAULT 0.00 CHECK (qualification_score >= 0 AND qualification_score <= 1),
    conversation_state JSONB DEFAULT '{}',
    phase_history JSONB DEFAULT '[]',
    phase_info JSONB DEFAULT '{}',
    last_analysis_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key to conversations table
    CONSTRAINT fk_conversation 
        FOREIGN KEY (conversation_id) 
        REFERENCES conversations(id) 
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_tracking_conversation_id ON conversation_tracking(conversation_id);
CREATE INDEX idx_tracking_current_phase ON conversation_tracking(current_phase);
CREATE INDEX idx_tracking_qualification_score ON conversation_tracking(qualification_score);
CREATE INDEX idx_tracking_updated_at ON conversation_tracking(updated_at);

-- Add trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_tracking_updated_at 
BEFORE UPDATE ON conversation_tracking 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE conversation_tracking IS 'Auxiliary table for tracking conversation state and qualification without modifying main conversations table';
COMMENT ON COLUMN conversation_tracking.conversation_id IS 'Foreign key to conversations table (1:1 relationship)';
COMMENT ON COLUMN conversation_tracking.current_phase IS 'Current sales phase (1: Situación Actual, 2: Dolor, 3: Situación Deseada, 4: Obstáculo, 5: Oferta)';
COMMENT ON COLUMN conversation_tracking.qualification_score IS 'Lead qualification score from 0.0 (low) to 1.0 (high)';
COMMENT ON COLUMN conversation_tracking.conversation_state IS 'Detailed conversation state including collected information';
COMMENT ON COLUMN conversation_tracking.phase_history IS 'Array of phase transitions with timestamps';
COMMENT ON COLUMN conversation_tracking.phase_info IS 'Structured information collected per phase';
COMMENT ON COLUMN conversation_tracking.last_analysis_timestamp IS 'Timestamp of last AI analysis';