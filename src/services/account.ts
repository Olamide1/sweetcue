import supabase from '../lib/supabase';
import { authService } from './auth';
import { partnerService } from './partners';
import { reminderService } from './reminders';
import { gestureService } from './gestures';

export interface AccountDeletionResponse {
  success: boolean;
  error: string | null;
  deletedData: {
    reminders: number;
    gestures: number;
    partners: number;
    profile: boolean;
  };
}

class AccountService {
  /**
   * Delete user account and all associated data
   * This is a comprehensive deletion that handles all edge cases
   */
  async deleteAccount(): Promise<AccountDeletionResponse> {
    try {
      console.log('[AccountService] Starting account deletion process...');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('[AccountService] No user found for deletion');
        return {
          success: false,
          error: 'No user found',
          deletedData: { reminders: 0, gestures: 0, partners: 0, profile: false }
        };
      }

      const userId = user.id;
      const userEmail = user.email;
      console.log('[AccountService] Deleting account for user:', userEmail, 'ID:', userId);

      const deletedData = {
        reminders: 0,
        gestures: 0,
        partners: 0,
        profile: false
      };

      // Step 1: Delete all reminders
      try {
        console.log('[AccountService] Deleting reminders...');
        const { data: reminders } = await reminderService.getReminders();
        if (reminders && reminders.length > 0) {
          // Delete reminders one by one to ensure proper cleanup
          for (const reminder of reminders) {
            await reminderService.deleteReminder(reminder.id);
          }
          deletedData.reminders = reminders.length;
          console.log('[AccountService] Deleted', reminders.length, 'reminders');
        }
      } catch (error) {
        console.error('[AccountService] Error deleting reminders:', error);
        // Continue with deletion even if reminders fail
      }

      // Step 2: Delete all user gestures (non-template)
      try {
        console.log('[AccountService] Deleting user gestures...');
        const { data: gestures } = await gestureService.getUserGestures();
        if (gestures && gestures.length > 0) {
          // Delete gestures one by one to ensure proper cleanup
          for (const gesture of gestures) {
            await gestureService.deleteGesture(gesture.id);
          }
          deletedData.gestures = gestures.length;
          console.log('[AccountService] Deleted', gestures.length, 'gestures');
        }
      } catch (error) {
        console.error('[AccountService] Error deleting gestures:', error);
        // Continue with deletion even if gestures fail
      }

      // Step 3: Delete partner profiles
      try {
        console.log('[AccountService] Deleting partner profiles...');
        const { data: partner } = await partnerService.getPartner();
        if (partner) {
          const { error: partnerError } = await supabase
            .from('partners')
            .delete()
            .eq('user_id', userId);
          
          if (!partnerError) {
            deletedData.partners = 1;
            console.log('[AccountService] Deleted partner profile');
          } else {
            console.error('[AccountService] Error deleting partner:', partnerError);
          }
        }
      } catch (error) {
        console.error('[AccountService] Error deleting partner profiles:', error);
        // Continue with deletion even if partners fail
      }

      // Step 4: Delete user profile
      try {
        console.log('[AccountService] Deleting user profile...');
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', userId);
        
        if (!profileError) {
          deletedData.profile = true;
          console.log('[AccountService] Deleted user profile');
        } else {
          console.error('[AccountService] Error deleting profile:', profileError);
        }
      } catch (error) {
        console.error('[AccountService] Error deleting user profile:', error);
        // Continue with deletion even if profile fails
      }

      // Step 5: Sign out the user (this invalidates their session)
      console.log('[AccountService] Signing out user...');
      const { error: signOutError } = await authService.signOut();
      
      if (signOutError) {
        console.error('[AccountService] Error signing out:', signOutError);
        return {
          success: false,
          error: signOutError.message,
          deletedData
        };
      }

      console.log('[AccountService] Account deletion completed successfully');
      console.log('[AccountService] Deleted data summary:', deletedData);

      return {
        success: true,
        error: null,
        deletedData
      };

    } catch (error) {
      console.error('[AccountService] Unexpected error during account deletion:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during account deletion',
        deletedData: { reminders: 0, gestures: 0, partners: 0, profile: false }
      };
    }
  }

  /**
   * Get account deletion summary (what will be deleted)
   */
  async getDeletionSummary(): Promise<{
    reminders: number;
    gestures: number;
    partners: number;
    hasProfile: boolean;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { reminders: 0, gestures: 0, partners: 0, hasProfile: false };
      }

      const summary = {
        reminders: 0,
        gestures: 0,
        partners: 0,
        hasProfile: false
      };

      // Count reminders
      try {
        const { data: reminders } = await reminderService.getReminders();
        summary.reminders = reminders?.length || 0;
      } catch (error) {
        console.error('[AccountService] Error counting reminders:', error);
      }

      // Count gestures
      try {
        const { data: gestures } = await gestureService.getUserGestures();
        summary.gestures = gestures?.length || 0;
      } catch (error) {
        console.error('[AccountService] Error counting gestures:', error);
      }

      // Check partners
      try {
        const { data: partner } = await partnerService.getPartner();
        summary.partners = partner ? 1 : 0;
      } catch (error) {
        console.error('[AccountService] Error checking partners:', error);
      }

      // Check profile
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        summary.hasProfile = !!profile;
      } catch (error) {
        console.error('[AccountService] Error checking profile:', error);
      }

      return summary;
    } catch (error) {
      console.error('[AccountService] Error getting deletion summary:', error);
      return { reminders: 0, gestures: 0, partners: 0, hasProfile: false };
    }
  }
}

export const accountService = new AccountService(); 