import { useAppStore } from '../../stores/useAppStore';

const typeStyles = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-primary-500',
  warning: 'bg-yellow-500',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${typeStyles[toast.type]} text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto animate-slide-up flex items-center justify-between`}
        >
          <span>{toast.message}</span>
          <button
            className="ml-2 text-white/70 hover:text-white min-touch flex items-center justify-center"
            onClick={() => removeToast(toast.id)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
