// Person job card component for Jobs screen
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, findNodeHandle } from 'react-native';
import { Card, Text, ProgressBar, IconButton, useTheme } from 'react-native-paper';
import { Job } from '../../types';
import UserAvatar from '../UserAvatar';
import JobItem from './JobItem';
import TvPressable from '../tv/TvPressable';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PersonJobCardProps {
  variant?: 'mobile' | 'tv';
  isFirstCard?: boolean;
  person: {
    userId: number | null;
    name: string;
    color: string;
    avatarUrl?: string | null;
    hideCompleted: boolean;
  };
  jobs: Job[];
  completed: number;
  total: number;
  onToggleHideCompleted?: (userId: number | null) => void;
  onToggleJob: (job: Job, isCompleted: boolean) => void;
  isJobCompleted: (job: Job) => boolean;
}

export default function PersonJobCard({
  variant = 'mobile',
  isFirstCard = false,
  person,
  jobs,
  completed,
  total,
  onToggleHideCompleted,
  onToggleJob,
  isJobCompleted,
}: PersonJobCardProps) {
  const theme = useTheme();
  const percentage = total > 0 ? completed / total : 0;
  const visibleJobs = person.hideCompleted ? jobs.filter((j) => !isJobCompleted(j)) : jobs;
  const isTv = variant === 'tv';

  // On TV, track whether any child is focused so we can highlight the whole person column.
  const [focusedChildCount, setFocusedChildCount] = useState(0);
  const isActive = isTv && focusedChildCount > 0;

  const onChildFocusChange = useCallback((focused: boolean) => {
    setFocusedChildCount((prev) => {
      const next = prev + (focused ? 1 : -1);
      return Math.max(0, next);
    });
  }, []);

  const activeWrapperStyle = useMemo(
    () =>
      isActive
        ? [
            styles.tvActiveWrapper,
            {
              borderColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
            },
          ]
        : [styles.tvWrapper],
    [isActive, theme.colors.primary]
  );

  return (
    <View style={activeWrapperStyle}>
      <Card style={[styles.card, { borderColor: person.color }]}>
        <Card.Content>
          {/* Person header (non-focusable visual header) */}
          <View style={styles.header}>
            <View style={styles.info}>
              <UserAvatar name={person.name} avatarUrl={person.avatarUrl} color={person.color} />
              <View style={styles.text}>
                <Text variant="titleMedium" style={styles.name}>
                  {person.name}
                </Text>
                <Text variant="bodySmall" style={styles.stats}>
                  {completed} of {total} completed
                </Text>
              </View>
            </View>

            {person.userId !== null && onToggleHideCompleted && (
              isTv ? (
                <TvPressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    person.hideCompleted ? `Show completed for ${person.name}` : `Hide completed for ${person.name}`
                  }
                  onPress={() => onToggleHideCompleted(person.userId)}
                  onFocusChange={(focused) => onChildFocusChange(focused)}
                  hasTVPreferredFocus={isFirstCard}
                  style={styles.tvIconButton}
                  focusedStyle={styles.tvIconButtonFocused}
                >
                  <MaterialCommunityIcons
                    name={person.hideCompleted ? 'eye-off' : 'eye'}
                    size={24}
                    color={theme.colors.onSurface}
                  />
                </TvPressable>
              ) : (
                <IconButton
                  icon={person.hideCompleted ? 'eye-off' : 'eye'}
                  size={20}
                  onPress={() => onToggleHideCompleted(person.userId)}
                />
              )
            )}
          </View>

        {/* Progress bar */}
        <ProgressBar progress={percentage} color={person.color} style={styles.progressBar} />

        {/* Jobs list */}
          {visibleJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="titleMedium" style={{ color: '#34d399' }}>
              ✓ All done!
            </Text>
          </View>
        ) : (
            visibleJobs.map((job) => (
            <JobItem
              key={job.id}
              job={job}
              color={person.color}
              isCompleted={isJobCompleted(job)}
              onToggle={() => onToggleJob(job, isJobCompleted(job))}
              onFocusChange={isTv ? (focused) => onChildFocusChange(focused) : undefined}
            />
            ))
        )}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  tvWrapper: {
    // Keep layout stable between focused/unfocused.
    borderWidth: 3,
    borderColor: 'transparent',
    borderRadius: 18,
  },
  tvActiveWrapper: {
    borderWidth: 3,
    borderRadius: 18,
    // iOS
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    // Android
    elevation: 10,
  },
  card: {
    flex: 1,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    // inherits color from onSurface
  },
  stats: {
    // inherits color from onSurfaceVariant
  },
  tvIconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tvIconButtonFocused: {
    borderWidth: 2,
  },
  progressBar: {
    marginBottom: 12,
    height: 6,
    borderRadius: 3,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
});
