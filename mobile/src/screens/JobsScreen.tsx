// Jobs screen - displays jobs by person with completion tracking (REFACTORED)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, findNodeHandle, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi, jobAssignmentsApi, usersApi, siteSettingsApi } from '../api';
import { Job, User } from '../types';
import { getContentPadding } from '../utils/responsive';
import LoadingSpinner from '../components/LoadingSpinner';
import ResponsiveGrid from '../components/ResponsiveGrid';
import PersonJobCard from '../components/jobs/PersonJobCard';
import TvPressable from '../components/tv/TvPressable';
import { IS_TV } from '../platform/isTv';

interface JobsScreenProps {
  selectedDate: Date;
  setSelectedDate?: (date: Date) => void;
  variant?: 'mobile' | 'tv';
}

interface PersonJobs {
  userId: number | null;
  name: string;
  color: string;
  avatarUrl?: string | null;
  jobs: Job[];
  hideCompleted: boolean;
}

export default function JobsScreen({ selectedDate, setSelectedDate, variant = 'mobile' }: JobsScreenProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const dateStr = selectedDate.toISOString().split('T')[0];
  const { width } = useWindowDimensions();
  const padding = getContentPadding(width);
  const isTv = variant === 'tv' || IS_TV;

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
  const allPeople: PersonJobs[] = useMemo(() => {
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

  const goToToday = () => {
    if (!setSelectedDate) return;
    setSelectedDate(new Date());
  };

  const addDays = (days: number) => {
    if (!setSelectedDate) return;
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  return (
    <SafeAreaView style={styles.container} edges={isTv ? ['top', 'left', 'right'] : ['top']}>
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
        <View style={[styles.headerRow, isTv && styles.headerRowTv]}>
          <View style={styles.headerText}>
            <Text variant={isTv ? 'headlineLarge' : 'headlineMedium'} style={styles.header}>
              Jobs
            </Text>
            <Text variant={isTv ? 'titleLarge' : 'titleMedium'} style={styles.subheader}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>

          {isTv && setSelectedDate && (
            <View style={styles.tvControls}>
              <TvPressable
                accessibilityRole="button"
                accessibilityLabel="Previous day"
                onPress={() => addDays(-1)}
                style={styles.tvButton}
                focusedStyle={{ backgroundColor: theme.colors.elevation.level3 }}
              >
                <Text variant="titleMedium" style={[styles.tvButtonText, { color: theme.colors.onSurface }]}>
                  Prev
                </Text>
              </TvPressable>

              <TvPressable
                accessibilityRole="button"
                accessibilityLabel="Go to today"
                onPress={goToToday}
                style={styles.tvButton}
                focusedStyle={{ backgroundColor: theme.colors.elevation.level3 }}
              >
                <Text variant="titleMedium" style={[styles.tvButtonText, { color: theme.colors.onSurface }]}>
                  Today
                </Text>
              </TvPressable>

              <TvPressable
                accessibilityRole="button"
                accessibilityLabel="Next day"
                onPress={() => addDays(1)}
                style={styles.tvButton}
                focusedStyle={{ backgroundColor: theme.colors.elevation.level3 }}
              >
                <Text variant="titleMedium" style={[styles.tvButtonText, { color: theme.colors.onSurface }]}>
                  Next
                </Text>
              </TvPressable>
            </View>
          )}
        </View>

      {isTv ? (
        <View style={{ paddingBottom: 8 }}>
          {allPeople.map((person, index) => {
              const completed = person.jobs.filter((j) => isJobCompleted(j)).length;
              const total = person.jobs.length;

              return (
                <View
                  key={`${person.userId || 'unassigned'}`}
                  style={{ marginBottom: 16 }}
                  focusable={false}
                >
                  <PersonJobCard
                    variant="tv"
                    isFirstCard={index === 0}
                    person={person}
                    jobs={person.jobs}
                    completed={completed}
                    total={total}
                    onToggleHideCompleted={toggleHideCompleted}
                    onToggleJob={handleToggleJob}
                    isJobCompleted={isJobCompleted}
                  />
                </View>
              );
            })}
        </View>
      ) : (
        <ResponsiveGrid>
          {allPeople.map((person) => {
            const completed = person.jobs.filter((j) => isJobCompleted(j)).length;
            const total = person.jobs.length;

            return (
              <PersonJobCard
                key={`${person.userId || 'unassigned'}`}
                variant="mobile"
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
      )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  headerRowTv: {
    marginBottom: 24,
  },
  headerText: {
    marginRight: 16,
  },
  header: {
    // spacing handled by headerRow
  },
  subheader: {
    opacity: 0.9,
    marginTop: 2,
  },
  tvControls: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  tvButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tvButtonText: {
    // inherits onSurface
  },
});
