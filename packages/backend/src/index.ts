import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import { createApp } from './app.js';

const PORT = process.env.PORT || 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(`SAT Backend running on http://localhost:${PORT}`);
  console.log(`DeepSeek API: ${process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'}`);
});
