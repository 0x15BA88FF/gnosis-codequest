import { Platform } from 'react-native';
import Constants from 'expo-constants';

const IPV4_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/;

const getBaseUrl = () => {
  // Explicit override always wins (set EXPO_PUBLIC_API_URL in the environment)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:8080';
  }

  // Extract host IP for Android emulator or physical device testing.
  // Only use it when it's an actual IPv4 address — Expo tunnel mode resolves
  // hostUri to a *.exp.direct domain, which must not be used as the API host.
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (IPV4_REGEX.test(host)) {
      return `http://${host}:8080`;
    }
  }

  // Fallback to 10.0.2.2 for Android emulator if a local IP is not available
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080';
  }

  return 'http://localhost:8080';
};

export const API_BASE_URL = getBaseUrl();
console.log('[Gnosis API Base URL]:', API_BASE_URL);
