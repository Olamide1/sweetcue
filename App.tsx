import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { notificationService } from './src/services/notifications';
import { notificationScheduler } from './src/services/notificationScheduler';

export default function App() {
  // Track authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await require('./src/lib/supabase').default.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
    const { data: listener } = require('./src/lib/supabase').default.auth.onAuthStateChange((event: any, session: any) => {
      setIsAuthenticated(!!session);
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  // Initialize notification service on app start
  useEffect(() => {
    notificationService.initialize();
  }, []);

  // Schedule notifications only after authentication
  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(async () => {
        try {
          await notificationScheduler.scheduleAllNotifications();
          console.log('[App] Notifications scheduled successfully');
        } catch (error) {
          console.error('[App] Error scheduling notifications:', error);
        }
      }, 2000);
    }
  }, [isAuthenticated]);

  return (
    <>
      <RootNavigator isAuthenticated={isAuthenticated} />
      <StatusBar style="auto" />
    </>
  );
}
