// Shared database client for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

let supabaseClient: any = null;

export function initSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not set');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseClient;
}

// Database interfaces for Edge Functions
export interface Prompt {
  id: string;
  prompt_type: string;
  version: number;
  role_definition?: string;
  system_instructions?: string;
  content: string;
  active: boolean;
  performance_score: number;
}

export interface ScriptTemplate {
  id: string;
  phase: number;
  template_type: string;
  lead_type?: string;
  content: string;
  variables: string[];
  example_usage?: string;
  priority: number;
  active: boolean;
}

export interface FewShotExample {
  id: string;
  phase: number;
  scenario_type: string;
  example_input: string;
  example_output: string;
  context?: string;
  active: boolean;
}

// Prompt building functionality for Edge Functions
export class EdgePromptManager {
  private supabase: any;

  constructor() {
    this.supabase = initSupabaseClient();
  }

  async buildPromptComponents(
    promptType: string,
    phase?: number,
    leadType?: string,
    conversationContext?: any
  ) {
    try {
      // Get base prompt
      const { data: basePrompt } = await this.supabase
        .from('prompts')
        .select('*')
        .eq('prompt_type', promptType)
        .eq('active', true)
        .order('performance_score', { ascending: false })
        .limit(1)
        .single();

      // Get script templates if phase is specified
      let scriptTemplates: ScriptTemplate[] = [];
      if (phase && phase >= 1 && phase <= 5) {
        const { data } = await this.supabase
          .from('script_templates')
          .select('*')
          .eq('phase', phase)
          .eq('active', true)
          .order('priority', { ascending: false });
        
        scriptTemplates = data || [];
      }

      // Get few-shot examples if phase is specified
      let fewShotExamples: FewShotExample[] = [];
      if (phase && phase >= 1 && phase <= 5) {
        const { data } = await this.supabase
          .from('few_shot_examples')
          .select('*')
          .eq('phase', phase)
          .eq('active', true)
          .limit(3);
        
        fewShotExamples = data || [];
      }

      return {
        basePrompt,
        scriptTemplates,
        fewShotExamples,
      };
    } catch (error) {
      console.error('Error building prompt components:', error);
      return {
        basePrompt: null,
        scriptTemplates: [],
        fewShotExamples: [],
      };
    }
  }

  formatScriptTemplates(templates: ScriptTemplate[]): string {
    return templates
      .map((template) => `- ${template.content}`)
      .join('\n');
  }

  formatFewShotExamples(examples: FewShotExample[]): string {
    return examples
      .map((example) => `Lead: ${example.example_input}\nSetter: ${example.example_output}`)
      .join('\n\n');
  }

  detectCurrentPhase(messages: any[]): number {
    // Simple phase detection logic
    if (messages.length === 0) return 1;
    
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
    const allText = userMessages.join(' ');

    // Phase keywords detection
    if (allText.includes('reunion') || allText.includes('llamada') || allText.includes('hablar')) {
      return 5; // Offer phase
    }
    if (allText.includes('problema') || allText.includes('frustra') || allText.includes('dificulta')) {
      return 2; // Pain phase
    }
    if (allText.includes('quiero') || allText.includes('objetivo') || allText.includes('lograr')) {
      return 3; // Desired situation
    }
    if (allText.includes('pero') || allText.includes('sin embargo') || allText.includes('no puedo')) {
      return 4; // Obstacle phase
    }
    
    return Math.min(Math.floor(messages.length / 4) + 1, 5);
  }
}

// Conversation state management
export async function updateConversationState(params: {
  conversationId: string;
  leadId: string;
  userMessage: string;
  aiResponse: string;
  currentPhase: number;
  phaseInfo?: any;
  detectedIntent?: string;
}) {
  try {
    const supabase = initSupabaseClient();
    
    const { data, error } = await supabase.rpc('update_conversation_state', {
      p_conversation_id: params.conversationId,
      p_lead_id: params.leadId,
      p_user_message: params.userMessage,
      p_ai_response: params.aiResponse,
      p_current_phase: params.currentPhase,
      p_phase_info: params.phaseInfo || {},
      p_detected_intent: params.detectedIntent || 'general_response',
    });

    if (error) {
      console.error('Error updating conversation state:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      current_phase: data?.current_phase,
      qualification_score: data?.qualification_score,
      phase_changed: data?.phase_changed,
    };
  } catch (error) {
    console.error('Error in updateConversationState:', error);
    return { success: false, error: error.message };
  }
}