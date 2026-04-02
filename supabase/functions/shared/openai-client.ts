// Shared OpenAI client for all Edge Functions

export interface OpenAIConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

let cachedApiKey: string | null = null;

export function getOpenAIKey(): string {
  if (!cachedApiKey) {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    cachedApiKey = apiKey;
  }
  return cachedApiKey;
}

export async function chatCompletion(
  messages: ChatMessage[],
  config: OpenAIConfig,
): Promise<string> {
  const apiKey = getOpenAIKey();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export function validateModel(model: string): boolean {
  const validModels = ['gpt-5.4', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];
  return validModels.some(valid => model.startsWith(valid));
}
