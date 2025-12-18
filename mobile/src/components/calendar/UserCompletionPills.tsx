// User completion pills component for calendar screen
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { User } from '../../types';

interface UserCompletionPillsProps {
  users: User[];
  completionStats: Record<number, { total: number; open: number }>;
}

export default function UserCompletionPills({ users, completionStats }: UserCompletionPillsProps) {
  return (
    <View style={styles.container}>
      {users.map((user) => {
        const stat = completionStats[user.id] || { total: 0, open: 0 };
        return (
          <Chip
            key={user.id}
            avatar={
              <View style={[styles.avatar, { backgroundColor: user.colorHex }]}>
                <Text style={styles.avatarText}>{user.displayName[0]}</Text>
              </View>
            }
            style={[styles.pill, { backgroundColor: `${user.colorHex}22` }]}
            textStyle={{ color: '#1e293b' }}
          >
            {user.displayName} {stat.open}/{stat.total || 0}
          </Chip>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  pill: {
    marginHorizontal: 4,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 12,
  },
});
