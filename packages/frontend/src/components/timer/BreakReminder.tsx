import { useEffect } from 'react';
import { sendWearableReminder } from '../../services/wearableService';

interface Props {
  isOpen: boolean;
  onDismiss: () => void;
}

export default function BreakReminder({ isOpen, onDismiss }: Props) {
  useEffect(() => {
    if (isOpen) {
      sendWearableReminder('break');
    }
  }, [isOpen]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full text-center animate-scale-in shadow-xl">
        <div className="text-4xl mb-3">☕</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">该休息一下了！</h3>
        <p className="text-sm text-gray-500 mb-6">
          你已经连续专注了 2 小时，建议休息 15 分钟，活动一下身体，让大脑放松。
        </p>
        <button
          className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors"
          onClick={onDismiss}
        >
          知道了，休息一下
        </button>
      </div>
    </div>
  );
}
