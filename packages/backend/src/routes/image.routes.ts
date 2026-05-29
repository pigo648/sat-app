import { Router } from 'express';

export const imageRouter = Router();

// POST /api/image/generate-overlay - Server-side overlay (fallback)
imageRouter.post('/generate-overlay', async (req, res, next) => {
  try {
    const { imageBase64, text, style } = req.body;

    if (!imageBase64 || !text) {
      return res.status(400).json({ error: '请提供图片和文案' });
    }

    // This is a fallback endpoint. The primary approach is client-side Canvas.
    // For a production app, you'd use sharp/canvas here.
    // For now, just return the text for client-side processing.
    res.json({
      success: true,
      text,
      message: 'Client-side overlay preferred',
    });
  } catch (e) {
    next(e);
  }
});
