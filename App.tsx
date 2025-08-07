import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { notificationService } from './src/services/notifications';
import { notificationScheduler } from './src/services/notificationScheduler';

export default function App() {
  // Track authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificationsScheduled, setNotificationsScheduled] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

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

  // Schedule notifications only after user interaction and authentication
  useEffect(() => {
    console.log('[App] useEffect triggered:', { isAuthenticated, userInteracted, notificationsScheduled });
    
    if (isAuthenticated && userInteracted && !notificationsScheduled) {
      console.log('[App] All conditions met, scheduling notifications...');
      
      // Use a longer delay to ensure app is fully loaded and user has had time to interact
      const scheduleNotifications = async () => {
        try {
          // Check if notifications are already scheduled
          const existingNotifications = await notificationScheduler.getScheduledNotifications();
          if (existingNotifications.length === 0) {
            console.log('[App] No existing notifications found, scheduling new ones...');
            await notificationScheduler.scheduleAllNotifications();
            console.log('[App] Notifications scheduled successfully');
          } else {
            console.log('[App] Notifications already scheduled, skipping...');
          }
          setNotificationsScheduled(true);
        } catch (error) {
          console.error('[App] Error scheduling notifications:', error);
        }
      };

      // Schedule after a longer delay to ensure app is fully initialized
      setTimeout(scheduleNotifications, 5000);
    } else {
      console.log('[App] Conditions not met:', { 
        isAuthenticated, 
        userInteracted, 
        notificationsScheduled,
        missing: {
          notAuthenticated: !isAuthenticated,
          notInteracted: !userInteracted,
          alreadyScheduled: notificationsScheduled
        }
      });
    }
  }, [isAuthenticated, userInteracted, notificationsScheduled]);

  // Track user interaction
  const handleUserInteraction = () => {
    console.log('[App] handleUserInteraction called, current state:', { userInteracted });
    if (!userInteracted) {
      console.log('[App] User interaction detected, enabling notification scheduling');
      setUserInteracted(true);
    } else {
      console.log('[App] User interaction already detected, ignoring');
    }
  };

  return (
    <>
      <RootNavigator isAuthenticated={isAuthenticated} onUserInteraction={handleUserInteraction} />
      <StatusBar style="auto" />
    </>
  );
}
