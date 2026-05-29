import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import ToastContainer from '../ui/ToastContainer';
import { useAppStore } from '../../stores/useAppStore';
import { requestNotificationPermission } from '../../services/wearableService';
import { getPlatformInfo, onPlatformChange } from '../../utils/platform';

export default function AppShell() {
  const { isOnline, loadSettings, setOnlineStatus, refreshPhase, isLoading, settings } = useAppStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Request notification permission (enables wearable alerts on all platforms)
  useEffect(() => {
    const initNotifications = async () => {
      const platform = getPlatformInfo();
      console.log(`[SAT] Platform: ${platform.os} ${platform.osVersion}, Browser: ${platform.browserName}, Wearable: ${platform.likelyWearable}`);
      await requestNotificationPermission();
    };
    initNotifications();

    // Re-detect platform on PWA install or network change
    const cleanup = onPlatformChange(() => {
      console.log('[SAT] Platform state changed, re-detecting...');
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  useEffect(() => {
    const interval = setInterval(refreshPhase, 60000);
    return () => clearInterval(interval);
  }, [refreshPhase]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">SAT</span>
          </div>
          <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-xs text-center py-1 safe-top">
          当前处于离线模式，部分功能不可用
        </div>
      )}
      <Header />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
