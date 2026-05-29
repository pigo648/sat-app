import { SHARE_PLATFORMS } from '../../utils/constants';
import { useAppStore } from '../../stores/useAppStore';

interface Props {
  imageBlob: Blob;
  onClose: () => void;
}

export default function ShareSheet({ imageBlob, onClose }: Props) {
  const { addToast } = useAppStore();

  const handleShare = async (platform: string) => {
    const file = new File([imageBlob], `SAT-checkin-${Date.now()}.jpg`, { type: 'image/jpeg' });

    // Try Web Share API
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: 'SAT 每日打卡',
          text: '我今天完成了所有任务！💪 #SAT智能时间调配',
          files: [file],
        });
        addToast({ type: 'success', message: '分享成功！' });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }

    // Fallback: download image and show platform instructions
    const url = URL.createObjectURL(imageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SAT-打卡.jpg';
    a.click();
    URL.revokeObjectURL(url);

    const platformNames: Record<string, string> = {
      wechat: '微信朋友圈',
      weibo: '微博',
      xiaohongshu: '小红书',
      douyin: '抖音',
      kuaishou: '快手',
    };

    addToast({
      type: 'info',
      message: `图片已保存，请打开${platformNames[platform] ?? '社交平台'}手动分享`,
      duration: 4000,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bottom-sheet-backdrop" />
      <div
        className="relative bg-white rounded-t-2xl w-full max-w-md p-5 animate-slide-up"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 20px, 20px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">分享到</h3>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {SHARE_PLATFORMS.map((p) => (
            <button
              key={p.id}
              className="flex flex-col items-center gap-2 min-w-[64px] min-touch"
              onClick={() => handleShare(p.id)}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-sm active:scale-95 transition-transform"
                style={{ backgroundColor: p.color }}
              >
                {p.name[0]}
              </div>
              <span className="text-xs text-gray-500">{p.name}</span>
            </button>
          ))}
        </div>

        <button
          className="w-full mt-4 py-3 text-sm text-gray-400 font-medium active:text-gray-600 transition-colors min-touch"
          onClick={() => {
            const url = URL.createObjectURL(imageBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'SAT-打卡.jpg';
            a.click();
            URL.revokeObjectURL(url);
            addToast({ type: 'success', message: '图片已保存到相册' });
            onClose();
          }}
        >
          保存图片
        </button>
      </div>
    </div>
  );
}
