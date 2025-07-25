import supabase from '../lib/supabase';
// Removed import type { Database } from '../lib/supabase';

type Reminder = any;
type ReminderInsert = any;
type ReminderUpdate = any;

export interface ReminderData {
  partner_id: string;
  gesture_id?: string | null;
  title: string;
  description?: string | null;
  scheduled_date: string; // ISO string
  rrule?: string | null; // RFC 5545 recurring rule
  snooze_until?: string | null;
}

export interface ReminderResponse {
  data: Reminder | null;
  error: string | null;
}

export interface RemindersResponse {
  data: Reminder[] | null;
  error: string | null;
}

export interface UpcomingReminderSummary {
  id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  daysUntil: number;
  isUrgent: boolean;
  type: 'reminder' | 'birthday' | 'anniversary';
  emoji: string;
}

class ReminderService {
  /**
   * Create a new reminder
   */
  async createReminder(reminderData: ReminderData): Promise<ReminderResponse> {
    try {
      console.log('[ReminderService] Creating reminder...', reminderData);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('[ReminderService] User not authenticated');
        return { data: null, error: 'User not authenticated' };
      }

      const insertData: ReminderInsert = {
        user_id: user.id,
        ...reminderData,
      };

      console.log('[ReminderService] Inserting reminder data:', insertData);

      const { data, error } = await supabase
        .from('reminders')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[ReminderService] Create reminder error:', error.message, error);
        return { data: null, error: error.message };
      }

