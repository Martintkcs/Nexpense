import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Nexpense',
  slug: 'nexpense',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'nexpense',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#4F46E5',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.nexpense.app',
    buildNumber: '1',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#4F46E5',
    },
    package: 'com.nexpense.app',
    versionCode: 1,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    ['expo-secure-store'],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Nexpense helymeghatározást használ a kiadások automatikus kategorizálásához.',
        locationWhenInUsePermission: 'Nexpense helymeghatározást használ a kiadások automatikus kategorizálásához.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#4F46E5',
        sounds: [],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: 'REPLACE_WITH_YOUR_EAS_PROJECT_ID',
    },
  },
});
