// Capacitor native feature wrappers
// Falls back gracefully when running in browser / PWA mode

let CapacitorPlugins: any = null;

async function getPlugins() {
  if (CapacitorPlugins) return CapacitorPlugins;
  try {
    const mod = await import('@capacitor/core');
    if (!mod.Capacitor.isNativePlatform()) return null;
    CapacitorPlugins = mod;
    return CapacitorPlugins;
  } catch {
    return null;
  }
}

export async function isNativePlatform(): Promise<boolean> {
  const p = await getPlugins();
  return !!p;
}

export async function setStatusBarStyle(style: 'dark' | 'light') {
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: style === 'dark' ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: style === 'dark' ? '#1E3A5F' : '#FFFFFF' });
  } catch { /* browser mode */ }
}

export async function hideSplashScreen() {
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch { /* browser mode */ }
}

export async function scheduleLocalNotification(title: string, body: string, at: Date) {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    // Request permission first
    const permResult = await LocalNotifications.requestPermissions();
    if (permResult.display !== 'granted') return;

    await LocalNotifications.schedule({
      notifications: [{
        title,
        body,
        id: Date.now(),
        schedule: { at },
        sound: 'beep.wav',
      }],
    });
  } catch { /* browser mode - use Web Notification API */ }
}

export async function shareContent(title: string, text: string, url?: string) {
  try {
    const { Share } = await import('@capacitor/share');
    await Share.share({ title, text, url });
  } catch {
    // Fallback to Web Share API
    if (navigator.share) {
      await navigator.share({ title, text, url });
    }
  }
}

export async function takePhoto(): Promise<string | null> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    return image.dataUrl || null;
  } catch {
    return null;
  }
}
