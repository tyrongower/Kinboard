// Shopping screen - displays shopping lists with add/toggle/delete functionality (REFACTORED)
import React, { useState } from 'react';
import { ScrollView, StyleSheet, RefreshControl, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shoppingListsApi, shoppingItemsApi } from '../api';
import { getContentPadding } from '../utils/responsive';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ResponsiveGrid from '../components/ResponsiveGrid';
import ShoppingListCard from '../components/shopping/ShoppingListCard';

export default function ShoppingScreen() {
  const queryClient = useQueryClient();
  const padding = getContentPadding();

  const [hideCompleted, setHideCompleted] = useState<Record<number, boolean>>({});

  // Fetch shopping lists
  const { data: lists = [], isLoading, refetch } = useQuery({
    queryKey: ['shopping-lists'],
    queryFn: () => shoppingListsApi.getAll(),
    refetchInterval: 30000,
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: ({ listId, name }: { listId: number; name: string }) =>
      shoppingItemsApi.create(listId, { name, isBought: false, isImportant: false, displayOrder: 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });

  // Toggle bought mutation
  const toggleBoughtMutation = useMutation({
    mutationFn: ({ listId, itemId }: { listId: number; itemId: number }) =>
      shoppingItemsApi.toggleBought(listId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });

  // Toggle important mutation
  const toggleImportantMutation = useMutation({
    mutationFn: ({ listId, itemId }: { listId: number; itemId: number }) =>
      shoppingItemsApi.toggleImportant(listId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: ({ listId, itemId }: { listId: number; itemId: number }) =>
      shoppingItemsApi.delete(listId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });

  // Clear bought items mutation
  const clearBoughtMutation = useMutation({
    mutationFn: (listId: number) => shoppingItemsApi.clearBought(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });

  const toggleHideCompleted = (listId: number) => {
    setHideCompleted((prev) => ({ ...prev, [listId]: !prev[listId] }));
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading shopping lists..." />;
  }

  if (lists.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="No Shopping Lists"
        message="Create lists in the Admin panel"
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
      <ResponsiveGrid>
        {lists.map((list) => (
          <ShoppingListCard
            key={list.id}
            list={list}
            hideCompleted={hideCompleted[list.id] ?? true}
            onToggleHideCompleted={() => toggleHideCompleted(list.id)}
            onAddItem={(name) => addItemMutation.mutate({ listId: list.id, name })}
            onToggleBought={(itemId) => toggleBoughtMutation.mutate({ listId: list.id, itemId })}
            onToggleImportant={(itemId) => toggleImportantMutation.mutate({ listId: list.id, itemId })}
            onDeleteItem={(itemId) => deleteItemMutation.mutate({ listId: list.id, itemId })}
            onClearBought={() => clearBoughtMutation.mutate(list.id)}
          />
        ))}
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
});
