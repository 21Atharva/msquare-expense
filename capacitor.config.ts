import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.msquare.expense',
  appName: 'Msquare Expense',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'https://expense-tracker-t3cs.onrender.com'
    ]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#3f51b5',
      overlaysWebView: false
    }
  }
};

export default config;
