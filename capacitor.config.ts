import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.azoververse.oververse',
  appName: 'AZ OVERVERSE',
  webDir: 'dist',
  backgroundColor: '#000000',
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
    allowNavigation: [
      'localhost',
      '*.firebaseapp.com',
      'accounts.google.com',
      '*.google.com',
      '*.googleapis.com',
      '*.gstatic.com',
    ],
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-7570164094154420~3142297870',
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['phone'],
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#000000',
  },
};

export default config;
