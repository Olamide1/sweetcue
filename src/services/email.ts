import supabase from '../lib/supabase';

export interface SupportEmailData {
  subject: string;
  message: string;
  userEmail?: string;
  userName?: string;
}

export interface EmailResponse {
  success: boolean;
  error?: string;
}

class EmailService {
  /**
   * Send a support email directly without opening email client
   */
  async sendSupportEmail(emailData: SupportEmailData): Promise<EmailResponse> {
    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Create support request in database
      const { error } = await supabase
        .from('support_requests')
        .insert({
          user_id: user.id,
          user_email: user.email,
          subject: emailData.subject,
          message: emailData.message,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[EmailService] Error saving support request:', error);
        return { success: false, error: 'Failed to save support request' };
      }

      // For now, we'll use a simple approach that stores the request
      // and you can set up email notifications in Supabase
      console.log('[EmailService] Support request saved successfully');
      
      return { success: true };
    } catch (error) {
      console.error('[EmailService] Error sending support email:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get user's support request history
   */
  async getSupportHistory(): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('support_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[EmailService] Error fetching support history:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('[EmailService] Error fetching support history:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }
}

export const emailService = new EmailService(); 