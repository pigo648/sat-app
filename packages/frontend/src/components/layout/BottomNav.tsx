import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: '首页', icon: 'home' },
  { path: '/stats', label: '统计', icon: 'stats' },
  { path: '/templates', label: '模板', icon: 'templates' },
  { path: '/history', label: '历史', icon: 'history' },
];

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const cls = active ? 'text-primary-600' : 'text-gray-400';
  switch (name) {
    case 'home':
      return (
        <svg className={`w-6 h-6 ${cls}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'stats':
      return (
        <svg className={`w-6 h-6 ${cls}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'templates':
      return (
        <svg className={`w-6 h-6 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case 'history':
      return (
        <svg className={`w-6 h-6 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on focus timer and photo pages
  if (location.pathname.startsWith('/focus') || location.pathname.startsWith('/photo')) {
    return null;
  }

  return (
    <nav
      className="bg-white border-t border-gray-200 safe-bottom flex-shrink-0"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              className={`flex flex-col items-center justify-center min-touch px-3 py-1 transition-colors ${
                active ? 'text-primary-600' : 'text-gray-400'
              }`}
              onClick={() => navigate(item.path)}
            >
              <NavIcon name={item.icon} active={active} />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
