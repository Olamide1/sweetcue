import supabase from '../lib/supabase';
// TODO: Replace 'any' with the correct Supabase Database type when available
type Subscription = any;
type SubscriptionInsert = any;
type SubscriptionUpdate = any;

export type PlanType = 'trial' | 'weekly' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface SubscriptionData {
  plan_type: PlanType;
  status?: SubscriptionStatus;
  trial_end_date?: string | null;
  next_billing_date?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
}

export interface SubscriptionResponse {
  data: Subscription | null;
  error: string | null;
}

class SubscriptionService {
  /**
   * Create a new subscription (trial or paid)
   */
  async createSubscription(subscriptionData: SubscriptionData): Promise<SubscriptionResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      // Check if user already has a subscription
      const existing = await this.getSubscription();
      if (existing.data) {
        return { data: null, error: 'User already has a subscription' };
      }

      const insertData: SubscriptionInsert = {
        user_id: user.id,
        ...subscriptionData,
      };

      const { data, error } = await supabase
        .from('subscriptions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Create subscription error:', error.message);
        return { data: null, error: error.message };
      }

      console.log('Subscription created successfully:', data.plan_type);
      return { data, error: null };
    } catch (error) {
      console.error('Create subscription error:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get current user's subscription
   */
  async getSubscription(): Promise<SubscriptionResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No subscription found
          return { data: null, error: null };
        }
        console.error('Get subscription error:', error.message);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get subscription error:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionData: Partial<SubscriptionData>): Promise<SubscriptionResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const updateData: SubscriptionUpdate = {
        ...subscriptionData,
      };

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Update subscription error:', error.message);
        return { data: null, error: error.message };
      }

      console.log('Subscription updated successfully:', data.plan_type);
      return { data, error: null };
    } catch (error) {
      console.error('Update subscription error:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Add a helper to check if user has ever had a trial
   */
  async hasEverHadTrial(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_type', 'trial')
        .limit(1);
      return !!(data && data.length > 0);
    } catch (error) {
      console.error('Check ever had trial error:', error);
      return false;
    }
  }

  /**
   * Start a trial subscription
   */
  async startTrial(): Promise<SubscriptionResponse> {
    if (await this.hasEverHadTrial()) {
      return { data: null, error: 'You have already used your free trial.' };
    }
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days from now

    return this.createSubscription({
      plan_type: 'trial',
      status: 'active',
      trial_end_date: trialEndDate.toISOString(),
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<SubscriptionResponse> {
    return this.updateSubscription({
      status: 'cancelled',
    });
  }

  /**
   * Check if trial is expired
   */
  async isTrialExpired(): Promise<boolean> {
    try {
      const { data } = await this.getSubscription();
      
      if (!data || data.plan_type !== 'trial') {
        return false;
      }

      if (!data.trial_end_date) {
        return true; // No end date means expired
      }

      const now = new Date();
      const trialEnd = new Date(data.trial_end_date);
      
      return now > trialEnd;
    } catch (error) {
      console.error('Check trial expired error:', error);
      return true; // Assume expired on error
    }
  }

  /**
   * Get trial days remaining
   */
  async getTrialDaysLeft(): Promise<number> {
    try {
      const { data } = await this.getSubscription();
      
      if (!data || data.plan_type !== 'trial' || !data.trial_end_date) {
        return 0;
      }

      const now = new Date();
      const trialEnd = new Date(data.trial_end_date);
      const timeDiff = trialEnd.getTime() - now.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return Math.max(0, daysLeft);
    } catch (error) {
      console.error('Get trial days left error:', error);
      return 0;
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const { data } = await this.getSubscription();
      
      if (!data || data.status !== 'active') {
        return false;
      }

      // If it's a trial, check if it's expired
      if (data.plan_type === 'trial') {
        return !(await this.isTrialExpired());
      }

      // For paid plans, check if they're active
      return data.status === 'active';
    } catch (error) {
      console.error('Check active subscription error:', error);
      return false;
    }
  }

  /**
   * Upgrade to paid plan (placeholder for Stripe integration)
   */
  async upgradeToPaidPlan(planType: 'weekly' | 'monthly' | 'yearly' | 'trial', stripeCustomerId?: string, stripeSubscriptionId?: string): Promise<SubscriptionResponse> {
    if (planType === 'trial' && await this.hasEverHadTrial()) {
      return { data: null, error: 'You have already used your free trial.' };
    }
    try {
      const nextBillingDate = new Date();
      if (planType === 'weekly') {
        nextBillingDate.setDate(nextBillingDate.getDate() + 7);
      } else if (planType === 'monthly') {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      } else {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      }
      // Check if subscription row exists
      const { data: existing } = await this.getSubscription();
      if (existing) {
        // Update existing row
        return this.updateSubscription({
          plan_type: planType,
          status: 'active',
          trial_end_date: null,
          next_billing_date: nextBillingDate.toISOString(),
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
        });
      } else {
        // Create new row
        return this.createSubscription({
          plan_type: planType,
          status: 'active',
          trial_end_date: null,
          next_billing_date: nextBillingDate.toISOString(),
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
        });
      }
    } catch (error) {
      console.error('Upgrade to paid plan error:', error);
      return { data: null, error: 'An unexpected error occurred during upgrade' };
    }
  }

  /**
   * Get subscription status summary
   */
  async getSubscriptionStatus(): Promise<{
    hasSubscription: boolean;
    isActive: boolean;
    planType: PlanType | null;
    status: SubscriptionStatus | null;
    trialDaysLeft: number;
    isTrialExpired: boolean;
    nextBillingDate: string | null;
  }> {
    try {
      const { data } = await this.getSubscription();
      
      if (!data) {
        return {
          hasSubscription: false,
          isActive: false,
          planType: null,
          status: null,
          trialDaysLeft: 0,
          isTrialExpired: false,
          nextBillingDate: null,
        };
      }

      const isActive = await this.hasActiveSubscription();
      const trialDaysLeft = await this.getTrialDaysLeft();
      const isTrialExpired = await this.isTrialExpired();

      return {
        hasSubscription: true,
        isActive,
        planType: data.plan_type,
        status: data.status,
        trialDaysLeft,
        isTrialExpired,
        nextBillingDate: data.next_billing_date || null,
      };
    } catch (error) {
      console.error('Get subscription status error:', error);
      return {
        hasSubscription: false,
        isActive: false,
        planType: null,
        status: null,
        trialDaysLeft: 0,
        isTrialExpired: false,
        nextBillingDate: null,
      };
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService(); 