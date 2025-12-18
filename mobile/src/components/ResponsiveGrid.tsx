// Responsive grid wrapper component
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { getColumnCount, getContentPadding } from '../utils/responsive';

interface ResponsiveGridProps {
  children: React.ReactNode[];
}

export default function ResponsiveGrid({ children }: ResponsiveGridProps) {
  const { width } = useWindowDimensions();
  const columnCount = getColumnCount();
  const padding = getContentPadding();

  return (
    <View style={[styles.grid, { gap: padding }]}>
      {children.map((child, index) => (
        <View
          key={index}
          style={[
            styles.gridItem,
            { width: columnCount > 1 ? `${100 / columnCount - 2}%` : '100%' },
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    marginBottom: 16,
  },
});
