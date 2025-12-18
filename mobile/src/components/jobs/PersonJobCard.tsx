// Person job card component for Jobs screen
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, IconButton } from 'react-native-paper';
import { Job } from '../../types';
import UserAvatar from '../UserAvatar';
import JobItem from './JobItem';

interface PersonJobCardProps {
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
  person,
  jobs,
  completed,
  total,
  onToggleHideCompleted,
  onToggleJob,
  isJobCompleted,
}: PersonJobCardProps) {
  const percentage = total > 0 ? completed / total : 0;
  const visibleJobs = person.hideCompleted ? jobs.filter((j) => !isJobCompleted(j)) : jobs;

  return (
    <Card style={[styles.card, { borderColor: person.color }]}>
      <Card.Content>
        {/* Person header */}
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
            <IconButton
              icon={person.hideCompleted ? 'eye-off' : 'eye'}
              size={20}
              onPress={() => onToggleHideCompleted(person.userId)}
            />
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
            />
          ))
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
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
