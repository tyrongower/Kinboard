'use client';

import { useState, useEffect, useRef } from 'react';
import { shoppingListApi, shoppingItemApi, ShoppingList, ShoppingItem } from '@/lib/api';

interface ShoppingTabProps {
  // No props needed for now
}

export default function ShoppingTab({}: ShoppingTabProps) {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedListId, setExpandedListId] = useState<number | null>(null);
  const [newItemText, setNewItemText] = useState<Record<number, string>>({});
  const [hideBoughtByList, setHideBoughtByList] = useState<Record<number, boolean>>({});
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const isHiddenFor = (listId: number) => hideBoughtByList[listId] ?? true;
  const toggleHiddenFor = (listId: number) => {
    setHideBoughtByList((prev) => ({ ...prev, [listId]: !isHiddenFor(listId) }));
  };

  useEffect(() => {
    loadLists();
  }, []);

  // Auto refresh lists every 30 seconds
  useEffect(() => {
    const handle = setInterval(() => {
      loadLists(true);
    }, 30000);
    return () => clearInterval(handle);
  }, []);

  const loadLists = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await shoppingListApi.getAll();
      setLists(data);
    } catch (error) {
      console.error('Error loading shopping lists:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleToggleItem = async (listId: number, itemId: number) => {
    try {
      const updatedItem = await shoppingItemApi.toggleBought(listId, itemId);
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? {
                ...list,
                items: list.items.map((item) =>
                  item.id === itemId ? updatedItem : item
                ),
              }
            : list
        )
      );
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const handleToggleImportant = async (listId: number, itemId: number) => {
    try {
      const updatedItem = await shoppingItemApi.toggleImportant(listId, itemId);
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? {
                ...list,
                items: list.items.map((item) =>
                  item.id === itemId ? updatedItem : item
                ),
              }
            : list
        )
      );
    } catch (error) {
      console.error('Error toggling important:', error);
    }
  };

  const handleAddItem = async (listId: number) => {
    const text = newItemText[listId]?.trim();
    if (!text) return;

    try {
      const newItem = await shoppingItemApi.create(listId, {
        name: text,
        isBought: false,
        isImportant: false,
        displayOrder: 0,
      });
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? { ...list, items: [...list.items, newItem] }
            : list
        )
      );
      setNewItemText((prev) => ({ ...prev, [listId]: '' }));
      // Focus back on input
      inputRefs.current[listId]?.focus();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleDeleteItem = async (listId: number, itemId: number) => {
    try {
      await shoppingItemApi.delete(listId, itemId);
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? { ...list, items: list.items.filter((item) => item.id !== itemId) }
            : list
        )
      );
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleClearBought = async (listId: number) => {
    try {
      await shoppingItemApi.clearBought(listId);
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? { ...list, items: list.items.filter((item) => !item.isBought) }
            : list
        )
      );
    } catch (error) {
      console.error('Error clearing bought items:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, listId: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem(listId);
    }
  };

  const openFullScreen = (listId: number) => {
    setExpandedListId(listId);
  };

  const closeFullScreen = () => {
    setExpandedListId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>Loading shopping lists...</span>
        </div>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            No Shopping Lists
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Create lists in the Admin panel
          </p>
        </div>
      </div>
    );
  }

  // Full screen view for mobile
  if (expandedListId !== null) {
    const list = lists.find((l) => l.id === expandedListId);
    if (!list) {
      setExpandedListId(null);
      return null;
    }

    const unboughtItems = list.items.filter((i) => !i.isBought);
    const boughtItems = list.items.filter((i) => i.isBought);
    const hasImportant = unboughtItems.some((i) => i.isImportant);

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: 'var(--color-bg)' }}
      >
        {/* Header */}
        <header
          className="flex items-center gap-4 px-4 py-3 border-b"
          style={{
            background: `${list.colorHex}22`,
            borderColor: `${list.colorHex}44`,
          }}
        >
          <button
            onClick={closeFullScreen}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl"
            style={{ background: 'var(--color-surface)' }}
          >
            ←
          </button>
          <div className="flex items-center gap-3 flex-1">
            {list.avatarUrl ? (
              <img
                src={list.avatarUrl}
                alt={list.name}
                className="w-10 h-10 rounded-full object-cover"
                style={{ border: `2px solid ${list.colorHex}` }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: list.colorHex, color: 'white' }}
              >
                {list.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                {list.name}
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {unboughtItems.length} item{unboughtItems.length !== 1 ? 's' : ''} remaining
              </p>
            </div>
          </div>
          {hasImportant && (
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ background: 'var(--color-warning-muted)', color: 'var(--color-warning)' }}
            >
              ⚠️ Important
            </span>
          )}
          {/* Toggle visibility button */}
          <button
            onClick={() => toggleHiddenFor(list.id)}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
            style={{ 
              background: 'var(--color-surface)',
              color: isHiddenFor(list.id) ? 'var(--color-text-muted)' : 'var(--color-text)'
            }}
            title={isHiddenFor(list.id) ? 'Show bought items' : 'Hide bought items'}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {isHiddenFor(list.id) ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
          {/* Clear bought items button */}
          {boughtItems.length > 0 && (
            <button
              onClick={() => handleClearBought(list.id)}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
              style={{ 
                background: 'var(--color-error-muted)',
                color: 'var(--color-error)'
              }}
              title="Clear all bought items"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </header>

        {/* Add Item Input */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-divider)' }}>
          <div className="flex gap-2">
            <input
              ref={(el) => { inputRefs.current[list.id] = el; }}
              type="text"
              className="input flex-1"
              placeholder="Add item..."
              value={newItemText[list.id] || ''}
              onChange={(e) => setNewItemText((prev) => ({ ...prev, [list.id]: e.target.value }))}
              onKeyDown={(e) => handleKeyDown(e, list.id)}
              style={{ fontSize: '16px' }} // Prevent zoom on iOS
            />
            <button
              onClick={() => handleAddItem(list.id)}
              className="btn btn-primary px-6"
              disabled={!newItemText[list.id]?.trim()}
            >
              Add
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-auto p-4">
          {unboughtItems.length === 0 && boughtItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-5xl mb-4">✨</div>
              <p style={{ color: 'var(--color-text-secondary)' }}>List is empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Unbought items - important first */}
              {[...unboughtItems]
                .sort((a, b) => (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0))
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-4 rounded-xl"
                    style={{
                      background: item.isImportant ? 'var(--color-warning-muted)' : 'var(--color-surface)',
                      border: `1px solid ${item.isImportant ? 'var(--color-warning)' : 'var(--color-divider)'}`,
                    }}
                  >
                    <button
                      onClick={() => handleToggleItem(list.id, item.id)}
                      className="w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: list.colorHex }}
                    />
                    <span
                      className="flex-1 text-lg"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {item.name}
                    </span>
                    <button
                      onClick={() => handleToggleImportant(list.id, item.id)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{
                        background: item.isImportant ? 'var(--color-warning)' : 'var(--color-surface)',
                        color: item.isImportant ? 'white' : 'var(--color-text-muted)',
                      }}
                      title={item.isImportant ? 'Remove important' : 'Mark as important'}
                    >
                      ⚠️
                    </button>
                    <button
                      onClick={() => handleDeleteItem(list.id, item.id)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ color: 'var(--color-error)' }}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                ))}

              {/* Bought items */}
              {boughtItems.length > 0 && !isHiddenFor(list.id) && (
                <>
                  <div className="flex items-center pt-4 pb-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Bought ({boughtItems.length})
                    </span>
                  </div>
                  {boughtItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-4 rounded-xl opacity-60"
                      style={{ background: 'var(--color-surface)' }}
                    >
                      <button
                        onClick={() => handleToggleItem(list.id, item.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: list.colorHex }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      <span
                        className="flex-1 text-lg line-through"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {item.name}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid view for kiosk
  return (
    <div className="w-full">
      <div className="card-grid">
        {lists.map((list) => {
          const unboughtItems = list.items.filter((i) => !i.isBought);
          const boughtCount = list.items.filter((i) => i.isBought).length;
          const hasImportant = unboughtItems.some((i) => i.isImportant);
          const importantCount = unboughtItems.filter((i) => i.isImportant).length;

          return (
            <div key={list.id} className="animate-slide-up">
              <div
                className="card h-full"
                style={{
                  background: `${list.colorHex}14`,
                  borderColor: `${list.colorHex}33`,
                }}
              >
                <div className="p-4">
                  {/* List Header */}
                  <div className="flex items-center gap-3 mb-4">
                    {list.avatarUrl ? (
                      <img
                        src={list.avatarUrl}
                        alt={list.name}
                        className="avatar avatar-lg object-cover"
                        style={{ border: `2px solid ${list.colorHex}` }}
                      />
                    ) : (
                      <div
                        className="avatar avatar-lg"
                        style={{ background: list.colorHex, color: 'white' }}
                      >
                        {list.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-lg truncate"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {list.name}
                      </h3>
                      <p style={{ color: 'var(--color-text-secondary)' }}>
                        {unboughtItems.length} item{unboughtItems.length !== 1 ? 's' : ''}
                        {boughtCount > 0 && ` • ${boughtCount} bought`}
                      </p>
                    </div>
                    {hasImportant && (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium shrink-0"
                        style={{ background: 'var(--color-warning-muted)', color: 'var(--color-warning)' }}
                      >
                        {importantCount} ⚠️
                      </span>
                    )}
                    {/* Toggle visibility button */}
                    <button
                      onClick={() => toggleHiddenFor(list.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
                      style={{ 
                        background: 'var(--color-surface)',
                        color: isHiddenFor(list.id) ? 'var(--color-text-muted)' : 'var(--color-text)'
                      }}
                      title={isHiddenFor(list.id) ? 'Show bought items' : 'Hide bought items'}
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        {isHiddenFor(list.id) ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                    {/* Clear bought items button */}
                    {boughtCount > 0 && (
                      <button
                        onClick={() => handleClearBought(list.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
                        style={{ 
                          background: 'var(--color-error-muted)',
                          color: 'var(--color-error)'
                        }}
                        title="Clear all bought items"
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Add Item Input */}
                  <div className="flex gap-2 mb-4">
                    <input
                      ref={(el) => { inputRefs.current[list.id] = el; }}
                      type="text"
                      className="input flex-1 text-sm"
                      placeholder="Add item..."
                      value={newItemText[list.id] || ''}
                      onChange={(e) => setNewItemText((prev) => ({ ...prev, [list.id]: e.target.value }))}
                      onKeyDown={(e) => handleKeyDown(e, list.id)}
                    />
                    <button
                      onClick={() => handleAddItem(list.id)}
                      className="btn btn-primary px-3"
                      disabled={!newItemText[list.id]?.trim()}
                    >
                      +
                    </button>
                  </div>

                  {/* Items List (limited to 5 in grid view) */}
                  <div className="flex flex-col gap-2">
                    {unboughtItems.length === 0 && (isHiddenFor(list.id) || boughtCount === 0) ? (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                          style={{ background: 'var(--color-success-muted)' }}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--color-success)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--color-success)' }}
                        >
                          All done!
                        </p>
                      </div>
                    ) : (
                      <>
                        {[...unboughtItems]
                          .sort((a, b) => (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0))
                          .slice(0, 5)
                          .map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleToggleItem(list.id, item.id)}
                              className="flex items-center gap-3 p-3 rounded-xl transition-all text-left w-full group"
                              style={{
                                background: item.isImportant ? 'var(--color-warning-muted)' : 'var(--color-surface)',
                                border: `1px solid ${item.isImportant ? 'var(--color-warning)' : 'var(--color-divider)'}`,
                              }}
                            >
                              <div
                                className="w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                                style={{ borderColor: list.colorHex }}
                              />
                              <span
                                className="flex-1 text-sm truncate"
                                style={{ color: 'var(--color-text)' }}
                              >
                                {item.name}
                              </span>
                              {item.isImportant && (
                                <span className="text-sm">⚠️</span>
                              )}
                            </button>
                          ))}
                        {unboughtItems.length > 5 && (
                          <p
                            className="text-sm text-center py-2"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            +{unboughtItems.length - 5} more
                          </p>
                        )}

                        {/* Bought items - shown when toggle is off */}
                        {boughtCount > 0 && !isHiddenFor(list.id) && (
                          <>
                            <div className="flex items-center pt-2 pb-1">
                              <span
                                className="text-xs font-medium"
                                style={{ color: 'var(--color-text-muted)' }}
                              >
                                Bought ({boughtCount})
                              </span>
                            </div>
                            {list.items
                              .filter((i) => i.isBought)
                              .slice(0, 3)
                              .map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => handleToggleItem(list.id, item.id)}
                                  className="flex items-center gap-3 p-3 rounded-xl transition-all text-left w-full group opacity-60"
                                  style={{ background: 'var(--color-surface)' }}
                                >
                                  <div
                                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                    style={{ background: list.colorHex }}
                                  >
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="white"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </div>
                                  <span
                                    className="flex-1 text-sm truncate line-through"
                                    style={{ color: 'var(--color-text-muted)' }}
                                  >
                                    {item.name}
                                  </span>
                                </button>
                              ))}
                            {boughtCount > 3 && (
                              <p
                                className="text-xs text-center py-1"
                                style={{ color: 'var(--color-text-muted)' }}
                              >
                                +{boughtCount - 3} more bought
                              </p>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Full Screen Button */}
                  <button
                    onClick={() => openFullScreen(list.id)}
                    className="w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: list.colorHex,
                      color: 'white',
                    }}
                  >
                    Open Full List
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
