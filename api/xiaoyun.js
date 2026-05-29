// Vercel serverless function for Xiao Yun AI assistant
// Handles: /api/xiaoyun/plan, /api/xiaoyun/replan, /api/xiaoyun/motivation

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-db7f09fe367f4662a86da262cee9e2a4';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

const PLANNING_SYSTEM_PROMPT = `你是一个名叫"小云"的友好高效的时间管理助手。
你的任务是根据用户描述的任务和可用时间范围，为用户创建一个合理的每日时间表。

核心规则：
1. 每项任务持续时间最多不超过 2 小时（120分钟）。
2. 连续任务块超过 2 小时后，必须插入一个 15 分钟的休息时间。
3. 任务需要按阶段分类：上午（12:00之前）、下午（12:00-17:30）、晚上（17:30之后）。
4. 在 12:10、17:30、22:30 设置阶段结束提醒。
5. 尊重用户的时间范围。不要在开始时间之前或结束时间之后安排任务。
6. 安排任务时考虑优先级（如果有的话）。
7. 尽量均匀分配任务，避免过于密集或松散。

你必须以严格的 JSON 格式回复：
{
  "planName": "方案名称",
  "tasks": [
    { "name": "任务名称", "startTime": "09:00", "endTime": "10:30", "durationMinutes": 90, "phase": "morning", "priority": "high" }
  ],
  "breaks": [
    { "startTime": "10:30", "endTime": "10:45", "label": "休息" }
  ],
  "summary": "简短说明"
}
请只输出 JSON。`;

const REPLAN_SYSTEM_PROMPT = `你是一个名叫"小云"的时间管理助手。用户对之前的方案不满意，需要重新规划。

必须提供至少 3 个不同的备选方案，每个方案要有明确差异：
- 方案1：任务密集在前半段，后半段留出更多自由时间
- 方案2：任务均匀分布，每项任务之间有充足的休息
- 方案3：重要任务放在精力最充沛的时段（上午），其他灵活安排

输出严格的 JSON 数组格式：
[
  { "id": "plan_1", "planName": "...", "tasks": [...], "breaks": [...], "summary": "..." },
  ...
]
请只输出 JSON 数组。`;

const MOTIVATION_SYSTEM_PROMPT = `你是一个励志文案创作助手。根据用户今天完成的任务情况，生成一句简短的励志文案（15-30字），适合放在照片上作为打卡文字。请只输出文案文字。`;

async function callDeepSeek(messages) {
  const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.choices[0]?.message?.content || '';
}

function parseJSON(response) {
  try {
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    return JSON.parse(jsonMatch ? jsonMatch[1] : response);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = req.url.replace('/api/xiaoyun', '');

  try {
    if (path === '/plan' || path === '/plan/') {
      const { tasks, timeRange, constraints } = req.body || {};
      if (!tasks || !timeRange?.start || !timeRange?.end) {
        return res.status(400).json({ error: '请提供任务描述和时间范围' });
      }
      const userPrompt = `用户的任务描述：${tasks}\n可用时间范围：${timeRange.start} 到 ${timeRange.end}\n${constraints ? `额外要求：${constraints}` : ''}\n请为以上任务创建一个合理的时间安排方案。`;
      const response = await callDeepSeek([
        { role: 'system', content: PLANNING_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ]);
      const parsed = parseJSON(response);
      if (!parsed) return res.status(500).json({ error: 'AI 响应格式异常，请重试' });
      const plans = (Array.isArray(parsed) ? parsed : [parsed]).map((p, i) => ({
        id: `plan_${Date.now()}_${i}`,
        ...p,
      }));
      return res.json({ plans, conversationId: `conv_${Date.now()}` });
    }

    if (path === '/replan' || path === '/replan/') {
      const { feedback } = req.body || {};
      if (!feedback) return res.status(400).json({ error: '请提供反馈意见' });
      const userPrompt = `用户对之前的方案不满意，意见是：${feedback}\n请提供至少3个不同的备选方案。`;
      const response = await callDeepSeek([
        { role: 'system', content: REPLAN_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ]);
      const parsed = parseJSON(response);
      if (!parsed) return res.status(500).json({ error: 'AI 响应格式异常，请重试' });
      const plans = (Array.isArray(parsed) ? parsed : [parsed]).map((p, i) => ({
        id: `plan_${Date.now()}_${i}`,
        ...p,
      }));
      return res.json({ plans });
    }

    if (path === '/motivation' || path === '/motivation/') {
      const { context } = req.body || {};
      const userPrompt = `今天完成的日期：${context?.date || '今天'}\n完成的任务：${context?.completedTasks || '各项任务'}\n备注：${context?.notes || '充实的一天'}\n请为以上内容生成一条励志文案。`;
      const response = await callDeepSeek([
        { role: 'system', content: MOTIVATION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ]);
      return res.json({ text: response.trim() });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (e) {
    console.error('[XiaoYun API Error]', e.message);
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
