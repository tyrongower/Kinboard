// Shopping list card component
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput, Button, IconButton, Chip } from 'react-native-paper';
import { ShoppingList, ShoppingItem } from '../../types';
import UserAvatar from '../UserAvatar';
import ShoppingItemRow from './ShoppingItemRow';

interface ShoppingListCardProps {
  list: ShoppingList;
  hideCompleted: boolean;
  onToggleHideCompleted: () => void;
  onAddItem: (name: string) => void;
  onToggleBought: (itemId: number) => void;
  onToggleImportant: (itemId: number) => void;
  onDeleteItem: (itemId: number) => void;
  onClearBought: () => void;
}

export default function ShoppingListCard({
  list,
  hideCompleted,
  onToggleHideCompleted,
  onAddItem,
  onToggleBought,
  onToggleImportant,
  onDeleteItem,
  onClearBought,
}: ShoppingListCardProps) {
  const [newItemText, setNewItemText] = useState('');

  const unboughtItems = list.items.filter((i) => !i.isBought);
  const boughtItems = list.items.filter((i) => i.isBought);
  const hasImportant = unboughtItems.some((i) => i.isImportant);
  const importantCount = unboughtItems.filter((i) => i.isImportant).length;

  // Sort: important first
  const sortedUnbought = [...unboughtItems].sort(
    (a, b) => (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0)
  );

  const handleAddItem = () => {
    const text = newItemText.trim();
    if (!text) return;
    onAddItem(text);
    setNewItemText('');
  };

  return (
    <Card style={[styles.card, { borderColor: list.colorHex, backgroundColor: `${list.colorHex}14` }]}>
      <Card.Content>
        {/* List header */}
        <View style={styles.header}>
          <View style={styles.info}>
            <UserAvatar name={list.name} avatarUrl={list.avatarUrl} color={list.colorHex} />
            <View style={styles.text}>
              <Text variant="titleMedium" style={styles.name}>
                {list.name}
              </Text>
              <Text variant="bodySmall" style={styles.stats}>
                {unboughtItems.length} item{unboughtItems.length !== 1 ? 's' : ''}
                {boughtItems.length > 0 && ` • ${boughtItems.length} bought`}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            {hasImportant && (
              <Chip textStyle={{ fontSize: 10 }} style={styles.importantChip}>
                {importantCount} ⚠️
              </Chip>
            )}
            <IconButton icon={hideCompleted ? 'eye-off' : 'eye'} size={18} onPress={onToggleHideCompleted} />
            {boughtItems.length > 0 && (
              <IconButton icon="delete" iconColor="#ef4444" size={18} onPress={onClearBought} />
            )}
          </View>
        </View>

        {/* Add item input */}
        <View style={styles.addItemRow}>
          <TextInput
            mode="outlined"
            placeholder="Add item..."
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={handleAddItem}
            style={styles.input}
            dense
          />
          <Button mode="contained" onPress={handleAddItem} disabled={!newItemText.trim()} style={styles.addButton}>
            Add
          </Button>
        </View>

        {/* Items */}
        {unboughtItems.length === 0 && (hideCompleted || boughtItems.length === 0) ? (
          <View style={styles.emptyState}>
            <Text variant="titleMedium" style={{ color: '#34d399' }}>
              ✓ All done!
            </Text>
          </View>
        ) : (
          <>
            {sortedUnbought.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                color={list.colorHex}
                onToggleBought={() => onToggleBought(item.id)}
                onToggleImportant={() => onToggleImportant(item.id)}
                onDelete={() => onDeleteItem(item.id)}
              />
            ))}

            {/* Bought items */}
            {boughtItems.length > 0 && !hideCompleted && (
              <>
                <Text variant="labelMedium" style={styles.boughtHeader}>
                  Bought ({boughtItems.length})
                </Text>
                {boughtItems.map((item) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    color={list.colorHex}
                    onToggleBought={() => onToggleBought(item.id)}
                    isBought
                  />
                ))}
              </>
            )}
          </>
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  importantChip: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    height: 28,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
  },
  addButton: {
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  boughtHeader: {
    marginTop: 16,
    marginBottom: 4,
  },
});
