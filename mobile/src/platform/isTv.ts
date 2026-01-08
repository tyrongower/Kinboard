import { Platform } from 'react-native';

// React Native exposes `Platform.isTV` on TV platforms.
// We centralize this so UI/navigation can branch consistently.
export const isTv = () => {
  // iOS/tvOS and some RN builds
  if (Boolean((Platform as any).isTV)) return true;

  // Android TV / Google TV: Expo/RN may not always set `Platform.isTV`,
  // but Android exposes UI mode.
  if (Platform.OS === 'android') {
    const uiMode = (Platform as any)?.constants?.uiMode;
    if (uiMode === 'tv') return true;
  }

  return false;
};

// Convenience constant for places where a static decision is acceptable.
export const IS_TV = isTv();
