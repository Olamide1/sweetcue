import React, { useState, useEffect } from 'react';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import PartnerProfileScreen from '../screens/profile/PartnerProfileScreen';
import EditPartnerScreen from '../screens/profile/EditPartnerScreen';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AddReminderScreen from '../screens/dashboard/AddReminderScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import PrivacySecurityScreen from '../screens/settings/PrivacySecurityScreen';
import NotificationsScreen from '../screens/settings/NotificationsScreen';
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';
import RecentActivityScreen from '../screens/activity/RecentActivityScreen';
import { subscriptionService } from '../services/subscriptions';
import supabase from '../lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';

interface RootNavigatorProps {
  isAuthenticated?: boolean;
}

type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn' | 'dashboard' | 'addReminder' | 'subscription' | 'editPartner' | 'settings' | 'privacySecurity' | 'notifications' | 'helpSupport' | 'recentActivity';

interface UserData {
  email: string;
  partnerName: string;
  subscriptionPlan: 'trial' | 'weekly' | 'monthly' | 'yearly' | null;
  trialEndDate?: Date;
  partnerProfile?: {
    name: string;
    keyDates: {
      anniversary?: string;
      birthday?: string;
    };
    loveLanguage: string;
    dislikes: string;
  };
}

const RootNavigator: React.FC<RootNavigatorProps> = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    email: '',
    partnerName: '',
    subscriptionPlan: null,
    partnerProfile: {
      name: '',
      keyDates: {},
      loveLanguage: '',
      dislikes: '',
    },
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [trialEndDate, setTrialEndDate] = useState<Date | undefined>(undefined);
  const [authLoading, setAuthLoading] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  // Restore session on mount and listen for auth state changes
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isMounted) {
        // Try to fetch the user's profile row
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        if (error && error.code === 'PGRST116') {
          // No profile row found (account deleted)
          alert('No account found with that information. Please sign up.');
          setIsAuthenticated(false);
          setCurrentScreen('welcome');
          return;
        }
        if (error) {
          alert('An unexpected error occurred. Please try again.');
          setIsAuthenticated(false);
          setCurrentScreen('welcome');
          return;
        }
        setIsAuthenticated(true);
        setUserData(prev => ({
          ...prev,
          email: session.user.email || '',
        }));
      }
    };
    restoreSession();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session) {
        // Try to fetch the user's profile row
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (error && error.code === 'PGRST116') {
              alert('No account found with that information. Please sign up.');
              setIsAuthenticated(false);
              setCurrentScreen('welcome');
              return;
            }
            if (error) {
              alert('An unexpected error occurred. Please try again.');
              setIsAuthenticated(false);
              setCurrentScreen('welcome');
              return;
            }
            setIsAuthenticated(true);
            setUserData(prev => ({
              ...prev,
              email: session.user.email || '',
            }));
          });
      } else {
        setIsAuthenticated(false);
        setUserData({
          email: '',
          partnerName: '',
          subscriptionPlan: null,
          partnerProfile: {
            name: '',
            keyDates: {},
            loveLanguage: '',
            dislikes: '',
          },
        });
      }
    });
    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Fetch subscription status on mount and after login
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!isAuthenticated) return;
      const status = await subscriptionService.getSubscriptionStatus();
      setHasActiveSubscription(status.isActive && !status.isTrialExpired);
      setUserData(prev => ({
        ...prev,
        subscriptionPlan: status.planType,
      }));
      setSubscriptionStatus(status);
      if (currentScreen === 'subscription') {
        // Stay on subscription page if that's where the user navigated
        return;
      }
      // Only redirect to subscription if no valid plan or trial
      if (
        (!status.isActive && (!status.hasSubscription || status.isTrialExpired))
      ) {
        setCurrentScreen('subscription');
      } else {
        setCurrentScreen('dashboard');
      }
    };
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleNavigate = (screen: Screen) => {
    console.log('handleNavigate called with:', screen);
    setCurrentScreen(screen);
  };

  const handleAuthentication = async (partnerName?: string, email?: string, password?: string) => {
    setSignUpLoading(true);
    setSignUpError(null);
    try {
      // 1. Always trigger sign-up API call
      const { data, error } = await supabase.auth.signUp({
        email: email!,
        password: password!,
      });
      if (error) {
        setSignUpError(error.message || 'Sign up failed. Please try again.');
        setSignUpLoading(false);
        return;
      }
      // 2. Wait for a valid session after successful sign-up
      let user = null;
      let tries = 0;
      while (!user && tries < 10) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          user = currentUser;
          break;
        }
        await new Promise(res => setTimeout(res, 300));
        tries++;
      }
      setSignUpLoading(false);
      if (!user) {
        setSignUpError('Authentication not ready. Please try again.');
        return;
      }
      setIsAuthenticated(true);
      setUserData(prev => ({
        ...prev,
        partnerName: partnerName || prev.partnerName,
        email: email || prev.email,
      }));
      // Subscription status and navigation will be handled by useEffect
    } catch (err: any) {
      setSignUpError(err.message || 'Sign up failed. Please try again.');
      setSignUpLoading(false);
    }
  };

  const handleOnboardingComplete = (partnerName: string, email: string) => {
    setIsAuthenticated(true);
    setUserData(prev => ({
      ...prev,
      partnerName,
      email,
      partnerProfile: {
        name: partnerName,
        keyDates: {},
        loveLanguage: '',
        dislikes: '',
      },
    }));
    // Navigation will be handled by useEffect
  };

  const handleSubscriptionComplete = (plan: 'trial' | 'weekly' | 'monthly' | 'yearly') => {
    setUserData(prev => ({
      ...prev,
      subscriptionPlan: plan,
    }));
    setHasActiveSubscription(true);
    // Re-fetch subscription status to ensure all screens are up to date
    subscriptionService.getSubscriptionStatus().then(status => {
      setSubscriptionStatus(status);
      setUserData(prev => ({ ...prev, subscriptionPlan: status.planType }));
      if (status.planType === 'trial' && status.trialDaysLeft > 0 && status.hasSubscription) {
        const now = new Date();
        const end = new Date();
        end.setDate(now.getDate() + status.trialDaysLeft);
        setTrialEndDate(end);
      } else {
        setTrialEndDate(undefined);
      }
      setCurrentScreen('dashboard');
    });
  };

  const calculateTrialDaysLeft = (): number => {
    if (!trialEndDate) return 0;
    const today = new Date();
    const timeDiff = trialEndDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(0, daysLeft);
  };

  const isTrialExpired = (): boolean => {
    return userData.subscriptionPlan === 'trial' && calculateTrialDaysLeft() <= 0;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setHasActiveSubscription(false);
    setUserData({
      email: '',
      partnerName: '',
      subscriptionPlan: null,
      partnerProfile: {
        name: '',
        keyDates: {},
        loveLanguage: '',
        dislikes: '',
      },
    });
    setTrialEndDate(undefined);
    setCurrentScreen('welcome');
  };

  const handlePartnerProfileSave = (profile: any) => {
    setUserData(prev => ({
      ...prev,
      partnerName: profile.name, // Update main partner name too
      partnerProfile: profile,
    }));
  };

  // If trial expired, force back to subscription screen
  useEffect(() => {
    if (isAuthenticated && isTrialExpired() && currentScreen === 'dashboard') {
      setCurrentScreen('subscription');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, trialEndDate, userData.subscriptionPlan, currentScreen]);

  // If authenticated and subscribed, show dashboard ONLY if currentScreen is dashboard
  if (isAuthenticated && hasActiveSubscription && !isTrialExpired()) {
    if (currentScreen === 'subscription') {
      return (
        <SubscriptionScreen
          onNavigate={handleNavigate}
          onSubscriptionComplete={handleSubscriptionComplete}
          userEmail={userData.email}
          partnerName={userData.partnerName}
          subscriptionStatus={subscriptionStatus}
        />
      );
    }
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen 
            partnerName={userData.partnerName}
            subscriptionPlan={userData.subscriptionPlan}
            trialDaysLeft={userData.subscriptionPlan === 'trial' ? calculateTrialDaysLeft() : undefined}
            subscriptionStatus={subscriptionStatus}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );
      case 'addReminder':
        return (
          <AddReminderScreen
            onNavigate={handleNavigate}
            onReminderAdded={() => setCurrentScreen('dashboard')}
          />
        );
      case 'editPartner':
        return (
          <EditPartnerScreen
            onNavigate={handleNavigate}
            onSave={() => setCurrentScreen('dashboard')}
            initialProfile={userData.partnerProfile}
          />
        );
      case 'recentActivity':
        return <RecentActivityScreen onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsScreen onNavigate={handleNavigate} subscriptionStatus={subscriptionStatus} />;
      case 'privacySecurity':
        return <PrivacySecurityScreen onNavigate={handleNavigate} />;
      case 'notifications':
        return <NotificationsScreen onNavigate={handleNavigate} />;
      case 'helpSupport':
        return <HelpSupportScreen onNavigate={handleNavigate} />;
      default:
        return (
          <DashboardScreen 
            partnerName={userData.partnerName}
            subscriptionPlan={userData.subscriptionPlan}
            trialDaysLeft={userData.subscriptionPlan === 'trial' ? calculateTrialDaysLeft() : undefined}
            subscriptionStatus={subscriptionStatus}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );
    }
  }

  // Show a loading spinner if waiting for authentication
  if (authLoading) {
    return <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><span>Loading...</span></div>;
  }

  // Otherwise show appropriate flow
  const renderScreen = () => {
    console.log('renderScreen: currentScreen =', currentScreen);
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNavigate={handleNavigate} />;
      case 'signIn':
        return (
          <SignInScreen 
            onNavigate={handleNavigate} 
            onAuthenticate={handleAuthentication}
          />
        );
      case 'partnerProfile':
        return (
          <PartnerProfileScreen 
            onNavigate={handleNavigate}
            onComplete={handleOnboardingComplete}
          />
        );
      case 'subscription':
        return (
          <SubscriptionScreen
            onNavigate={handleNavigate}
            onSubscriptionComplete={handleSubscriptionComplete}
            userEmail={userData.email}
            partnerName={userData.partnerName}
            subscriptionStatus={subscriptionStatus}
          />
        );
      case 'addReminder':
        return (
          <AddReminderScreen
            onNavigate={handleNavigate}
            onReminderAdded={() => {
              setCurrentScreen('dashboard');
            }}
          />
        );
      case 'editPartner':
        return (
          <EditPartnerScreen
            onNavigate={handleNavigate}
            onSave={handlePartnerProfileSave}
            initialProfile={userData.partnerProfile}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            onNavigate={handleNavigate}
            subscriptionStatus={subscriptionStatus}
          />
        );
      case 'privacySecurity':
        return <PrivacySecurityScreen onNavigate={handleNavigate} />;
      case 'notifications':
        return <NotificationsScreen onNavigate={handleNavigate} />;
      case 'helpSupport':
        return <HelpSupportScreen onNavigate={handleNavigate} />;
      case 'recentActivity':
        return <RecentActivityScreen onNavigate={handleNavigate} />;
      case 'dashboard':
        if (
          isAuthenticated &&
          hasActiveSubscription &&
          !isTrialExpired() &&
          subscriptionStatus &&
          subscriptionStatus.status === 'active' &&
          (subscriptionStatus.planType === 'weekly' || subscriptionStatus.planType === 'monthly' || subscriptionStatus.planType === 'yearly' || (subscriptionStatus.planType === 'trial' && !subscriptionStatus.isTrialExpired))
        ) {
          return (
            <DashboardScreen 
              partnerName={userData.partnerName}
              subscriptionPlan={userData.subscriptionPlan}
              trialDaysLeft={userData.subscriptionPlan === 'trial' ? calculateTrialDaysLeft() : undefined}
              subscriptionStatus={subscriptionStatus}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          );
        }
        return <SubscriptionScreen onNavigate={handleNavigate} onSubscriptionComplete={handleSubscriptionComplete} userEmail={userData.email} partnerName={userData.partnerName} subscriptionStatus={subscriptionStatus} />;
      default:
        return <WelcomeScreen onNavigate={handleNavigate} />;
    }
  };

  return renderScreen();
};

// Tab bar styles removed

export default RootNavigator; 