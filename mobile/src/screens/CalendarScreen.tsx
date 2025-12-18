// Calendar screen - displays calendar events with day/week/month views (REFACTORED)
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, SegmentedButtons, Button, Chip, useTheme } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useQuery } from '@tanstack/react-query';
import { calendarEventsApi, calendarsApi, usersApi, jobsApi, siteSettingsApi } from '../api';
import { getContentPadding, getContentMaxWidth } from '../utils/responsive';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import CalendarEventCard from '../components/calendar/CalendarEventCard';
import UserCompletionPills from '../components/calendar/UserCompletionPills';

interface CalendarScreenProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

type ViewType = 'Day' | 'Week' | 'Month';

export default function CalendarScreen({ selectedDate, setSelectedDate }: CalendarScreenProps) {
  const theme = useTheme();
  const [view, setView] = useState<ViewType>('Day');
  const [visibleSourceIds, setVisibleSourceIds] = useState<Set<number>>(new Set());
  const padding = getContentPadding();
  const maxWidth = getContentMaxWidth();

  const dateStr = selectedDate.toISOString().split('T')[0];

  // Fetch data
  const { data: sources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ['calendars'],
    queryFn: () => calendarsApi.getAll(),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => siteSettingsApi.get(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', dateStr],
    queryFn: () => jobsApi.getByDate(dateStr),
  });

  // Initialize visible sources
  React.useEffect(() => {
    if (sources.length > 0 && visibleSourceIds.size === 0) {
      setVisibleSourceIds(new Set(sources.filter((s) => s.enabled).map((s) => s.id)));
    }
  }, [sources]);

  // Calculate date range
  const { rangeStart, rangeEnd } = React.useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);

    if (view === 'Day') {
      end.setDate(end.getDate() + 1);
    } else if (view === 'Week') {
      const day = start.getDay();
      const diff = (day + 6) % 7;
      start.setDate(start.getDate() - diff);
      end.setDate(start.getDate() + 7);
    } else {
      // Month view
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setDate(end.getDate() + 1);
    }

    return { rangeStart: start, rangeEnd: end };
  }, [selectedDate, view]);

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['calendar-events', rangeStart.toISOString(), rangeEnd.toISOString(), Array.from(visibleSourceIds)],
    queryFn: () =>
      calendarEventsApi.get(rangeStart.toISOString(), rangeEnd.toISOString(), Array.from(visibleSourceIds)),
    enabled: visibleSourceIds.size > 0,
    refetchInterval: (settings?.calendarRefreshSeconds || 30) * 1000,
  });

  // Calculate completion stats
  const completionStats = React.useMemo(() => {
    const stats: Record<number, { total: number; open: number }> = {};
    jobs.forEach((job) => {
      job.assignments?.forEach((assignment) => {
        if (!stats[assignment.userId]) {
          stats[assignment.userId] = { total: 0, open: 0 };
        }
        stats[assignment.userId].total += 1;
        if (!assignment.isCompleted) {
          stats[assignment.userId].open += 1;
        }
      });
    });
    return stats;
  }, [jobs]);

  // Filter events for selected day
  const dayEvents = events.filter((e) => {
    const eventStart = new Date(e.start);
    const eventEnd = new Date(e.end);
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return eventEnd > dayStart && eventStart < dayEnd;
  });

  const toggleSource = (id: number) => {
    setVisibleSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (sourcesLoading) {
    return <LoadingSpinner message="Loading calendar..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding, maxWidth, alignSelf: 'center', width: '100%' }]}
      >
      {/* User completion pills */}
      <UserCompletionPills users={users} completionStats={completionStats} />

      {/* View selector */}
      <SegmentedButtons
        value={view}
        onValueChange={(value) => setView(value as ViewType)}
        buttons={[
          { value: 'Day', label: 'Day' },
          { value: 'Week', label: 'Week' },
          { value: 'Month', label: 'Month' },
        ]}
        style={styles.viewSelector}
      />

      {/* Today button */}
      <View style={styles.controls}>
        <Button mode="contained" onPress={() => setSelectedDate(new Date())}>
          Today
        </Button>
      </View>

      {/* Calendar source filters */}
      {sources.length > 1 && (
        <View style={styles.sourcesContainer}>
          {sources.map((source) => (
            <Chip
              key={source.id}
              selected={visibleSourceIds.has(source.id)}
              onPress={() => toggleSource(source.id)}
              style={[
                styles.sourceChip,
                visibleSourceIds.has(source.id) && { backgroundColor: source.colorHex },
              ]}
              textStyle={{ color: visibleSourceIds.has(source.id) ? 'white' : theme.colors.onSurface }}
            >
              {source.name}
            </Chip>
          ))}
        </View>
      )}

      {/* Calendar */}
      <Calendar
        current={dateStr}
        onDayPress={(day) => setSelectedDate(new Date(day.dateString))}
        markedDates={{
          [dateStr]: { selected: true, selectedColor: theme.colors.primary },
        }}
        theme={{
          calendarBackground: theme.colors.elevation.level1,
          textSectionTitleColor: theme.colors.onSurfaceVariant,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.onPrimary,
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.onSurface,
          textDisabledColor: theme.colors.onSurfaceDisabled,
          dotColor: theme.colors.primary,
          selectedDotColor: theme.colors.onPrimary,
          arrowColor: theme.colors.primary,
          disabledArrowColor: theme.colors.onSurfaceDisabled,
          monthTextColor: theme.colors.onSurface,
          indicatorColor: theme.colors.primary,
          textDayFontFamily: 'System',
          textMonthFontFamily: 'System',
          textDayHeaderFontFamily: 'System',
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
      />

      {/* Day events */}
      <View style={styles.eventsContainer}>
        <Text variant="titleLarge" style={[styles.eventsTitle, { color: theme.colors.onSurface }]}>
          Events for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
        {eventsLoading ? (
          <LoadingSpinner size="small" message="" />
        ) : dayEvents.length === 0 ? (
          <EmptyState icon="📭" title="No events scheduled" />
        ) : (
          dayEvents.map((event, idx) => <CalendarEventCard key={idx} event={event} />)
        )}
      </View>
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
    // padding, maxWidth, and centering applied dynamically
  },
  viewSelector: {
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  sourcesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sourceChip: {
    marginRight: 8,
  },
  eventsContainer: {
    marginTop: 16,
  },
  eventsTitle: {
    marginBottom: 12,
  },
});
