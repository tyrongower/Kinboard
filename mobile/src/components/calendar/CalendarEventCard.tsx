// Calendar event card component
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, useTheme } from 'react-native-paper';
import { CalendarEventItem } from '../../types';

interface CalendarEventCardProps {
  event: CalendarEventItem;
}

export default function CalendarEventCard({ event }: CalendarEventCardProps) {
  const theme = useTheme();

  const formatTimeRange = () => {
    if (event.allDay) return 'All day';
    const start = new Date(event.start);
    const end = new Date(event.end);
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <Card
      style={[
        styles.card,
        { borderLeftColor: event.colorHex, backgroundColor: `${event.colorHex}14` },
      ]}
    >
      <Card.Content>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {event.title}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              {formatTimeRange()}
            </Text>
          </View>
          <Chip textStyle={{ fontSize: 11, color: event.colorHex }} style={{ backgroundColor: `${event.colorHex}22` }}>
            {event.sourceName}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
});
