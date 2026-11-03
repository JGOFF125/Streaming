import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export const unstable_settings = { initialRouteName: 'index' };

export default function RootLayout() {
  return <>
    <StatusBar style="light" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0b1020' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="netflix" />
    </Stack>
  </>;
}
