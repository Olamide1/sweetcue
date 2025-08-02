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
   * Get user notification preferences from Supabase
   */
  private async getUserNotificationPreferences(): Promise<{
    pushEnabled: boolean;
    emailEnabled: boolean;
    reminderAdvance: number;
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
      
      const { data: reminders } = await reminderService.getUpcomingReminders(30);
      if (!reminders) return;

      for (const reminder of reminders) {
        const scheduledDate = new Date(reminder.scheduled_date);
        const now = new Date();
        
        // Only schedule if the reminder is in the future
        if (scheduledDate > now) {
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
            console.log(`[NotificationScheduler] Scheduled reminder: ${reminder.title} for ${scheduledDate.toISOString()}`);
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

      // Schedule birthday notification
      if (partner.birthday) {
        const birthdayThisYear = new Date(partner.birthday);
        birthdayThisYear.setFullYear(currentYear);
        
        if (birthdayThisYear < today) {
          birthdayThisYear.setFullYear(currentYear + 1);
        }

        const notificationId = await notificationService.scheduleImportantDateNotification(
          'birthday',
          partner.name,
          birthdayThisYear,
          preferences.reminderAdvance
        );

        if (notificationId) {
          console.log(`[NotificationScheduler] Scheduled birthday notification for ${partner.name} on ${birthdayThisYear.toISOString()}`);
        }
      }

      // Schedule anniversary notification
      if (partner.anniversary) {
        const anniversaryThisYear = new Date(partner.anniversary);
        anniversaryThisYear.setFullYear(currentYear);
        
        if (anniversaryThisYear < today) {
          anniversaryThisYear.setFullYear(currentYear + 1);
        }

        const notificationId = await notificationService.scheduleImportantDateNotification(
          'anniversary',
          partner.name,
          anniversaryThisYear,
          preferences.reminderAdvance
        );

        if (notificationId) {
          console.log(`[NotificationScheduler] Scheduled anniversary notification for ${partner.name} on ${anniversaryThisYear.toISOString()}`);
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
      if (!partner) return;

      // Schedule daily suggestions for the next 7 days
      for (let i = 1; i <= 7; i++) {
        const suggestionDate = new Date();
        suggestionDate.setDate(suggestionDate.getDate() + i);
        suggestionDate.setHours(9, 0, 0, 0); // 9 AM

        const suggestions = this.getDailySuggestions(partner.love_language);
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

        const notificationId = await notificationService.scheduleReminderNotification({
          id: `daily-suggestion-${i}`,
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
}

export const notificationScheduler = new NotificationScheduler(); 