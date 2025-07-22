// Shared Gemini client for all Edge Functions
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';
import { GeminiConfig } from './types.ts';

let genAI: GoogleGenerativeAI | null = null;

export function initGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateContent(
  config: GeminiConfig,
  prompt: string
): Promise<string> {
  try {
    const client = initGeminiClient();
    const model = client.getGenerativeModel({ 
      model: config.model,
      generationConfig: {
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxTokens || 2048,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating content with Gemini:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

export function validateGeminiModel(model: string): boolean {
  const validModels = [
    'gemini-2.5-pro',
    'gemini-2.5-pro-preview',
    'gemini-2.5-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash'
  ];
  
  return validModels.some(validModel => model.startsWith(validModel));
}