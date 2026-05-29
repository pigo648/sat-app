import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';
import { PHASE_LABELS } from '../../utils/constants';

const pageTitles: Record<string, string> = {
  '/': 'SAT',
  '/setup': '任务设置',
  '/stats': '统计',
  '/templates': '模板',
  '/history': '历史记录',
  '/settings': '设置',
  '/photo': '拍照打卡',
};

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPhase, settings, updateSettings } = useAppStore();

  const isFocusPage = location.pathname.startsWith('/focus');
  const isPhotoPage = location.pathname.startsWith('/photo');

  const getTitle = () => {
    if (isFocusPage) return '专注中';
    if (location.pathname.startsWith('/history/')) return '历史详情';
    if (location.pathname.startsWith('/templates/')) return '编辑模板';
    return pageTitles[location.pathname] || 'SAT';
  };

  const isMainPage = location.pathname === '/' || location.pathname === '/setup';

  return (
    <header
      className="bg-primary-700 text-white safe-top flex-shrink-0"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}
    >
      <div className="flex items-center justify-between px-4 h-14 min-touch">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center cursor-pointer"
            onClick={() => navigate('/')}
          >
            <span className="text-primary-700 font-bold text-sm">SAT</span>
          </div>
          <h1 className="text-lg font-semibold">{getTitle()}</h1>
        </div>

        <div className="flex items-center gap-3">
          {isMainPage && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {PHASE_LABELS[currentPhase]}
            </span>
          )}
          {!isFocusPage && !isPhotoPage && (
            <>
              <button
                className="min-touch flex items-center justify-center text-white/80 hover:text-white transition-colors"
                onClick={() => updateSettings({ soundEnabled: !settings?.soundEnabled })}
                title={settings?.soundEnabled ? '关闭声音' : '开启声音'}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {settings?.soundEnabled ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.5h-3a1 1 0 00-1 1v5a1 1 0 001 1h3l5 4V4.5l-5 4z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  )}
                </svg>
              </button>
              <button
                className="min-touch flex items-center justify-center text-white/80 hover:text-white transition-colors"
                onClick={() => navigate('/settings')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
