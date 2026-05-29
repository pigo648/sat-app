import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { useAppStore } from '../stores/useAppStore';
import { useTaskStore } from '../stores/useTaskStore';
import Button from '../components/ui/Button';
import { getPlatformInfo, getPlatformDescription, getPWAInstallInstructions } from '../utils/platform';
import { getWearableName, getWearableSetupGuide } from '../services/wearableService';
import TimeRangePicker from '../components/task/TimeRangePicker';
import { downloadBackupFile, uploadBackupFile, getSyncConfig, saveSyncConfig, uploadToWebDAV, downloadFromWebDAV, importAllData } from '../services/cloudSyncService';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSettings, addToast } = useAppStore();
  const { clearTodayPlan } = useTaskStore();

  if (!settings) return null;

  const handleExport = async () => {
    const { db } = await import('../db/database');
    const allPlans = await db.dailyPlans.toArray();
    const allTasks = await db.tasks.toArray();
    const data = { plans: allPlans, tasks: allTasks, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAT-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', message: '数据已导出' });
  };

  const handleClear = async () => {
    if (confirm('确定清除所有数据吗？此操作不可恢复！')) {
      const { db } = await import('../db/database');
      await db.dailyPlans.clear();
      await db.tasks.clear();
      await db.focusSessions.clear();
      await db.photoCheckins.clear();
      addToast({ type: 'info', message: '所有数据已清除' });
      navigate('/');
    }
  };

  return (
    <PageContainer>
      {/* Daily Defaults */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">默认时间</h3>
        <p className="text-xs text-gray-400 mb-3">新建每日计划时的默认时间段</p>
        <TimeRangePicker
          start={settings.defaultTimeRangeStart}
          end={settings.defaultTimeRangeEnd}
          onStartChange={(v) => updateSettings({ defaultTimeRangeStart: v })}
          onEndChange={(v) => updateSettings({ defaultTimeRangeEnd: v })}
        />
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">提醒</h3>
        <div className="space-y-3">
          <ToggleRow
            label="声音提示"
            description="任务开始/结束时播放提示音"
            checked={settings.soundEnabled}
            onChange={(v) => updateSettings({ soundEnabled: v })}
          />
          <ToggleRow
            label="阶段提醒"
            description="12:10、17:30、22:30 提醒注意休息"
            checked={settings.phaseRemindersEnabled}
            onChange={(v) => updateSettings({ phaseRemindersEnabled: v })}
          />
          <ToggleRow
            label="休息提醒"
            description="连续专注2小时后提醒休息15分钟"
            checked={settings.breakRemindersEnabled}
            onChange={(v) => updateSettings({ breakRemindersEnabled: v })}
          />
          <ToggleRow
            label="AI 助手小云"
            description="启用智能时间调配功能"
            checked={settings.xiaoYunEnabled}
            onChange={(v) => updateSettings({ xiaoYunEnabled: v })}
          />
        </div>
      </div>

      {/* Wearable - Full cross-platform */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">智能穿戴设备 ⌚</h3>
        <p className="text-xs text-gray-400 mb-3">
          兼容 Apple Watch · WearOS · Galaxy Watch · 华为手表 · 小米手环/手表
        </p>

        <PlatformWearableGuide />

        <div className="mt-3 p-3 bg-green-50 rounded-xl">
          <div className="flex items-start gap-2">
            <span className="text-lg">✅</span>
            <div className="text-xs text-green-700">
              <p className="font-medium mb-1">工作原理</p>
              <p className="text-green-600">
                SAT 使用手机系统通知机制。当手机蓝牙连接穿戴设备后，
                所有休息提醒会自动镜像到手表/手环，无需安装额外的穿戴端 App。
                支持 Android、iOS、HarmonyOS 三大系统。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Sync */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">云端同步</h3>
        <p className="text-xs text-gray-400 mb-3">
          支持 WebDAV 协议（坚果云、Nextcloud 等），实现多设备数据同步
        </p>
        <div className="space-y-2">
          <Button variant="secondary" className="w-full" onClick={async () => {
            try {
              await downloadBackupFile();
              addToast({ type: 'success', message: '备份文件已下载' });
            } catch { addToast({ type: 'error', message: '导出失败' }); }
          }}>
            下载备份文件
          </Button>
          <Button variant="secondary" className="w-full" onClick={async () => {
            try {
              const result = await uploadBackupFile();
              addToast({ type: 'success', message: `恢复完成：${result.tasks} 个任务` });
            } catch (e) { addToast({ type: 'error', message: '导入失败：文件格式不正确' }); }
          }}>
            从备份恢复
          </Button>
          <Button variant="ghost" className="w-full text-sm" onClick={() => {
            const config = getSyncConfig();
            const url = prompt('WebDAV 地址（如 https://dav.jianguoyun.com/dav/SAT）：', config.webdavUrl || '');
            if (!url) return;
            const username = prompt('用户名：', config.webdavUsername || '');
            if (!username) return;
            const password = prompt('密码（App 专用密码）：', '');
            if (!password) return;
            saveSyncConfig({ type: 'webdav', webdavUrl: url, webdavUsername: username, webdavPassword: password, autoSyncInterval: 0 });
            addToast({ type: 'success', message: 'WebDAV 已配置' });
          }}>
            配置 WebDAV 同步
          </Button>
        </div>
      </div>

      {/* Data */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">数据管理</h3>
        <div className="space-y-3">
          <Button variant="secondary" className="w-full" onClick={handleExport}>
            导出数据 (JSON)
          </Button>
          <Button variant="danger" className="w-full" onClick={handleClear}>
            清除所有数据
          </Button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">关于</h3>
        <div className="text-sm text-gray-500 space-y-1">
          <p>SAT v1.0.0</p>
          <p>智能时间调配助手</p>
          <p className="text-xs text-gray-400">AI 驱动的时间管理，让每一天都高效充实</p>
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">隐私与法律</h3>
        <Button variant="ghost" className="w-full justify-start text-sm text-gray-600" onClick={() => navigate('/privacy')}>
          查看隐私政策
        </Button>
      </div>

      {/* Install PWA Button */}
      <PWAInstallButton />
    </PageContainer>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
      <button
        className={`w-12 h-7 rounded-full transition-colors relative ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}
        onClick={() => onChange(!checked)}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

function PWAInstallButton() {
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any)._pwaInstallEvent = e;
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!showInstall) return null;

  const handleInstall = async () => {
    const event = (window as any)._pwaInstallEvent;
    if (event) {
      await event.prompt();
      const result = await event.userChoice;
      if (result.outcome === 'accepted') {
        setShowInstall(false);
      }
    }
  };

  return (
    <Button variant="primary" className="w-full" onClick={handleInstall}>
      添加到主屏幕
    </Button>
  );
}

function PlatformWearableGuide() {
  const [info] = useState(() => getPlatformInfo());
  const installInstructions = getPWAInstallInstructions();

  const platformIcons: Record<string, string> = {
    android: '🤖',
    ios: '🍎',
    harmonyos: '🔷',
    unknown: '📱',
  };

  const wearableIcons: Record<string, string> = {
    wearos: '⌚',
    apple_watch: '⌚',
    galaxy_watch: '⌚',
    huawei_watch: '⌚',
    xiaomi_band: '⌚',
    other_wearable: '⌚',
    none: '',
  };

  return (
    <div className="space-y-2">
      {/* System info */}
      <div className="p-3 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{platformIcons[info.os]}</span>
          <div>
            <div className="text-xs font-medium text-gray-700">{getPlatformDescription()}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{installInstructions}</div>
          </div>
        </div>
      </div>

      {/* Wearable setup guide */}
      {info.likelyWearable !== 'none' && (
        <div className="p-3 bg-blue-50 rounded-xl">
          <div className="flex items-start gap-2">
            <span className="text-xl">{wearableIcons[info.likelyWearable]}</span>
            <div>
              <div className="text-xs font-medium text-blue-700 mb-1">
                {getWearableName(info.likelyWearable)} 连接指南
              </div>
              <ol className="list-decimal list-inside space-y-0.5">
                {getWearableSetupGuide(info.likelyWearable).map((step, i) => (
                  <li key={i} className="text-[10px] text-blue-600">{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* PWA install guide per platform */}
      <div className="p-3 bg-gray-50 rounded-xl">
        <div className="text-xs font-medium text-gray-700 mb-1">
          {info.os === 'ios' ? 'iOS 安装指南' :
           info.os === 'harmonyos' ? 'HarmonyOS 安装指南' :
           'Android 安装指南'}
        </div>
        <p className="text-[10px] text-gray-500">{installInstructions}</p>
      </div>
    </div>
  );
}
