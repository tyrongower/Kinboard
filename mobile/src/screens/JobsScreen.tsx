// Jobs screen - displays jobs by person with completion tracking (REFACTORED)
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi, jobAssignmentsApi, usersApi, siteSettingsApi } from '../api';
import { Job, User } from '../types';
import { getContentPadding } from '../utils/responsive';
import LoadingSpinner from '../components/LoadingSpinner';
import ResponsiveGrid from '../components/ResponsiveGrid';
import PersonJobCard from '../components/jobs/PersonJobCard';

interface JobsScreenProps {
  selectedDate: Date;
}

interface PersonJobs {
  userId: number | null;
  name: string;
  color: string;
  avatarUrl?: string | null;
  jobs: Job[];
  hideCompleted: boolean;
}

export default function JobsScreen({ selectedDate }: JobsScreenProps) {
  const queryClient = useQueryClient();
  const dateStr = selectedDate.toISOString().split('T')[0];
  const padding = getContentPadding();

  // State for hiding completed items per person
  const [hideCompletedByPerson, setHideCompletedByPerson] = useState<Record<number, boolean>>({});

  // Fetch data
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', dateStr],
    queryFn: () => jobsApi.getByDate(dateStr),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => siteSettingsApi.get(),
  });

  // Initialize hideCompleted state from user preferences
  useEffect(() => {
    const initial: Record<number, boolean> = {};
    users.forEach((user) => {
      initial[user.id] = user.hideCompletedInKiosk ?? true;
    });
    setHideCompletedByPerson(initial);
  }, [users]);

  // Toggle job completion
  const toggleJobMutation = useMutation({
    mutationFn: async ({ job, isCompleted }: { job: Job; isCompleted: boolean }) => {
      const assignment = job.assignments?.[0];
      if (!assignment) throw new Error('No assignment');

      if (isCompleted) {
        await jobAssignmentsApi.uncomplete(job.id, assignment.id, dateStr);
      } else {
        await jobAssignmentsApi.complete(job.id, assignment.id, dateStr);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', dateStr] });
    },
  });

  // Group jobs by person
  const allPeople: PersonJobs[] = React.useMemo(() => {
    const byUserId = new Map<number, PersonJobs>();
    users.forEach((u) => {
      byUserId.set(u.id, {
        userId: u.id,
        name: u.displayName,
        color: u.colorHex || '#6366f1',
        avatarUrl: u.avatarUrl,
        jobs: [],
        hideCompleted: hideCompletedByPerson[u.id] ?? true,
      });
    });

    const unassignedJobs: Job[] = [];

    jobs.forEach((job) => {
      const assignments = job.assignments || [];
      if (assignments.length > 0) {
        assignments.forEach((assignment) => {
          const person = byUserId.get(assignment.userId);
          if (person) {
            person.jobs.push({ ...job, assignments: [assignment] });
          }
        });
      } else {
        unassignedJobs.push(job);
      }
    });

    const result = Array.from(byUserId.values());
    if (unassignedJobs.length > 0) {
      result.push({
        userId: null,
        name: 'Unassigned',
        color: '#94a3b8',
        jobs: unassignedJobs,
        hideCompleted: false,
      });
    }
    return result;
  }, [jobs, users, hideCompletedByPerson]);

  const toggleHideCompleted = (userId: number | null) => {
    if (userId !== null) {
      setHideCompletedByPerson((prev) => ({
        ...prev,
        [userId]: !prev[userId],
      }));
    }
  };

  const isJobCompleted = (job: Job): boolean => {
    return job.assignments?.[0]?.isCompleted ?? false;
  };

  const handleToggleJob = (job: Job, isCompleted: boolean) => {
    toggleJobMutation.mutate({ job, isCompleted });
  };

  if (jobsLoading) {
    return <LoadingSpinner message="Loading jobs..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding }]}
        refreshControl={
          <RefreshControl
            refreshing={jobsLoading}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['jobs', dateStr] })}
          />
        }
      >
      <Text variant="headlineMedium" style={styles.header}>
        Jobs for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </Text>

      <ResponsiveGrid>
        {allPeople.map((person) => {
          const completed = person.jobs.filter((j) => isJobCompleted(j)).length;
          const total = person.jobs.length;

          return (
            <PersonJobCard
              key={`${person.userId || 'unassigned'}`}
              person={person}
              jobs={person.jobs}
              completed={completed}
              total={total}
              onToggleHideCompleted={toggleHideCompleted}
              onToggleJob={handleToggleJob}
              isJobCompleted={isJobCompleted}
            />
          );
        })}
      </ResponsiveGrid>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    // padding applied dynamically
  },
  header: {
    marginBottom: 16,
  },
});
