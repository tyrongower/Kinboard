// Bottom tab navigation for main screens
import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import CalendarScreen from '../screens/CalendarScreen';
import JobsScreen from '../screens/JobsScreen';
import ShoppingScreen from '../screens/ShoppingScreen';

export type MainTabParamList = {
  Calendar: undefined;
  Jobs: undefined;
  Shopping: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const theme = useTheme();
  // Shared date state for Calendar and Jobs screens
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <Tab.Navigator
      initialRouteName="Jobs"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.elevation.level2,
          borderTopColor: theme.colors.outline,
        },
      }}
    >
      <Tab.Screen
        name="Calendar"
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="calendar" color={color} size={24} />
          ),
        }}
      >
        {() => <CalendarScreen selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
      </Tab.Screen>
      <Tab.Screen
        name="Jobs"
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="check-circle" color={color} size={24} />
          ),
        }}
      >
        {() => <JobsScreen selectedDate={selectedDate} />}
      </Tab.Screen>
      <Tab.Screen
        name="Shopping"
        component={ShoppingScreen}
        options={{
          tabBarLabel: 'Shopping',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cart" color={color} size={24} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
