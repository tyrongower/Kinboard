import React, { useCallback } from 'react';
import { Pressable, PressableProps, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { isTv } from '../../platform/isTv';

type StyleProp = ViewStyle | ViewStyle[];

interface TvPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp;
  focusedStyle?: StyleProp;
  pressedStyle?: StyleProp;
  onFocusChange?: (isFocused: boolean) => void;
  children: React.ReactNode;
}

const TvPressable = React.forwardRef<any, TvPressableProps>(function TvPressable(
  {
    style,
    focusedStyle,
    pressedStyle,
    onFocusChange,
    children,
    ...props
  },
  ref
) {
  const theme = useTheme();
  const tv = isTv();

  const handleFocus = useCallback(
    (e: any) => {
      onFocusChange?.(true);
      props.onFocus?.(e);
    },
    [onFocusChange, props]
  );

  const handleBlur = useCallback(
    (e: any) => {
      onFocusChange?.(false);
      props.onBlur?.(e);
    },
    [onFocusChange, props]
  );

  return (
    <Pressable
      {...props}
      ref={ref}
      // On TV we always want this in the focus system. On mobile this is ignored.
      focusable={tv}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={(state: any) => {
        // Android TV provides `focused` in the state callback.
        const pressed = state.pressed;
        const focused = Boolean((state as any).focused);

        return [
          styles.base,
          // No visible border when unfocused (avoid "ugly borders" / visual noise)
          { borderColor: 'transparent' },
          style,
          pressed && pressedStyle,
          focused && [
            styles.focused,
            styles.focusRing,
            {
              borderColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
            },
            focusedStyle,
          ],
        ];
      }}
    >
      {children}
    </Pressable>
  );
});

export default TvPressable;

const styles = StyleSheet.create({
  // Always reserve outline space so focused state doesn't cause layout shift.
  base: {
    borderWidth: 3,
    borderRadius: 14,
  },
  focusRing: {
    // Outline is set via borderColor in-line from theme.
  },
  focused: {
    // Avoid scale transforms on TV focus; some Android TV builds can re-run focus resolution
    // when layout changes, which looks like focus "jumping".
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    // Android
    elevation: 6,
  },
});
