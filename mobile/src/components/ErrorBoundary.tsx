import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';

type Props = {
  children: React.ReactNode;
  onRetry?: () => void;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Render error caught by ErrorBoundary', error, info);
  }

  private handleRetry = () => {
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Something went wrong
        </Text>
        <Text style={styles.message}>
          The app hit an unexpected error while rendering this screen.
        </Text>
        <Text style={styles.detail}>{this.state.error.message || 'Unknown error'}</Text>
        <Button mode="contained" onPress={this.handleRetry}>
          Try again
        </Button>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 12,
  },
  message: {
    marginBottom: 12,
  },
  detail: {
    marginBottom: 20,
    opacity: 0.8,
  },
});
