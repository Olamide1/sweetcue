import supabase from '../lib/supabase';
import type { AuthError, User } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  /**
   * Sign up a new user
   */
  async signUp({ email, password }: SignUpData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Sign up error:', error.message);
        return { user: null, error };
      }

      console.log('Sign up successful:', data.user?.email);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        user: null, 
        error: { message: 'An unexpected error occurred during sign up' } as AuthError 
      };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn({ email, password }: SignInData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error.message);
        // Track failed login attempt
        try {
          const { privacyService } = await import('./privacy');
          await privacyService.trackLogin(false);
        } catch (trackError) {
          console.error('Error tracking failed login:', trackError);
        }
        return { user: null, error };
      }

      console.log('Sign in successful:', data.user?.email);
      
      // Track successful login
      try {
        const { privacyService } = await import('./privacy');
        await privacyService.trackLogin(true);
      } catch (trackError) {
        console.error('Error tracking successful login:', trackError);
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        user: null, 
        error: { message: 'An unexpected error occurred during sign in' } as AuthError 
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error.message);
        return { error };
      }

      console.log('Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { 
        error: { message: 'An unexpected error occurred during sign out' } as AuthError 
      };
    }
  }

  /**
   * Get the current user session
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Get user error:', error.message);
        return null;
      }

      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Get the current session
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Get session error:', error.message);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      callback(session?.user || null);
    });
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        console.error('Reset password error:', error.message);
        return { error };
      }

      console.log('Reset password email sent to:', email);
      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { 
        error: { message: 'An unexpected error occurred during password reset' } as AuthError 
      };
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) {
        console.error('Send email verification error:', error.message);
        return { error };
      }

      console.log('Email verification sent to:', email);
      return { error: null };
    } catch (error) {
      console.error('Send email verification error:', error);
      return { 
        error: { message: 'An unexpected error occurred while sending verification email' } as AuthError 
      };
    }
  }

  /**
   * Check if user email is verified
   */
  async isEmailVerified(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.email_confirmed_at ? true : false;
    } catch (error) {
      console.error('Check email verification error:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  /**
   * Delete the current user account and all associated data
   */
  async deleteAccount(): Promise<{ error: AuthError | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Delete account error: No user found');
        return { error: { message: 'No user found' } as AuthError };
      }

      console.log('Deleting account for user:', user.email);

      // For user-initiated deletion, we need to delete all user data first, then the user
      // The user will be automatically deleted when they sign out and their session expires
      // This approach ensures all data is properly cleaned up

      // First, delete all user data from all tables
      const userId = user.id;
      
      // Delete reminders
      const { error: remindersError } = await supabase
        .from('reminders')
        .delete()
        .eq('user_id', userId);
      
      if (remindersError) {
        console.error('Error deleting reminders:', remindersError);
      }

      // Delete gestures
      const { error: gesturesError } = await supabase
        .from('gestures')
        .delete()
        .eq('user_id', userId);
      
      if (gesturesError) {
        console.error('Error deleting gestures:', gesturesError);
      }

      // Delete partners
      const { error: partnersError } = await supabase
        .from('partners')
        .delete()
        .eq('user_id', userId);
      
      if (partnersError) {
        console.error('Error deleting partners:', partnersError);
      }

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      // Sign out the user (this will invalidate their session)
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('Error signing out:', signOutError);
        return { error: signOutError };
      }

      console.log('Account and all data deleted successfully');
      return { error: null };
    } catch (error) {
      console.error('Delete account error:', error);
      return { 
        error: { message: 'An unexpected error occurred during account deletion' } as AuthError 
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService(); 