      console.log('[ReminderService] Reminder created successfully:', data.title);
      return { data, error: null };
    } catch (error) {
      console.error('[ReminderService] Create reminder error:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get all reminders for the current user
   */
  async getReminders(): Promise<RemindersResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Get reminders error:', error.message);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Get reminders error:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get upcoming reminders (next 30 days)
   */
  async getUpcomingReminders(days: number = 30): Promise<RemindersResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      console.log('[ReminderService] Getting upcoming reminders:', {
        userId: user.id,
        now: now.toISOString(),
        futureDate: futureDate.toISOString(),
        days
      });

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .gte('scheduled_date', now.toISOString())
        .lte('scheduled_date', futureDate.toISOString())
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('[ReminderService] Get upcoming reminders error:', error.message);
        return { data: null, error: error.message };
      }

      console.log('[ReminderService] Found reminders:', data?.length || 0);
      if (data && data.length > 0) {
        data.forEach((reminder, index) => {
          console.log(`[ReminderService] Reminder ${index + 1}:`, {
            id: reminder.id,
            title: reminder.title,
            scheduled_date: reminder.scheduled_date,
            is_completed: reminder.is_completed
          });
        });
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('[ReminderService] Get upcoming reminders error:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get urgent reminders (next 2 days)
   */
  async getUrgentReminders(): Promise<RemindersResponse> {
    return this.getUpcomingReminders(2);
  }

  /**
   * Complete a reminder
   */
  async completeReminder(reminderId: string, completionNote?: string): Promise<ReminderResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const updateData: ReminderUpdate = {
        is_completed: true,
        completed_at: new Date().toISOString(),
        completion_note: completionNote || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('reminders')
        .update(updateData)
        .eq('id', reminderId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Complete reminder error:', error.message);
        return { data: null, error: error.message };
      }

      console.log('Reminder completed:', data.title);
      return { data, error: null };
    } catch (error) {
      console.error('Complete reminder error:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Snooze a reminder
   */
  async snoozeReminder(reminderId: string, snoozeUntil: string): Promise<ReminderResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const updateData: ReminderUpdate = {
        snooze_until: snoozeUntil,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('reminders')
        .update(updateData)
        .eq('id', reminderId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Snooze reminder error:', error.message);
        return { data: null, error: error.message };
      }

      console.log('Reminder snoozed until:', snoozeUntil);
      return { data, error: null };
    } catch (error) {
      console.error('Snooze reminder error:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId: string): Promise<{ error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Delete reminder error:', error.message);
        return { error: error.message };
      }

      console.log('Reminder deleted successfully');
      return { error: null };
    } catch (error) {
      console.error('Delete reminder error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  /**
   * Format reminders for dashboard display with partner birthday/anniversary info
   */
  async getUpcomingRemindersSummary(partnerData?: { name: string; birthday?: string; anniversary?: string }): Promise<UpcomingReminderSummary[]> {
    try {
      console.log('[ReminderService] Getting upcoming reminders summary with partner data:', partnerData);
      
      const { data: reminders } = await this.getUpcomingReminders();
      const summaries: UpcomingReminderSummary[] = [];

      if (reminders) {
        console.log('[ReminderService] Found', reminders.length, 'database reminders');
        // Convert database reminders to summary format
        reminders.forEach(reminder => {
          const scheduledDate = new Date(reminder.scheduled_date);
          const today = new Date();
          
          // Reset both dates to start of day for accurate day calculation
          const scheduledStartOfDay = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
          const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          const timeDiff = scheduledStartOfDay.getTime() - todayStartOfDay.getTime();
          const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));

          summaries.push({
            id: reminder.id,
            title: reminder.title,
            description: reminder.description || undefined,
            scheduled_date: reminder.scheduled_date,
            daysUntil: Math.max(0, daysUntil),
            isUrgent: daysUntil <= 2,
            type: 'reminder',
            emoji: this.getEmojiForReminder(reminder.title),
          });
        });
      }

      // Add partner birthday and anniversary if provided
      if (partnerData) {
        console.log('[ReminderService] Processing partner data:', {
          name: partnerData.name,
          birthday: partnerData.birthday,
          anniversary: partnerData.anniversary
        });
        
        const currentYear = new Date().getFullYear();
        const today = new Date();
        
        if (partnerData.birthday) {
          console.log('[ReminderService] Processing birthday:', partnerData.birthday);
          const birthdayThisYear = new Date(partnerData.birthday);
          birthdayThisYear.setFullYear(currentYear);
          
          if (birthdayThisYear < today) {
            birthdayThisYear.setFullYear(currentYear + 1);
          }
          
          // Reset both dates to start of day for accurate day calculation
          const birthdayStartOfDay = new Date(birthdayThisYear.getFullYear(), birthdayThisYear.getMonth(), birthdayThisYear.getDate());
          const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          const timeDiff = birthdayStartOfDay.getTime() - todayStartOfDay.getTime();
          const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          console.log('[ReminderService] Birthday calculation:', {
            originalDate: partnerData.birthday,
            calculatedDate: birthdayThisYear.toISOString(),
            daysUntil,
            willShow: daysUntil <= 30
          });
          
          if (daysUntil <= 30) {
            summaries.push({
              id: `birthday-${partnerData.name}`,
              title: `${partnerData.name}'s Birthday`,
              scheduled_date: birthdayThisYear.toISOString(),
              daysUntil,
              isUrgent: daysUntil <= 7,
              type: 'birthday',
              emoji: '🎂',
            });
            console.log('[ReminderService] Added birthday reminder:', `${partnerData.name}'s Birthday (${daysUntil} days)`);
          }
        }

        if (partnerData.anniversary) {
          console.log('[ReminderService] Processing anniversary:', partnerData.anniversary);
          const anniversaryThisYear = new Date(partnerData.anniversary);
          anniversaryThisYear.setFullYear(currentYear);
          
          if (anniversaryThisYear < today) {
            anniversaryThisYear.setFullYear(currentYear + 1);
          }
          
          // Reset both dates to start of day for accurate day calculation
          const anniversaryStartOfDay = new Date(anniversaryThisYear.getFullYear(), anniversaryThisYear.getMonth(), anniversaryThisYear.getDate());
          const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          const timeDiff = anniversaryStartOfDay.getTime() - todayStartOfDay.getTime();
          const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          console.log('[ReminderService] Anniversary calculation:', {
            originalDate: partnerData.anniversary,
            calculatedDate: anniversaryThisYear.toISOString(),
            daysUntil,
            willShow: daysUntil <= 30
          });
          
          if (daysUntil <= 30) {
            summaries.push({
              id: `anniversary-${partnerData.name}`,
              title: 'Anniversary',
              scheduled_date: anniversaryThisYear.toISOString(),
              daysUntil,
              isUrgent: daysUntil <= 7,
              type: 'anniversary',
              emoji: '💕',
            });
            console.log('[ReminderService] Added anniversary reminder: Anniversary (', daysUntil, 'days)');
          }
        }
      }

      // Sort by days until (most urgent first)
      const sortedSummaries = summaries.sort((a, b) => a.daysUntil - b.daysUntil);
      console.log('[ReminderService] Final reminders summary:', sortedSummaries.map(r => `${r.title} (${r.daysUntil}d)`));
      
      return sortedSummaries;
    } catch (error) {
      console.error('[ReminderService] Get upcoming reminders summary error:', error);
      return [];
    }
  }

  /**
   * Get appropriate emoji for reminder based on title
   */
  private getEmojiForReminder(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('flower')) return '🌹';
    if (lowerTitle.includes('gift') || lowerTitle.includes('present')) return '🎁';
    if (lowerTitle.includes('date') || lowerTitle.includes('dinner')) return '💫';
    if (lowerTitle.includes('message') || lowerTitle.includes('text')) return '💌';
    if (lowerTitle.includes('call')) return '📞';
    if (lowerTitle.includes('coffee')) return '☕';
    if (lowerTitle.includes('food') || lowerTitle.includes('meal')) return '🍽️';
    
    return '⭐'; // Default emoji
  }
}

export const reminderService = new ReminderService(); 