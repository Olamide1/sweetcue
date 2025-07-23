import { StatusBar } from 'expo-status-bar';
import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  // For now, start with auth flow (not authenticated)
  // Later we'll add auth state management
  const isAuthenticated = false;

  return (
    <>
      <RootNavigator isAuthenticated={isAuthenticated} />
      <StatusBar style="auto" />
    </>
  );
}
