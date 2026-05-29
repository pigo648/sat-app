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

// POST /api/xiaoyun/plan - Generate initial schedule
xiaoyunRouter.post('/plan', async (req, res, next) => {
  try {
    const { tasks, timeRange, constraints } = req.body;

    if (!tasks || !timeRange?.start || !timeRange?.end) {
      return res.status(400).json({ error: '请提供任务描述和时间范围' });
    }

    const userPrompt = `用户的任务描述：${tasks}
可用时间范围：${timeRange.start} 到 ${timeRange.end}
${constraints ? `额外要求：${constraints}` : ''}

请为以上任务创建一个合理的时间安排方案。`;

    const response = await chat([
      { role: 'system', content: PLANNING_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);

    // Parse JSON from response
    let parsed;
    try {
      // Try to extract JSON from possible markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = JSON.parse(response);
      }
    } catch {
      return res.status(500).json({ error: 'AI 响应格式异常，请重试' });
    }

    // If single plan, wrap in array
    const plans = Array.isArray(parsed) ? parsed : [parsed];

    res.json({
      plans: plans.map((p: any, i: number) => ({
        id: `plan_${Date.now()}_${i}`,
        ...p,
      })),
      conversationId: `conv_${Date.now()}`,
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/xiaoyun/replan - Generate alternatives
xiaoyunRouter.post('/replan', async (req, res, next) => {
  try {
    const { feedback, conversationId } = req.body;

    if (!feedback) {
      return res.status(400).json({ error: '请提供反馈意见' });
    }

    const userPrompt = `用户对之前的方案不满意，意见是：${feedback}
请提供至少3个不同的备选方案。`;

    const response = await chat([
      { role: 'system', content: REPLAN_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);

    let parsed;
    try {
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = JSON.parse(response);
      }
    } catch {
      return res.status(500).json({ error: 'AI 响应格式异常，请重试' });
    }

    const plans = Array.isArray(parsed) ? parsed : [parsed];

    res.json({
      plans: plans.map((p: any, i: number) => ({
        id: `plan_${Date.now()}_${i}`,
        ...p,
      })),
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/xiaoyun/motivation - Generate motivational text
xiaoyunRouter.post('/motivation', async (req, res, next) => {
  try {
    const { context } = req.body;

    const userPrompt = `今天完成的日期：${context?.date || '今天'}
完成的任务：${context?.completedTasks || '各项任务'}
备注：${context?.notes || '充实的一天'}

请为以上内容生成一条励志文案。`;

    const response = await chat([
      { role: 'system', content: MOTIVATION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);

    res.json({ text: response.trim() });
  } catch (e) {
    next(e);
  }
});
