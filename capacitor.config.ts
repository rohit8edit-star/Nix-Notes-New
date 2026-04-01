import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nixnotes.app',
  appName: 'Nix Notes',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
