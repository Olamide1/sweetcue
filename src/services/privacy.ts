import supabase from '../lib/supabase';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface LoginHistoryEntry {
  id: string;
  login_time: string;
  device_info: string;
  success: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface LoginHistoryResponse {
  data: LoginHistoryEntry[] | null;
  error: string | null;
}

export interface PasswordChangeResponse {
  success: boolean;
  error: string | null;
}

export interface SessionInfo {
  currentSession: any;
  loginTime: string;
  deviceInfo: string;
  expiresAt?: string;
}

class PrivacyService {
  /**
   * Track a login event
   */
  async trackLogin(success: boolean = true): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('[PrivacyService] No user found for login tracking');
        return;
      }

      const deviceInfo = await this.getDeviceInfo();
      
      const { error } = await supabase
        .from('login_history')
        .insert({
          user_id: user.id,
          login_time: new Date().toISOString(),
          device_info: deviceInfo,
          success,
          user_agent: 'SweetCue Mobile App',
        });

      if (error) {
        console.error('[PrivacyService] Error tracking login:', error);
      } else {
        console.log('[PrivacyService] Login tracked successfully');
      }
    } catch (error) {
      console.error('[PrivacyService] Error tracking login:', error);
    }
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<string> {
    try {
      const deviceName = Device.deviceName || 'Unknown Device';
      const osName = Device.osName || 'Unknown OS';
      const osVersion = Device.osVersion || 'Unknown Version';
      
      return `${deviceName}, ${osName} ${osVersion}`;
    } catch (error) {
      console.error('[PrivacyService] Error getting device info:', error);
      return 'Unknown Device';
    }
  }

  /**
   * Get login history for the current user
   */
  async getLoginHistory(limit: number = 20): Promise<LoginHistoryResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', user.id)
        .order('login_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[PrivacyService] Error getting login history:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('[PrivacyService] Error getting login history:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<PasswordChangeResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('[PrivacyService] Attempting to change password for user:', user.email);

      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        console.error('[PrivacyService] Current password verification failed:', signInError);
        return { success: false, error: 'Current password is incorrect' };
      }

      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('[PrivacyService] Error updating password:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('[PrivacyService] Password updated successfully');
      return { success: true, error: null };
    } catch (error) {
      console.error('[PrivacyService] Error changing password:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get current session information
   */
  async getCurrentSessionInfo(): Promise<SessionInfo | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return null;
      }

      const deviceInfo = await this.getDeviceInfo();
      
      // Convert timestamps to proper format
      const loginTime = new Date().toISOString(); // Use current time since session doesn't have created_at
      const expiresAt = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined;
      
      return {
        currentSession: session,
        loginTime,
        deviceInfo,
        expiresAt,
      };
    } catch (error) {
      console.error('[PrivacyService] Error getting session info:', error);
      return null;
    }
  }

  /**
   * Sign out from current session
   */
  async signOutFromCurrentSession(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[PrivacyService] Error signing out:', error);
        return { error: error.message };
      }

      console.log('[PrivacyService] Signed out successfully');
      return { error: null };
    } catch (error) {
      console.error('[PrivacyService] Error signing out:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  /**
   * Clear login history (for privacy)
   */
  async clearLoginHistory(): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('login_history')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('[PrivacyService] Error clearing login history:', error);
        return { success: false, error: error.message };
      }

      console.log('[PrivacyService] Login history cleared successfully');
      return { success: true, error: null };
    } catch (error) {
      console.error('[PrivacyService] Error clearing login history:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

// Export singleton instance
export const privacyService = new PrivacyService(); 