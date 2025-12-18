// Responsive utility functions for adapting layouts to different screen sizes
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Breakpoints
export const BREAKPOINTS = {
  PHONE_PORTRAIT: 600,
  TABLET_PORTRAIT: 768,
  TABLET_LANDSCAPE: 1024,
};

// Device detection
export const isPhone = () => width < BREAKPOINTS.PHONE_PORTRAIT;
export const isTablet = () => width >= BREAKPOINTS.PHONE_PORTRAIT;
export const isLandscape = () => width > height;

// Column count for grid layouts
export const getColumnCount = (): number => {
  if (width >= BREAKPOINTS.TABLET_LANDSCAPE) {
    return 3; // Large tablets landscape: 3 columns
  } else if (width >= BREAKPOINTS.TABLET_PORTRAIT) {
    return 2; // Tablets portrait or medium tablets: 2 columns
  }
  return 1; // Phones: 1 column
};

// Content max width for centered layouts
export const getContentMaxWidth = (): number => {
  if (width >= BREAKPOINTS.TABLET_LANDSCAPE) {
    return 1200;
  } else if (width >= BREAKPOINTS.TABLET_PORTRAIT) {
    return 900;
  }
  return width;
};

// Padding adjustments
export const getContentPadding = (): number => {
  if (width >= BREAKPOINTS.TABLET_PORTRAIT) {
    return 24;
  }
  return 16;
};

// Font size adjustments for larger screens
export const getScaledFontSize = (baseSize: number): number => {
  if (width >= BREAKPOINTS.TABLET_LANDSCAPE) {
    return baseSize * 1.1;
  }
  return baseSize;
};
