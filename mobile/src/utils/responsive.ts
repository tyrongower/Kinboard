// Responsive utility functions for adapting layouts to different screen sizes
import { Dimensions } from 'react-native';
import { isTv } from '../platform/isTv';

// Breakpoints
export const BREAKPOINTS = {
  PHONE_PORTRAIT: 600,
  TABLET_PORTRAIT: 768,
  TABLET_LANDSCAPE: 1024,
};

// Device detection
const getWindowSize = () => Dimensions.get('window');

export const isPhone = (windowWidth: number = getWindowSize().width) => windowWidth < BREAKPOINTS.PHONE_PORTRAIT;
export const isTablet = (windowWidth: number = getWindowSize().width) => windowWidth >= BREAKPOINTS.PHONE_PORTRAIT;
export const isLandscape = (
  windowWidth: number = getWindowSize().width,
  windowHeight: number = getWindowSize().height
) => windowWidth > windowHeight;

// Column count for grid layouts
export const getColumnCount = (windowWidth: number = getWindowSize().width): number => {
  if (windowWidth >= BREAKPOINTS.TABLET_LANDSCAPE) {
    return 3; // Large tablets landscape: 3 columns
  } else if (windowWidth >= BREAKPOINTS.TABLET_PORTRAIT) {
    return 2; // Tablets portrait or medium tablets: 2 columns
  }
  return 1; // Phones: 1 column
};

// Content max width for centered layouts
export const getContentMaxWidth = (windowWidth: number = getWindowSize().width): number => {
  if (windowWidth >= BREAKPOINTS.TABLET_LANDSCAPE) {
    return 1200;
  } else if (windowWidth >= BREAKPOINTS.TABLET_PORTRAIT) {
    return 900;
  }
  return windowWidth;
};

// Padding adjustments
export const getContentPadding = (windowWidth: number = getWindowSize().width): number => {
  // TVs typically require additional "overscan" safe padding.
  if (isTv()) {
    // Keep some overscan margin, but avoid wasting horizontal space.
    // This aims to recover ~50% of the previous padding while remaining TV-safe.
    return 24;
  }
  if (windowWidth >= BREAKPOINTS.TABLET_PORTRAIT) {
    return 24;
  }
  return 16;
};

// Font size adjustments for larger screens
export const getScaledFontSize = (baseSize: number, windowWidth: number = getWindowSize().width): number => {
  if (windowWidth >= BREAKPOINTS.TABLET_LANDSCAPE) {
    return baseSize * 1.1;
  }
  return baseSize;
};
