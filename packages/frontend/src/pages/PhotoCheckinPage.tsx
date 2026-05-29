import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import ShareSheet from '../components/photo/ShareSheet';
import { useAppStore } from '../stores/useAppStore';
import { db } from '../db/database';
import { getTodayDate } from '../utils/time';

export default function PhotoCheckinPage() {
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (e) {
      addToast({ type: 'error', message: '无法访问摄像头，请检查权限' });
    }
  }, [addToast]);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const generateMotivation = async () => {
    setIsGenerating(true);
    try {
      const tasks = await db.tasks.where('status').equals('completed').toArray();
      const taskNames = tasks.map((t) => t.name).join('、');

      const res = await fetch('/api/xiaoyun/motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            completedTasks: taskNames || '各项任务',
            date: getTodayDate(),
            notes: '今天又是充实的一天',
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedText(data.text);
        setOverlayText(data.text);
      } else {
        // Fallback
        const text = '每一天的努力都在为未来铺路，坚持就是胜利！';
        setGeneratedText(text);
        setOverlayText(text);
      }
    } catch {
      const text = '今日事，今日毕。每一天的坚持都是通往成功的阶梯。';
      setGeneratedText(text);
      setOverlayText(text);
    }
    setIsGenerating(false);
  };

  const renderOverlay = () => {
    if (!capturedPhoto || !overlayText) return;
    const canvas = overlayCanvasRef.current!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      // Draw text with gradient background
      const fontSize = Math.max(img.width * 0.05, 40);
      ctx.font = `bold ${fontSize}px "PingFang SC", "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center';

      // Measure text and create background
      const words = overlayText.split('');
      const charsPerLine = Math.floor(img.width / fontSize);

      let lines: string[] = [];
      let currentLine = '';
      for (const char of words) {
        if (currentLine.length >= charsPerLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        currentLine += char;
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = fontSize * 1.5;
      const totalHeight = lines.length * lineHeight;
      const startY = img.height * 0.7;

      // Semi-transparent background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      const bgY = startY - fontSize * 0.8;
      const bgPadding = 30;
      ctx.fillRect(0, bgY - bgPadding, img.width, totalHeight + bgPadding * 2);

      // Draw text
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      lines.forEach((line, i) => {
        const y = startY + i * lineHeight;
        ctx.strokeText(line, img.width / 2, y);
        ctx.fillText(line, img.width / 2, y);
      });

      // Add SAT watermark
      const watermarkSize = fontSize * 0.5;
      ctx.font = `bold ${watermarkSize}px "PingFang SC", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'right';
      ctx.fillText('SAT · 今日打卡', img.width - 40, img.height - 40);

      setIsRendered(true);
      canvas.toBlob((blob) => {
        if (blob) setFinalBlob(blob);
      }, 'image/jpeg', 0.95);
    };
    img.src = capturedPhoto;
  };

  const handleSave = async () => {
    if (!finalBlob) return;
    await db.photoCheckins.add({
      date: getTodayDate(),
      photoData: finalBlob,
      overlayText,
      generatedText,
      createdAt: Date.now(),
    });
    addToast({ type: 'success', message: '打卡照片已保存' });
    navigate('/');
  };

  if (capturedPhoto && !isRendered) {
    return (
      <div className="h-full flex flex-col bg-black text-white">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <img src={capturedPhoto} alt="打卡照片" className="max-w-full max-h-[60vh] rounded-xl shadow-lg" />
          {!generatedText ? (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-300 mb-4">让小云为你生成励志文案吧！</p>
              <Button variant="primary" size="lg" loading={isGenerating} onClick={generateMotivation}>
                🤖 生成励志文案
              </Button>
            </div>
          ) : (
            <div className="mt-6 w-full max-w-md">
              <label className="text-sm text-gray-300 mb-2 block">文案内容（可编辑）</label>
              <textarea
                className="w-full bg-gray-800 text-white rounded-xl p-3 text-sm border border-gray-700 focus:border-primary-500 outline-none resize-none"
                rows={3}
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
              />
              <Button variant="primary" size="lg" className="w-full mt-4" onClick={renderOverlay}>
                应用到图片
              </Button>
            </div>
          )}
        </div>
        <canvas ref={overlayCanvasRef} className="hidden" />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  if (capturedPhoto && isRendered) {
    return (
      <div className="h-full flex flex-col bg-black text-white">
        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto">
          <canvas ref={overlayCanvasRef} className="max-w-full max-h-[65vh] rounded-xl shadow-lg" style={{ display: finalBlob ? 'none' : 'block' }} />
          {finalBlob && (
            <img src={URL.createObjectURL(finalBlob)} alt="打卡结果" className="max-w-full max-h-[65vh] rounded-xl shadow-lg" />
          )}
          <div className="flex gap-3 mt-6 w-full max-w-md">
            <Button variant="secondary" className="flex-1" onClick={() => { setCapturedPhoto(null); setIsRendered(false); setGeneratedText(''); }}>
              重拍
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSave}>
              保存打卡
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => setShowShare(true)} style={{ background: '#07C160' }}>
              分享
            </Button>
          </div>
        </div>
        {showShare && finalBlob && (
          <ShareSheet imageBlob={finalBlob} onClose={() => setShowShare(false)} />
        )}
        <canvas ref={overlayCanvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="flex-1 flex flex-col">
        {/* Camera Preview */}
        <div className="flex-1 relative bg-gray-900">
          {stream ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-2xl mb-4">📷</p>
                <p className="text-sm">点击下方按钮开启相机</p>
                <Button variant="primary" className="mt-4" onClick={startCamera}>
                  开启相机
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 flex flex-col items-center gap-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 24px, 24px)' }}>
          {stream ? (
            <>
              <button
                className="w-16 h-16 rounded-full border-4 border-white bg-transparent active:bg-white/20 transition-colors"
                onClick={capturePhoto}
              />
              <button className="text-sm text-gray-400 underline" onClick={stopCamera}>
                关闭相机
              </button>
            </>
          ) : (
            <button
              className="text-sm text-gray-400 underline min-touch"
              onClick={() => navigate('/')}
            >
              返回首页
            </button>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={overlayCanvasRef} className="hidden" />
    </div>
  );
}
