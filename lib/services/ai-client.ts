// ============================================================================
// SHARED OPENAI JSON-MODE CLIENT
//
// Single place for the OpenAI client + the "send a prompt, get parsed JSON
// back with real token usage" pattern used by every generation/edit service.
// ============================================================================

import OpenAI from 'openai';

export const MODELS = {
  COMPLEX: 'gpt-5.4-mini',
  SIMPLE:  'gpt-5.4-mini',
} as const;

// Carrier type: every AI call returns its data + real token usage for accurate billing
export interface AIResult<T> {
  data: T;
  promptTokens: number;
  completionTokens: number;
}

let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    openai = new OpenAI({ apiKey, maxRetries: 3 });
  }
  return openai;
}

export async function callOpenAIJSON<T>(
  systemPrompt: string,
  userInput: string,
  model: string = MODELS.SIMPLE
): Promise<AIResult<T>> {
  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_completion_tokens: 16384, // hard cap — prevents runaway output costs
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    return {
      data: JSON.parse(responseContent) as T,
      promptTokens:     completion.usage?.prompt_tokens     ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
    };
  } catch (error) {
    console.error('Error in OpenAI call:', error);
    throw new Error(`Failed to generate visualization data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
