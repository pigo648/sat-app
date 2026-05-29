// Cloud sync service for SAT
// Supports: local backup, WebDAV (坚果云/Nextcloud), manual import/export

import { db } from '../db/database';

export interface SyncConfig {
  type: 'none' | 'webdav' | 'local';
  webdavUrl?: string;
  webdavUsername?: string;
  webdavPassword?: string;
  autoSyncInterval?: number; // minutes, 0 = disabled
  lastSyncTime?: number;
}

interface SyncPayload {
  version: string;
  appName: string;
  exportDate: string;
  dailyPlans: unknown[];
  tasks: unknown[];
  templates: unknown[];
  focusSessions: unknown[];
  photoCheckins: unknown[]; // skipped for sync (too large)
}

const STORAGE_KEY = 'sat_sync_config';

export function getSyncConfig(): SyncConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { type: 'none' };
  } catch {
    return { type: 'none' };
  }
}

export function saveSyncConfig(config: SyncConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export async function exportAllData(): Promise<string> {
  const payload: SyncPayload = {
    version: '1.0.0',
    appName: 'SAT',
    exportDate: new Date().toISOString(),
    dailyPlans: await db.dailyPlans.toArray(),
    tasks: await db.tasks.toArray(),
    templates: await db.taskTemplates.toArray(),
    focusSessions: await db.focusSessions.toArray(),
    photoCheckins: [], // Skip photos for sync (base64 too large)
  };
  return JSON.stringify(payload, null, 2);
}

export async function importAllData(json: string): Promise<{ plans: number; tasks: number; templates: number }> {
  const payload: SyncPayload = JSON.parse(json);

  if (!payload.appName || payload.appName !== 'SAT') {
    throw new Error('不是有效的 SAT 备份文件');
  }

  // Clear existing data
  await db.dailyPlans.clear();
  await db.tasks.clear();
  await db.taskTemplates.clear();
  await db.focusSessions.clear();

  // Import
  const plansCount = payload.dailyPlans?.length || 0;
  const tasksCount = payload.tasks?.length || 0;
  const templatesCount = payload.templates?.length || 0;

  if (payload.dailyPlans?.length) await db.dailyPlans.bulkAdd(payload.dailyPlans as any[]);
  if (payload.tasks?.length) await db.tasks.bulkAdd(payload.tasks as any[]);
  if (payload.templates?.length) await db.taskTemplates.bulkAdd(payload.templates as any[]);
  if (payload.focusSessions?.length) await db.focusSessions.bulkAdd(payload.focusSessions as any[]);

  return { plans: plansCount, tasks: tasksCount, templates: templatesCount };
}

export async function uploadToWebDAV(config: SyncConfig): Promise<boolean> {
  if (!config.webdavUrl || !config.webdavUsername || !config.webdavPassword) {
    throw new Error('WebDAV 配置不完整');
  }

  const data = await exportAllData();
  const url = `${config.webdavUrl.replace(/\/$/, '')}/SAT-backup-${new Date().toISOString().split('T')[0]}.json`;
  const auth = btoa(`${config.webdavUsername}:${config.webdavPassword}`);

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: data,
  });

  if (!res.ok) {
    throw new Error(`上传失败 (${res.status})`);
  }

  config.lastSyncTime = Date.now();
  saveSyncConfig(config);
  return true;
}

export async function downloadFromWebDAV(config: SyncConfig, fileName?: string): Promise<string> {
  if (!config.webdavUrl || !config.webdavUsername || !config.webdavPassword) {
    throw new Error('WebDAV 配置不完整');
  }

  let url: string;
  if (fileName) {
    url = `${config.webdavUrl.replace(/\/$/, '')}/${fileName}`;
  } else {
    // List files and get the latest backup
    const listRes = await fetch(config.webdavUrl.replace(/\/$/, ''), {
      method: 'PROPFIND',
      headers: {
        'Authorization': `Basic ${btoa(`${config.webdavUsername}:${config.webdavPassword}`)}`,
        'Depth': '1',
      },
    });

    if (!listRes.ok) {
      throw new Error(`列出文件失败 (${listRes.status})`);
    }

    const text = await listRes.text();
    const matches = text.match(/SAT-backup-[\d-]+\.json/g);
    if (!matches || matches.length === 0) {
      throw new Error('云端没有找到备份文件');
    }

    const latest = matches.sort().pop()!;
    url = `${config.webdavUrl.replace(/\/$/, '')}/${latest}`;
  }

  const res = await fetch(url, {
    headers: {
      'Authorization': `Basic ${btoa(`${config.webdavUsername}:${config.webdavPassword}`)}`,
    },
  });

  if (!res.ok) {
    throw new Error(`下载失败 (${res.status})`);
  }

  return res.text();
}

export async function downloadBackupFile(): Promise<void> {
  const data = await exportAllData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SAT-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function uploadBackupFile(): Promise<{ plans: number; tasks: number; templates: number }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('未选择文件'));
      try {
        const text = await file.text();
        const result = await importAllData(text);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}
