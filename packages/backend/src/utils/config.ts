export const config = {
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  port: parseInt(process.env.PORT || '3001', 10),
} as const;
