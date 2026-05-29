import { Router } from 'express';
import { chat } from '../services/deepseek.service.js';
import { PLANNING_SYSTEM_PROMPT, REPLAN_SYSTEM_PROMPT, MOTIVATION_SYSTEM_PROMPT } from '../services/prompt.service.js';
import rateLimit from 'express-rate-limit';

export const xiaoyunRouter = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: '请求太频繁，请稍等片刻再试' },
});

xiaoyunRouter.use(aiLimiter);

function extractJSON(text: string): unknown {
  // Try direct parse first
  try { return JSON.parse(text); } catch { /* continue */ }

  // Try markdown code block
  const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (m) {
    try { return JSON.parse(m[1]); } catch { /* continue */ }
  }

  // Try to find JSON array or object boundaries
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]); } catch { /* continue */ }
  }

  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch { /* continue */ }
  }

  return null;
}

// POST /api/xiaoyun/plan
xiaoyunRouter.post('/plan', async (req, res, next) => {
  try {
    const { tasks, timeRange, constraints } = req.body;

    if (!tasks || !timeRange?.start || !timeRange?.end) {
      return res.status(400).json({ error: '请提供任务描述和时间范围' });
    }

    const userPrompt = `用户描述了以下任务：${tasks}
可用时间：${timeRange.start} 到 ${timeRange.end}
${constraints ? `额外要求：${constraints}` : ''}
请为以上内容创建一个合理的时间安排方案。`;

    const response = await chat([
      { role: 'system', content: PLANNING_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);

    const parsed = extractJSON(response);

    if (!parsed) {
      return res.status(500).json({ error: 'AI 响应格式异常，请稍后重试' });
    }

    const plans = (Array.isArray(parsed) ? parsed : [parsed]).map((p: Record<string, unknown>, i: number) => ({
      id: `plan_${Date.now()}_${i}`,
      ...p,
    }));

    res.json({
      plans,
      conversationId: `conv_${Date.now()}`,
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/xiaoyun/replan
xiaoyunRouter.post('/replan', async (req, res, next) => {
  try {
    const { feedback, conversationId } = req.body;

    if (!feedback) {
      return res.status(400).json({ error: '请提供反馈意见' });
    }

    const userPrompt = `用户对之前的方案不太满意，具体意见是：${feedback}
请务必提供至少3个有差异的备选方案，每个方案都要有不同的任务安排思路。`;

    const response = await chat([
      { role: 'system', content: REPLAN_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);

    const parsed = extractJSON(response);

    if (!parsed) {
      return res.status(500).json({ error: 'AI 响应格式异常，请稍后重试' });
    }

    let plans = Array.isArray(parsed) ? parsed : [parsed];

    // Ensure at least 3 plans by generating variants if needed
    if (plans.length < 3) {
      const base = plans[0] || { planName: '调整方案', tasks: [], breaks: [], summary: '' };
      plans = [
        { ...base, id: 'plan_1', planName: base.planName || '前紧后松方案' },
        { ...base, id: 'plan_2', planName: '均匀分布方案', tasks: [...(base.tasks || [])].reverse() },
        { ...base, id: 'plan_3', planName: '重点优先方案' },
      ];
    }

    plans = plans.map((p: Record<string, unknown>, i: number) => ({
      id: `plan_${Date.now()}_${i}`,
      ...p,
    }));

    res.json({ plans });
  } catch (e) {
    next(e);
  }
});

// POST /api/xiaoyun/motivation
xiaoyunRouter.post('/motivation', async (req, res, next) => {
  try {
    const { context } = req.body;

    const userPrompt = `日期：${context?.date || '今天'}
完成任务：${context?.completedTasks || '各项任务'}
备注：${context?.notes || '充实的一天'}
请为以上内容生成一条温暖的励志文案。`;

    const response = await chat([
      { role: 'system', content: MOTIVATION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], false);

    res.json({ text: response.trim() });
  } catch (e) {
    next(e);
  }
});

// POST /api/xiaoyun/weekly-report
xiaoyunRouter.post('/weekly-report', async (req, res, next) => {
  try {
    const { stats } = req.body;

    if (!stats) {
      return res.status(400).json({ error: '请提供统计数据' });
    }

    const userPrompt = `以下是用户过去一周的时间管理数据：
- 跟踪天数：${stats.totalDaysTracked || 0} 天
- 完成任务总数：${stats.totalTasksCompleted || 0} 个
- 总专注时长：${stats.totalFocusHours || 0} 小时
- 平均完成率：${Math.round((stats.averageCompletionRate || 0) * 100)}%
- 连续打卡天数：${stats.streakDays || 0} 天
${stats.bestDay ? `- 最佳表现日：${stats.bestDay.date}（完成率 ${Math.round(stats.bestDay.completionRate * 100)}%）` : ''}

请以朋友的口吻写一份简短温暖的周报总结（150-200字），包含：
1. 对用户这周努力的肯定
2. 一个亮点观察
3. 一个温柔的改进建议

不要用列表格式，用自然流畅的段落文字。`;

    const response = await chat([
      { role: 'system', content: `你是"小云"，一个温暖的时间管理伙伴。用自然的口语写周报总结，像朋友在聊天一样。不要用客套官话。` },
      { role: 'user', content: userPrompt },
    ], false);

    res.json({ report: response.trim() });
  } catch (e) {
    next(e);
  }
});
