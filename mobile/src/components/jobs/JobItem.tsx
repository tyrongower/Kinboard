// Individual job item component
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Avatar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Job } from '../../types';
import TvPressable from '../tv/TvPressable';
import { isTv } from '../../platform/isTv';

interface JobItemProps {
  job: Job;
  color: string;
  isCompleted: boolean;
  onToggle: () => void;
  onFocusChange?: (isFocused: boolean) => void;
}

export default function JobItem({
  job,
  color,
  isCompleted,
  onToggle,
  onFocusChange,
}: JobItemProps) {
  const theme = useTheme();
  const tv = isTv();

  const cardRadius = 12;

  const content = (
    <Card style={[styles.card, { borderRadius: cardRadius }, isCompleted && styles.cardCompleted]}>
      <Card.Content style={styles.content}>
        {job.imageUrl && (
          <Avatar.Image size={40} source={{ uri: job.imageUrl }} style={styles.image} />
        )}
        <View style={styles.text}>
          <Text
            variant="bodyMedium"
            style={[
              { color: theme.colors.onSurface },
              isCompleted && {
                textDecorationLine: 'line-through',
                color: theme.colors.onSurfaceVariant,
              },
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
        {tv ? (
          <MaterialCommunityIcons
            name={isCompleted ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={28}
            color={isCompleted ? color : theme.colors.onSurfaceVariant}
          />
        ) : (
          // On mobile keep the native Paper checkbox
          <MaterialCommunityIcons
            name={isCompleted ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={isCompleted ? color : theme.colors.onSurfaceVariant}
          />
        )}
      </Card.Content>
    </Card>
  );

  return (
    <TvPressable
      accessibilityRole="button"
      accessibilityLabel={isCompleted ? `Mark ${job.title} as not completed` : `Mark ${job.title} as completed`}
      onPress={onToggle}
      onFocusChange={onFocusChange}
      style={[styles.pressable, { borderRadius: cardRadius }]}
      focusedStyle={tv ? styles.focused : undefined}
    >
      {content}
    </TvPressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginTop: 8,
  },
  focused: {
    // Avoid layout/scale changes on TV focus; it can cause focus re-resolution on some devices.
  },
  card: {
    elevation: 1,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    // Reduce trailing whitespace after the checkbox (especially noticeable on TV)
    // while keeping a comfortable touch/focus target.
    paddingLeft: 8,
    paddingRight: 8,
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
