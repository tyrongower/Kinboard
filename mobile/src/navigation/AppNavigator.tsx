// Main navigation for the app
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import AuthScreen from '../screens/AuthScreen';
import MainTabNavigator from './MainTabNavigator';
import TvMain from './TvMain';
import { isTv } from '../platform/isTv';

export type RootStackParamList = {
  Auth: { token?: string };
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const theme = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.elevation.level2,
          text: theme.colors.onSurface,
          border: theme.colors.outline,
          notification: theme.colors.error,
        },
        fonts: theme.fonts as any,
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={isTv() ? TvMain : MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
