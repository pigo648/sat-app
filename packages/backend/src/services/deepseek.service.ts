import { config } from '../utils/config.js';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

export async function chat(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${config.deepseek.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.deepseek.apiKey}`,
    },
    body: JSON.stringify({
      model: config.deepseek.model,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`DeepSeek API error: ${res.status} ${error}`);
  }

  const data: DeepSeekResponse = await res.json();
  return data.choices[0]?.message?.content ?? '';
}
