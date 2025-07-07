import { supabase } from './supabase';

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
  explanation?: string;
}

export interface PromptComponents {
  basePrompt: Prompt | null;
  scriptTemplates: ScriptTemplate[];
  fewShotExamples: FewShotExample[];
  conversationContext?: string;
  currentPhase?: number;
}

export class PromptManager {
  private promptCache: Map<string, Prompt> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  // Fetch active base prompt by type with caching
  async getActivePrompt(promptType: string): Promise<Prompt | null> {
    // Check cache first
    const cacheKey = `prompt_${promptType}`;
    const cached = this.promptCache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('prompt_type', promptType)
      .eq('active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching prompt:', error);
      return null;
    }

    // Cache the result
    if (data) {
      this.promptCache.set(cacheKey, data);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
    }

    return data;
  }

  // Fetch script templates for a specific phase
  async getScriptTemplates(phase: number, leadType?: string): Promise<ScriptTemplate[]> {
    let query = supabase
      .from('script_templates')
      .select('*')
      .eq('phase', phase)
      .eq('active', true)
      .order('priority', { ascending: false });

    if (leadType) {
      query = query.or(`lead_type.eq.${leadType},lead_type.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching script templates:', error);
      return [];
    }

    return data || [];
  }

  // Fetch few-shot examples for a phase
  async getFewShotExamples(phase: number, limit: number = 3): Promise<FewShotExample[]> {
    const { data, error } = await supabase
      .from('few_shot_examples')
      .select('*')
      .eq('phase', phase)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching few-shot examples:', error);
      return [];
    }

    return data || [];
  }

  // Build hierarchical prompt structure
  async buildPromptComponents(
    promptType: string,
    currentPhase?: number,
    leadType?: string,
    conversationContext?: string
  ): Promise<PromptComponents> {
    const [basePrompt, scriptTemplates, fewShotExamples] = await Promise.all([
      this.getActivePrompt(promptType),
      currentPhase ? this.getScriptTemplates(currentPhase, leadType) : Promise.resolve([]),
      currentPhase ? this.getFewShotExamples(currentPhase) : Promise.resolve([])
    ]);

    return {
      basePrompt,
      scriptTemplates,
      fewShotExamples,
      conversationContext,
      currentPhase
    };
  }

  // Format few-shot examples for prompt
  formatFewShotExamples(examples: FewShotExample[]): string {
    if (examples.length === 0) return '';

    return examples.map((example, index) => `
Ejemplo ${index + 1}:
Lead: ${example.example_input}
Setter: ${example.example_output}
${example.explanation ? `Nota: ${example.explanation}` : ''}
`).join('\n');
  }

  // Format script templates for prompt
  formatScriptTemplates(templates: ScriptTemplate[]): string {
    if (templates.length === 0) return '';

    return templates.map(template => `
Tipo: ${template.template_type}
${template.lead_type ? `Para leads de: ${template.lead_type}` : ''}
Template: ${template.content}
${template.example_usage ? `Uso: ${template.example_usage}` : ''}
`).join('\n');
  }

  // Replace variables in templates
  replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
    });
    return result;
  }

  // Clear cache method
  clearCache(): void {
    this.promptCache.clear();
    this.cacheExpiry.clear();
  }

  // Detect current phase from conversation
  detectCurrentPhase(messages: Array<{ role: string; content: string }>): number {
    if (!messages || messages.length === 0) return 1;

    const lastMessages = messages.slice(-10); // Analyze last 10 messages
    const conversation = lastMessages.map(m => m.content.toLowerCase()).join(' ');

    // Phase detection patterns
    if (conversation.includes('llamada') || conversation.includes('agendar') || conversation.includes('calendario')) {
      return 5; // Offer phase
    }
    if (conversation.includes('qué te impide') || conversation.includes('obstáculo') || conversation.includes('barrera')) {
      return 4; // Obstacle phase
    }
    if (conversation.includes('objetivo') || conversation.includes('lograr') || conversation.includes('conseguir')) {
      return 3; // Desired situation
    }
    if (conversation.includes('problema') || conversation.includes('frustración') || conversation.includes('dolor')) {
      return 2; // Pain phase
    }
    
    return 1; // Default to initial phase
  }
}

export const promptManager = new PromptManager();