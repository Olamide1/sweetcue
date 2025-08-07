import { notificationService } from './notifications';
import { reminderService } from './reminders';
import { partnerService } from './partners';
import supabase from '../lib/supabase';

export interface ScheduledNotification {
  id: string;
  type: 'reminder' | 'birthday' | 'anniversary' | 'daily_suggestion';
  scheduledDate: Date;
  title: string;
  body: string;
  data?: any;
}

class NotificationScheduler {
  /**
   * Schedule all notifications for the current user
   */
  async scheduleAllNotifications(): Promise<void> {
    try {
      console.log('[NotificationScheduler] Starting to schedule all notifications...');
      
      // Get user preferences
      const preferences = await this.getUserNotificationPreferences();
      if (!preferences.pushEnabled) {
        console.log('[NotificationScheduler] Push notifications disabled, skipping scheduling');
        return;
      }

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[NotificationScheduler] User not authenticated, skipping notifications');
        return;
      }

      // Cancel existing notifications
      console.log('[NotificationScheduler] Cancelling existing notifications...');
      await notificationService.cancelAllNotifications();

      // Schedule different types of notifications with better error handling
      console.log('[NotificationScheduler] Scheduling reminder notifications...');
      await this.scheduleReminderNotifications(preferences);
      
      console.log('[NotificationScheduler] Scheduling important date notifications...');
      await this.scheduleImportantDateNotifications(preferences);
      
      console.log('[NotificationScheduler] Scheduling daily suggestions...');
      await this.scheduleDailySuggestions(preferences);

      // Verify scheduled notifications
      const scheduledNotifications = await this.getScheduledNotifications();
      console.log('[NotificationScheduler] Total notifications scheduled:', scheduledNotifications.length);
      
      console.log('[NotificationScheduler] All notifications scheduled successfully');
    } catch (error) {
      console.error('[NotificationScheduler] Error scheduling notifications:', error);
    }
  }

  /**
   * Check if we should schedule notifications based on user activity
   */
  async shouldScheduleNotifications(): Promise<boolean> {
    try {
      console.log('[NotificationScheduler] Checking if should schedule notifications...');
      
      // Check if user has any recent activity (reminders, interactions, etc.)
      const { data: reminders } = await reminderService.getUpcomingReminders(7); // Only check next 7 days
      const hasRecentActivity = reminders && reminders.length > 0;
      
      console.log('[NotificationScheduler] Recent activity check:', { hasRecentActivity, reminderCount: reminders?.length || 0 });
      
      if (!hasRecentActivity) {
        console.log('[NotificationScheduler] No recent user activity found');
        return false;
      }

      // Check if user has a partner profile
      const { data: partner } = await partnerService.getPartner();
      if (!partner) {
        console.log('[NotificationScheduler] No partner profile found');
        return false;
      }

      // Check if it's during quiet hours (if configured)
      const preferences = await this.getUserNotificationPreferences();
      if (preferences.quietHoursStart && preferences.quietHoursEnd) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const [startHour, startMinute] = preferences.quietHoursStart.split(':').map(Number);
        const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);
        
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        
        if (currentTime >= startTime || currentTime <= endTime) {
          console.log('[NotificationScheduler] Currently in quiet hours, skipping notifications');
          return false;
        }
      }

      // ADDITIONAL CHECK: Only schedule if user has been active in the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const { data: recentReminders } = await reminderService.getUpcomingReminders(1); // Check next 1 day
      const hasVeryRecentActivity = recentReminders && recentReminders.length > 0;
      
      console.log('[NotificationScheduler] Very recent activity check:', { hasVeryRecentActivity, recentReminderCount: recentReminders?.length || 0 });
      
      if (!hasVeryRecentActivity) {
        console.log('[NotificationScheduler] No very recent activity (last 24 hours), skipping notifications');
        return false;
      }

      console.log('[NotificationScheduler] User activity check passed, proceeding with scheduling');
      return true;
    } catch (error) {
      console.error('[NotificationScheduler] Error checking user activity:', error);
      return false;
    }
  }

  /**
   * Get user notification preferences from Supabase
   */
  private async getUserNotificationPreferences(): Promise<{
    pushEnabled: boolean;
    emailEnabled: boolean;
    reminderAdvance: number;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .single();

      const defaultPreferences = {
        pushEnabled: true,
        emailEnabled: true,
        reminderAdvance: 1,
      };

      return profile?.notification_preferences || defaultPreferences;
    } catch (error) {
      console.error('[NotificationScheduler] Error getting user preferences:', error);
      return {
        pushEnabled: true,
        emailEnabled: true,
        reminderAdvance: 1,
      };
    }
  }

  /**
   * Schedule notifications for user-created reminders
   */
  private async scheduleReminderNotifications(preferences: any): Promise<void> {
    try {
      console.log('[NotificationScheduler] Scheduling reminder notifications...');
      
      // Only get reminders for the next 7 days instead of 30
      const { data: reminders } = await reminderService.getUpcomingReminders(7);
      if (!reminders) return;

      for (const reminder of reminders) {
        const scheduledDate = new Date(reminder.scheduled_date);
        const now = new Date();
        
        // Only schedule if the reminder is in the future and within 7 days
        if (scheduledDate > now) {
          const daysUntil = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          // Only schedule if it's due within the next 7 days
          if (daysUntil <= 7) {
            const notificationId = await notificationService.scheduleReminderNotification({
              id: reminder.id,
              title: `💝 ${reminder.title}`,
              body: reminder.description || `Time to show some love! Don't forget: ${reminder.title}`,
              scheduledDate: scheduledDate,
              data: {
                type: 'reminder',
                reminderId: reminder.id,
                partnerId: reminder.partner_id,
              },
            });

            if (notificationId) {
              console.log(`[NotificationScheduler] Scheduled reminder: ${reminder.title} for ${scheduledDate.toISOString()} (${daysUntil} days away)`);
            }
          } else {
            console.log(`[NotificationScheduler] Skipping reminder ${reminder.title} - too far in future (${daysUntil} days)`);
          }
        }
      }
    } catch (error) {
      console.error('[NotificationScheduler] Error scheduling reminder notifications:', error);
    }
  }

  /**
   * Schedule notifications for birthdays and anniversaries
   */
  private async scheduleImportantDateNotifications(preferences: any): Promise<void> {
    try {
      console.log('[NotificationScheduler] Scheduling important date notifications...');
      
      const { data: partner } = await partnerService.getPartner();
      if (!partner) return;

      const currentYear = new Date().getFullYear();
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Schedule birthday notification only if it's within the next 30 days
      if (partner.birthday) {
        const birthdayThisYear = new Date(partner.birthday);
        birthdayThisYear.setFullYear(currentYear);
        
        if (birthdayThisYear < today) {
          birthdayThisYear.setFullYear(currentYear + 1);
        }

        // Only schedule if birthday is within the next 30 days
        if (birthdayThisYear <= thirtyDaysFromNow) {
          const daysUntil = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          const notificationId = await notificationService.scheduleImportantDateNotification(
            'birthday',
            partner.name,
            birthdayThisYear,
            preferences.reminderAdvance
          );

          if (notificationId) {
            console.log(`[NotificationScheduler] Scheduled birthday notification for ${partner.name} on ${birthdayThisYear.toISOString()} (${daysUntil} days away)`);
          }
        } else {
          console.log(`[NotificationScheduler] Skipping birthday notification for ${partner.name} - too far in future`);
        }
      }

      // Schedule anniversary notification only if it's within the next 30 days
      if (partner.anniversary) {
        const anniversaryThisYear = new Date(partner.anniversary);
        anniversaryThisYear.setFullYear(currentYear);
        
        if (anniversaryThisYear < today) {
          anniversaryThisYear.setFullYear(currentYear + 1);
        }

        // Only schedule if anniversary is within the next 30 days
        if (anniversaryThisYear <= thirtyDaysFromNow) {
          const daysUntil = Math.ceil((anniversaryThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          const notificationId = await notificationService.scheduleImportantDateNotification(
            'anniversary',
            partner.name,
            anniversaryThisYear,
            preferences.reminderAdvance
          );

          if (notificationId) {
            console.log(`[NotificationScheduler] Scheduled anniversary notification for ${partner.name} on ${anniversaryThisYear.toISOString()} (${daysUntil} days away)`);
          }
        } else {
          console.log(`[NotificationScheduler] Skipping anniversary notification for ${partner.name} - too far in future`);
        }
      }
    } catch (error) {
      console.error('[NotificationScheduler] Error scheduling important date notifications:', error);
    }
  }

  /**
   * Schedule daily love suggestions
   */
  private async scheduleDailySuggestions(preferences: any): Promise<void> {
    try {
      console.log('[NotificationScheduler] Scheduling daily suggestions...');
      
      const { data: partner } = await partnerService.getPartner();
      if (!partner) {
        console.log('[NotificationScheduler] No partner found, skipping daily suggestions');
        return;
      }

      // Only schedule daily suggestions if user has been active recently
      // Check if user has any existing reminders or activity
      const { data: reminders } = await reminderService.getUpcomingReminders(7); // Check next 7 days
      const hasActivity = reminders && reminders.length > 0;
      
      if (!hasActivity) {
        console.log('[NotificationScheduler] No recent user activity found, skipping daily suggestions');
        return;
      }

      // Only schedule 1 daily suggestion for tomorrow (reduced from 3 days)
      const suggestionDate = new Date();
      suggestionDate.setDate(suggestionDate.getDate() + 1);
      suggestionDate.setHours(9, 0, 0, 0); // 9 AM

      const suggestions = this.getDailySuggestions(partner.love_language);
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

      const notificationId = await notificationService.scheduleReminderNotification({
        id: `daily-suggestion-1`,
        title: `💕 Daily Love Tip`,
        body: randomSuggestion,
        scheduledDate: suggestionDate,
        data: {
          type: 'daily_suggestion',
          loveLanguage: partner.love_language,
        },
      });

      if (notificationId) {
        console.log(`[NotificationScheduler] Scheduled daily suggestion for ${suggestionDate.toISOString()}`);
      }
    } catch (error) {
      console.error('[NotificationScheduler] Error scheduling daily suggestions:', error);
    }
  }

  /**
   * Get daily suggestions based on love language
   */
  private getDailySuggestions(loveLanguage?: string): string[] {
    const generalSuggestions = [
      "Send a sweet 'good morning' text to start their day with love! 🌅",
      "Leave a little note somewhere they'll find it today! 💌",
      "Give them an extra long hug when you see them! 🤗",
      "Tell them something specific you love about them! 💝",
      "Do something small to make their day easier! ✨",
    ];

    const loveLanguageSuggestions: { [key: string]: string[] } = {
      'Words of Affirmation': [
        "Tell them 'I'm so proud of you' today! 🎉",
        "Write them a short love note! 💌",
        "Compliment something specific about them! ⭐",
        "Say 'I love you' in a new way! 💕",
        "Thank them for something they do for you! 🙏",
      ],
      'Quality Time': [
        "Plan 15 minutes of uninterrupted time together! ⏰",
        "Ask about their day and really listen! 👂",
        "Do an activity they enjoy together! 🎯",
        "Put your phone away during dinner! 📱",
        "Take a short walk together! 🚶‍♀️",
      ],
      'Physical Touch': [
        "Give them a back massage! 💆‍♀️",
        "Hold their hand while walking! 🤝",
        "Give them a surprise kiss! 💋",
        "Cuddle for 10 minutes! 🥰",
        "Play with their hair! 💁‍♀️",
      ],
      'Acts of Service': [
        "Do a chore they usually handle! 🧹",
        "Make them breakfast in bed! 🍳",
        "Run an errand for them! 🛒",
        "Fix something around the house! 🔧",
        "Prepare their favorite drink! ☕",
      ],
      'Receiving Gifts': [
        "Pick up their favorite snack! 🍫",
        "Buy them a small plant or flower! 🌸",
        "Get them a book they mentioned! 📚",
        "Surprise them with a coffee! ☕",
        "Find a small trinket they'd love! 🎁",
      ],
    };

    return loveLanguageSuggestions[loveLanguage || ''] || generalSuggestions;
  }

  /**
   * Reschedule notifications when user preferences change
   */
  async rescheduleNotifications(): Promise<void> {
    console.log('[NotificationScheduler] Rescheduling notifications due to preference change...');
    await this.scheduleAllNotifications();
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      const notifications = await notificationService.getScheduledNotifications();
      return notifications.map(notification => {
        const trigger = notification.trigger as any;
        const scheduledDate = trigger?.date ? new Date(trigger.date) : new Date();
        const notificationType = notification.content.data?.type as 'reminder' | 'birthday' | 'anniversary' | 'daily_suggestion' || 'reminder';
        
        return {
          id: notification.identifier,
          type: notificationType,
          scheduledDate,
          title: notification.content.title || '',
          body: notification.content.body || '',
          data: notification.content.data,
        };
      });
    } catch (error) {
      console.error('[NotificationScheduler] Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Manually trigger a test notification
   */
  async sendTestNotification(): Promise<void> {
    try {
      console.log('[NotificationScheduler] Sending test notification...');
      await notificationService.sendImmediateNotification(
        'SweetCue Test',
        'This is a test notification to verify everything is working! 💝'
      );
      console.log('[NotificationScheduler] Test notification sent successfully');
    } catch (error) {
      console.error('[NotificationScheduler] Error sending test notification:', error);
    }
  }

  /**
   * Clear all scheduled notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      console.log('[NotificationScheduler] Clearing all notifications...');
      await notificationService.cancelAllNotifications();
      console.log('[NotificationScheduler] All notifications cleared');
    } catch (error) {
      console.error('[NotificationScheduler] Error clearing notifications:', error);
    }
  }
}

export const notificationScheduler = new NotificationScheduler(); 