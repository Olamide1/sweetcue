import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import supabase from '../lib/supabase';

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  reminderAdvance: number; // days in advance
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string; // "08:00"
}

export interface ReminderNotification {
  id: string;
  title: string;
  body: string;
  scheduledDate: Date;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    try {
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('[NotificationService] Permission not granted');
        return;
      }

      // Get push token
      if (Device.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        });
        this.expoPushToken = token.data;
        console.log('[NotificationService] Push token:', this.expoPushToken);
        
        // Save token to user profile
        await this.savePushToken(this.expoPushToken);
      }

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
          name: '💝 SweetCue Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B9D',
          description: 'Reminders for your relationship gestures',
        });

        await Notifications.setNotificationChannelAsync('important-dates', {
          name: '🎂 Important Dates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B9D',
          description: 'Birthday and anniversary notifications',
        });
      }
    } catch (error) {
      console.error('[NotificationService] Initialization error:', error);
    }
  }

  /**
   * Save push token to user profile
   */
  private async savePushToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('user_id', user.id);

      if (error) {
        console.error('[NotificationService] Error saving push token:', error);
      }
    } catch (error) {
      console.error('[NotificationService] Error saving push token:', error);
    }
  }

  /**
   * Schedule a reminder notification
   */
  async scheduleReminderNotification(reminder: ReminderNotification): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('[NotificationService] Notifications not permitted');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          data: reminder.data || {},
          sound: 'default',
        },
        trigger: {
          date: reminder.scheduledDate,
          channelId: 'reminders',
        },
      });

      console.log('[NotificationService] Scheduled reminder:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Error scheduling reminder:', error);
      return null;
    }
  }

  /**
   * Schedule birthday/anniversary notification
   */
  async scheduleImportantDateNotification(
    type: 'birthday' | 'anniversary',
    partnerName: string,
    date: Date,
    advanceDays: number = 1
  ): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return null;

      const notificationDate = new Date(date);
      notificationDate.setDate(notificationDate.getDate() - advanceDays);
      notificationDate.setHours(9, 0, 0, 0); // 9 AM

      const title = type === 'birthday' ? '🎂 Birthday Alert!' : '💝 Anniversary Alert!';
      const body = `${partnerName}'s ${type} is ${advanceDays === 0 ? 'today' : `in ${advanceDays} day${advanceDays > 1 ? 's' : ''}`}! Time to show some love! 💕`;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type, partnerName, date: date.toISOString() },
          sound: 'default',
        },
        trigger: {
          date: notificationDate,
          channelId: 'important-dates',
        },
      });

      console.log('[NotificationService] Scheduled important date:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Error scheduling important date:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('[NotificationService] Cancelled notification:', notificationId);
    } catch (error) {
      console.error('[NotificationService] Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[NotificationService] Cancelled all notifications');
    } catch (error) {
      console.error('[NotificationService] Error cancelling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[NotificationService] Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Send immediate notification (for testing)
   */
  async sendImmediateNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `💝 ${title}`,
          body: `${body} 💕`,
          data: data || {},
          sound: 'default',
          priority: 'high',
          sticky: false,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('[NotificationService] Error sending immediate notification:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[NotificationService] Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[NotificationService] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService(); 