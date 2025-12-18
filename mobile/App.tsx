import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, PaperProvider, Text } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';
import { View, StyleSheet } from 'react-native';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { registerGlobalErrorHandlers } from './src/utils/globalErrorHandlers';

function FatalErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.fatalContainer}>
      <Text variant="titleLarge" style={styles.fatalTitle}>
        Startup error
      </Text>
      <Text style={styles.fatalMessage}>{message}</Text>
      <Button mode="contained" onPress={onRetry}>
        Try again
      </Button>
    </View>
  );
}

export default function App() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            staleTime: 5000,
          },
        },
      }),
    []
  );

  const [appKey, setAppKey] = useState(0);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    const unregister = registerGlobalErrorHandlers((err) => {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setFatalError(msg || 'Unknown error');
    });
    return unregister;
  }, []);

  const handleRetry = () => {
    setFatalError(null);
    setAppKey((k) => k + 1);
  };

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          {fatalError ? (
            <FatalErrorScreen message={fatalError} onRetry={handleRetry} />
          ) : (
            <ErrorBoundary onRetry={handleRetry}>
              <View style={styles.appContainer} key={appKey}>
                <AppNavigator />
                <StatusBar style="light" />
              </View>
            </ErrorBoundary>
          )}
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  fatalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  fatalTitle: {
    marginBottom: 12,
  },
  fatalMessage: {
    marginBottom: 20,
    opacity: 0.85,
  },
});
