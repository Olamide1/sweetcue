/**
 * Empty State Helpers - Utilities for determining contextual empty states
 * 
 * These functions help determine what empty state to show based on user data,
 * subscription status, and app state to provide the most relevant experience.
 */

export interface UserContext {
  hasPartner: boolean;
  hasReminders: boolean;
  hasActiveSubscription: boolean;
  isTrialExpired: boolean;
  trialDaysLeft: number;
  isNewUser: boolean;
}

export interface EmptyStateConfig {
  emoji: string;
  title: string;
  description: string;
  actionText?: string;
  secondaryActionText?: string;
  variant: 'default' | 'encouraging' | 'informational' | 'error';
}

/**
 * Get appropriate empty state for dashboard main content
 */
export const getDashboardEmptyState = (context: UserContext): EmptyStateConfig | null => {
  // Complete new user - no partner, no reminders, no subscription
  if (!context.hasPartner && !context.hasReminders && !context.hasActiveSubscription) {
    return {
      emoji: '🌟',
      title: 'Welcome to SweetCue!',
      description: 'Let\'s help you never miss the special moments that matter most. Start by setting up your partner\'s profile.',
      actionText: 'Get Started',
      secondaryActionText: 'Learn More',
      variant: 'encouraging',
    };
  }

  // Has partner but no reminders
  if (context.hasPartner && !context.hasReminders) {
    return {
      emoji: '📝',
      title: 'Ready to create your first reminder?',
      description: 'Set up reminders for important dates, sweet gestures, or anything you don\'t want to forget.',
      actionText: 'Create Reminder',
      secondaryActionText: 'Browse Templates',
      variant: 'encouraging',
    };
  }

  // Trial expired
  if (context.isTrialExpired) {
    return {
      emoji: '⏰',
      title: 'Your trial has ended',
      description: 'Continue enjoying SweetCue with full access to all features. Choose a plan that works for you.',
      actionText: 'View Plans',
      secondaryActionText: 'Learn More',
      variant: 'informational',
    };
  }

  return null;
};

/**
 * Get appropriate empty state for reminders list
 */
export const getRemindersEmptyState = (context: UserContext): EmptyStateConfig => {
  if (!context.hasPartner) {
    return {
      emoji: '💕',
      title: 'Set up your partner profile first',
      description: 'Tell us about your partner so we can help you create personalized reminders.',
      actionText: 'Add Partner',
      variant: 'informational',
    };
  }

  return {
    emoji: '📅',
    title: 'No reminders yet',
    description: 'Create your first reminder to never miss an important moment or celebration.',
    actionText: 'Create Reminder',
    secondaryActionText: 'Import Calendar',
    variant: 'encouraging',
  };
};

/**
 * Get appropriate empty state for partner profile section
 */
export const getPartnerEmptyState = (): EmptyStateConfig => {
  return {
    emoji: '👤',
    title: 'Add your partner\'s profile',
    description: 'Tell us about your partner so we can help you create meaningful moments together.',
    actionText: 'Set Up Profile',
    variant: 'informational',
  };
};

/**
 * Get appropriate empty state for quick actions
 */
export const getQuickActionsEmptyState = (context: UserContext): EmptyStateConfig => {
  if (context.isNewUser) {
    return {
      emoji: '✨',
      title: 'Actions will appear here',
      description: 'As you use SweetCue, we\'ll suggest quick actions based on your upcoming reminders.',
      actionText: 'Explore Features',
      variant: 'informational',
    };
  }

  return {
    emoji: '⚡',
    title: 'All caught up!',
    description: 'No urgent actions right now. We\'ll suggest helpful actions as they come up.',
    actionText: 'Add Reminder',
    variant: 'default',
  };
};

/**
 * Determine user context from app data
 */
export const getUserContext = (dashboardData: any): UserContext => {
  return {
    hasPartner: !!dashboardData.partner,
    hasReminders: dashboardData.reminders?.length > 0,
    hasActiveSubscription: dashboardData.subscription?.hasSubscription && dashboardData.subscription?.isActive,
    isTrialExpired: dashboardData.subscription?.isTrialExpired || false,
    trialDaysLeft: dashboardData.subscription?.trialDaysLeft || 0,
    isNewUser: !dashboardData.partner && 
               (!dashboardData.reminders || dashboardData.reminders.length === 0) && 
               !dashboardData.subscription?.hasSubscription,
  };
};

/**
 * Get encouraging messages based on time of day
 */
export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'Good morning! ☀️';
  if (hour < 17) return 'Good afternoon! 🌞';
  if (hour < 21) return 'Good evening! 🌅';
  return 'Good night! 🌙';
};

/**
 * Get contextual call-to-action based on subscription status
 */
export const getSubscriptionCTA = (context: UserContext): { text: string; variant: 'primary' | 'secondary' } => {
  if (context.isTrialExpired) {
    return { text: 'Upgrade Now', variant: 'primary' };
  }
  
  if (!context.hasActiveSubscription) {
    return { text: 'Start Free Trial', variant: 'primary' };
  }
  
  return { text: 'Manage Plan', variant: 'secondary' };
}; 