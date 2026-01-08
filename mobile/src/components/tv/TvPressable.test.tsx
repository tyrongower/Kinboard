import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import TvPressable from './TvPressable';

jest.mock('../../platform/isTv', () => ({
  isTv: () => true,
}));

jest.mock('react-native-paper', () => {
  const actual = jest.requireActual('react-native-paper');
  return {
    ...actual,
    useTheme: () => ({
      colors: {
        primary: '#0000ff',
      },
    }),
  };
});

describe('TvPressable (TV focus helpers)', () => {
  test('traps focus to itself when `trapFocusLeft` is set and no explicit `nextFocusLeft` is provided', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <TvPressable trapFocusLeft>
          <Text>Button</Text>
        </TvPressable>
      );
    });

    const pressable = (tree as renderer.ReactTestRenderer).root.find(
      (n: any) => typeof n.props?.onFocus === 'function' && n.props?.focusable === true
    );

    act(() => {
      pressable.props.onFocus?.({ nativeEvent: { target: 123 } });
    });

    const updated = (tree as renderer.ReactTestRenderer).root.find(
      (n: any) => typeof n.props?.onFocus === 'function' && n.props?.focusable === true
    );
    expect(updated.props.nextFocusLeft).toBe(123);

    act(() => {
      (tree as renderer.ReactTestRenderer).unmount();
    });
  });

  test('does not override explicit `nextFocusLeft` when provided', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <TvPressable trapFocusLeft nextFocusLeft={456}>
          <Text>Button</Text>
        </TvPressable>
      );
    });

    const pressable = (tree as renderer.ReactTestRenderer).root.find(
      (n: any) => typeof n.props?.onFocus === 'function' && n.props?.focusable === true
    );

    act(() => {
      pressable.props.onFocus?.({ nativeEvent: { target: 123 } });
    });

    const updated = (tree as renderer.ReactTestRenderer).root.find(
      (n: any) => typeof n.props?.onFocus === 'function' && n.props?.focusable === true
    );
    expect(updated.props.nextFocusLeft).toBe(456);

    act(() => {
      (tree as renderer.ReactTestRenderer).unmount();
    });
  });
});
