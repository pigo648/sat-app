import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sat.timemanager',
  appName: 'SAT - 智能时间调配',
  webDir: 'packages/frontend/dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1E40AF',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_sat',
      iconColor: '#1E40AF',
    },
  },
};

export default config;
