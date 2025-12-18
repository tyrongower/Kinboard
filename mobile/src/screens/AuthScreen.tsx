// Authentication screen - handles kiosk token input and authentication
import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Image, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Button, ActivityIndicator, useTheme, Card } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService } from '../auth/authService';
import { getApiBaseUrl, getApiBaseUrlWarning, loadApiBaseUrl, setApiBaseUrl } from '../api/apiBaseUrl';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function AuthScreen({ navigation, route }: Props) {
  const [serverUrl, setServerUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const theme = useTheme();

  const baseUrlWarning = useMemo(() => getApiBaseUrlWarning(serverUrl), [serverUrl]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setInitError(null);
      try {
        const loadedBaseUrl = await loadApiBaseUrl();
        if (cancelled) return;
        setServerUrl(loadedBaseUrl || '');

        // Check if we have stored tokens
        const hasTokens = await authService.loadStoredTokens();
        if (cancelled) return;

        if (hasTokens) {
          // Only auto-enter the app if a server URL is configured.
          // Tokens are not meaningful without a server to talk to.
          if (loadedBaseUrl) {
            navigation.replace('Main');
            return;
          }

          await authService.logout();
        }

        // Check if token was passed via route params (deep link)
        if (route.params?.token) {
          setToken(route.params.token);
          await handleAuthenticate(route.params.token, loadedBaseUrl || undefined);
          return;
        }
      } catch (e: any) {
        console.error('App initialization failed', e);
        if (!cancelled) {
          setInitError(
            e?.message ||
              'The app failed to initialize. Please restart the app. If the issue persists, contact support.'
          );
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthenticate = async (tokenToUse?: string, baseUrlOverride?: string) => {
    const authToken = tokenToUse || token;
    if (!authToken.trim()) {
      Alert.alert('Error', 'Please enter a kiosk token');
      return;
    }

    const baseUrlToUse = (baseUrlOverride ?? serverUrl).trim();
    const configWarning = getApiBaseUrlWarning(baseUrlToUse);
    if (configWarning) {
      Alert.alert('Server Configuration', configWarning);
      return;
    }

    setLoading(true);
    try {
      await setApiBaseUrl(baseUrlToUse);
      await authService.authenticateKiosk(authToken.trim());
      navigation.replace('Main');
    } catch (error: any) {
      Alert.alert('Authentication Failed', error?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {initError ? (
            <Card style={styles.errorCard} mode="outlined">
              <Card.Content>
                <Text variant="titleMedium" style={{ color: theme.colors.error, marginBottom: 8 }}>
                  Startup Error
                </Text>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>{initError}</Text>
              </Card.Content>
            </Card>
          ) : null}

          {baseUrlWarning ? (
            <Card style={styles.warningCard} mode="outlined">
              <Card.Content>
                <Text variant="titleMedium" style={{ color: theme.colors.tertiary, marginBottom: 8 }}>
                  Configuration Warning
                </Text>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>{baseUrlWarning}</Text>
                {getApiBaseUrl() ? (
                  <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                    Current: {getApiBaseUrl()}
                  </Text>
                ) : null}
              </Card.Content>
            </Card>
          ) : null}

          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
            Kinboard
          </Text>
          <Text variant="titleMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Enter your kiosk token to continue
          </Text>

          <TextInput
            mode="outlined"
            label="Server URL"
            placeholder="https://your-server:5000"
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            mode="outlined"
            label="Kiosk Token"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            disabled={loading}
          />

          <Button
            mode="contained"
            onPress={() => handleAuthenticate()}
            loading={loading}
            disabled={loading || !token.trim() || !!getApiBaseUrlWarning(serverUrl)}
            style={styles.button}
          >
            Authenticate
          </Button>

          <Text variant="bodySmall" style={[styles.helpText, { color: theme.colors.onSurfaceDisabled }]}>
            Contact your administrator for a valid kiosk token
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
    paddingVertical: 6,
  },
  helpText: {
    textAlign: 'center',
  },
  errorCard: {
    marginBottom: 16,
  },
  warningCard: {
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
});
