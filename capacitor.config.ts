import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scrumpoker.app',
  appName: 'Scrum Poker',
  webDir: 'dist-ionic',
  bundledWebRuntime: false,
  server: {
    // For development, you can set this to connect to your dev server
    // url: 'http://localhost:3001',
    // cleartext: true
  }
};

export default config;
