import { config } from '../utils/config.js';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  id: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }[];
}

export async function chat(messages: ChatMessage[], useJsonMode = true): Promise<string> {
  const body: Record<string, unknown> = {
    model: config.deepseek.model,
    messages,
    temperature: 0.8,
    max_tokens: 4000,
    top_p: 0.9,
  };

  if (useJsonMode) {
    body.response_format = { type: 'json_object' };
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${config.deepseek.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.deepseek.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`DeepSeek API error: ${res.status} ${error}`);
      }

      const data: DeepSeekResponse = await res.json();
      const content = data.choices[0]?.message?.content ?? '';

      if (!content) {
        throw new Error('AI 返回了空内容');
      }

      return content;
    } catch (e) {
      lastError = e as Error;
      if (attempt === 0) {
        // Retry without JSON mode on second attempt (more flexible)
        delete body.response_format;
        body.temperature = 0.9;
      }
    }
  }

  throw lastError || new Error('AI 服务请求失败');
}
