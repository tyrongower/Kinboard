// Shopping item row component
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Checkbox, IconButton, useTheme } from 'react-native-paper';
import { ShoppingItem } from '../../types';

interface ShoppingItemRowProps {
  item: ShoppingItem;
  color: string;
  onToggleBought: () => void;
  onToggleImportant?: () => void;
  onDelete?: () => void;
  isBought?: boolean;
}

export default function ShoppingItemRow({
  item,
  color,
  onToggleBought,
  onToggleImportant,
  onDelete,
  isBought = false,
}: ShoppingItemRowProps) {
  const theme = useTheme();

  return (
    <Card
      style={[
        styles.card,
        item.isImportant && !isBought && {
          backgroundColor: 'rgba(251, 191, 36, 0.15)',
          borderColor: '#fbbf24'
        },
        isBought && styles.boughtCard,
      ]}
    >
      <Card.Content style={styles.content}>
        <Checkbox
          status={isBought ? 'checked' : 'unchecked'}
          onPress={onToggleBought}
          color={color}
        />
        <Text
          variant="bodyLarge"
          style={[
            { color: theme.colors.onSurface },
            isBought && {
              textDecorationLine: 'line-through',
              color: theme.colors.onSurfaceVariant
            }
          ]}
        >
          {item.name}
        </Text>
        {!isBought && onToggleImportant && (
          <IconButton
            icon="alert"
            iconColor={item.isImportant ? '#fbbf24' : theme.colors.onSurfaceVariant}
            size={20}
            onPress={onToggleImportant}
          />
        )}
        {!isBought && onDelete && (
          <IconButton icon="close" iconColor="#f87171" size={20} onPress={onDelete} />
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    elevation: 1,
  },
  boughtCard: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
});
