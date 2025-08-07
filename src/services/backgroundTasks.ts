import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { notificationScheduler } from './notificationScheduler';

const BACKGROUND_FETCH_TASK = 'background-fetch';

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('[BackgroundTask] Background fetch started - TEMPORARILY DISABLED');
    
    // TEMPORARILY DISABLED - Skip all background notification scheduling
    console.log('[BackgroundTask] Background notifications temporarily disabled for debugging');
    return BackgroundFetch.BackgroundFetchResult.NoData;
    
    // Use the same smart scheduling logic as the main scheduler
    try {
      // Check if we should schedule notifications based on user activity
      const shouldSchedule = await notificationScheduler.shouldScheduleNotifications();
      if (!shouldSchedule) {
        console.log('[BackgroundTask] User activity check failed, skipping notifications');
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Only schedule if user has been active recently
      await notificationScheduler.scheduleAllNotifications();
      console.log('[BackgroundTask] Notifications rescheduled successfully');
    } catch (notificationError) {
      console.error('[BackgroundTask] Error rescheduling notifications:', notificationError);
      // Don't fail the entire background task if notifications fail
    }
    
    console.log('[BackgroundTask] Background fetch completed successfully');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[BackgroundTask] Background fetch failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export class BackgroundTaskService {
  /**
   * Register background fetch task
   */
  static async registerBackgroundFetch(): Promise<void> {
    try {
      // Check if background fetch is already registered
      const status = await BackgroundFetch.getStatusAsync();
      if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
        console.log('[BackgroundTask] Background fetch already registered');
        return;
      }

      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60 * 15, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('[BackgroundTask] Background fetch registered successfully');
    } catch (error) {
      console.error('[BackgroundTask] Error registering background fetch:', error);
      // Don't throw - let the app continue without background tasks
    }
  }

  /**
   * Unregister background fetch task
   */
  static async unregisterBackgroundFetch(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('[BackgroundTask] Background fetch unregistered successfully');
    } catch (error) {
      console.error('[BackgroundTask] Error unregistering background fetch:', error);
    }
  }

  /**
   * Get background fetch status
   */
  static async getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
    try {
      return await BackgroundFetch.getStatusAsync();
    } catch (error) {
      console.error('[BackgroundTask] Error getting background fetch status:', error);
      return BackgroundFetch.BackgroundFetchStatus.Restricted;
    }
  }

  /**
   * Manually trigger background fetch for testing
   */
  static async triggerBackgroundFetch(): Promise<void> {
    try {
      console.log('[BackgroundTask] Manually triggering background fetch...');
      
      // Check if we should schedule notifications based on user activity
      const shouldSchedule = await notificationScheduler.shouldScheduleNotifications();
      if (!shouldSchedule) {
        console.log('[BackgroundTask] User activity check failed, skipping manual trigger');
        return;
      }

      await notificationScheduler.scheduleAllNotifications();
      console.log('[BackgroundTask] Manual background fetch completed');
    } catch (error) {
      console.error('[BackgroundTask] Error in manual background fetch:', error);
    }
  }
} 