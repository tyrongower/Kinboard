import React from 'react';
import { View, ViewProps } from 'react-native';

// Lightweight wrapper around React Native's optional TV focus guide view.
// On Android TV we primarily rely on `nextFocus*` directional overrides,
// but we keep this component so screens can express intended focus grouping
// without coupling to a specific native implementation.

type AnyProps = Record<string, any>;

export default function TVFocusGuide(props: ViewProps & AnyProps) {
  const RN: any = require('react-native');
  const NativeTVFocusGuideView = RN?.TVFocusGuideView;

  if (NativeTVFocusGuideView) {
    return <NativeTVFocusGuideView {...props} />;
  }

  return <View {...props} />;
}
