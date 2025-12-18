// Individual job item component
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Checkbox, Avatar, useTheme } from 'react-native-paper';
import { Job } from '../../types';

interface JobItemProps {
  job: Job;
  color: string;
  isCompleted: boolean;
  onToggle: () => void;
}

export default function JobItem({ job, color, isCompleted, onToggle }: JobItemProps) {
  const theme = useTheme();

  return (
    <Card
      style={[styles.card, isCompleted && styles.cardCompleted]}
      onPress={onToggle}
    >
      <Card.Content style={styles.content}>
        {job.imageUrl && (
          <Avatar.Image size={40} source={{ uri: job.imageUrl }} style={styles.image} />
        )}
        <View style={styles.text}>
          <Text
            variant="bodyLarge"
            style={[
              { color: theme.colors.onSurface },
              isCompleted && {
                textDecorationLine: 'line-through',
                color: theme.colors.onSurfaceVariant
              }
            ]}
          >
            {job.title}
          </Text>
          {job.description && (
            <Text variant="bodySmall" style={styles.description}>
              {job.description}
            </Text>
          )}
        </View>
        <Checkbox status={isCompleted ? 'checked' : 'unchecked'} color={color} />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    elevation: 1,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  image: {
    marginRight: 12,
  },
  text: {
    flex: 1,
  },
  description: {
    marginTop: 2,
  },
});
