import React, { useState } from 'react';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import PartnerProfileScreen from '../screens/profile/PartnerProfileScreen';
import EditPartnerScreen from '../screens/profile/EditPartnerScreen';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

interface RootNavigatorProps {
  isAuthenticated?: boolean;
}

type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn' | 'dashboard' | 'subscription' | 'editPartner' | 'settings';

interface UserData {
  email: string;
  partnerName: string;
  subscriptionPlan: 'trial' | 'monthly' | 'yearly' | null;
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

  const handleNavigate = (screen: Screen) => {
    console.log('Navigation requested to:', screen);
    setCurrentScreen(screen);
  };

  const handleAuthentication = (partnerName?: string, email?: string) => {
    setIsAuthenticated(true);
    setUserData(prev => ({
      ...prev,
      partnerName: partnerName || prev.partnerName,
      email: email || prev.email,
    }));
    
    // Check if user has subscription, if not go to subscription screen
    if (!hasActiveSubscription) {
      setCurrentScreen('subscription');
    } else {
      setCurrentScreen('dashboard');
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
    
    // After onboarding, always go to subscription screen
    setCurrentScreen('subscription');
  };

  const handleSubscriptionComplete = (plan: 'trial' | 'monthly' | 'yearly') => {
    const subscriptionData: Partial<UserData> = {
      subscriptionPlan: plan,
    };

    if (plan === 'trial') {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      subscriptionData.trialEndDate = trialEndDate;
      console.log('Trial started, ends on:', trialEndDate.toDateString());
    }

    setUserData(prev => ({
      ...prev,
      ...subscriptionData,
    }));
    
    setHasActiveSubscription(true);
    setCurrentScreen('dashboard');
  };

  const calculateTrialDaysLeft = (): number => {
    if (!userData.trialEndDate) return 0;
    const today = new Date();
    const timeDiff = userData.trialEndDate.getTime() - today.getTime();
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
    setCurrentScreen('welcome');
  };

  const handlePartnerProfileSave = (profile: any) => {
    setUserData(prev => ({
      ...prev,
      partnerName: profile.name, // Update main partner name too
      partnerProfile: profile,
    }));
    console.log('Partner profile updated:', profile);
  };

  // If trial expired, force back to subscription screen
  if (isAuthenticated && isTrialExpired() && currentScreen === 'dashboard') {
    setCurrentScreen('subscription');
  }

  // If authenticated and subscribed, show dashboard ONLY if currentScreen is dashboard
  if (isAuthenticated && hasActiveSubscription && !isTrialExpired() && currentScreen === 'dashboard') {
    return (
      <DashboardScreen 
        partnerName={userData.partnerName}
        subscriptionPlan={userData.subscriptionPlan}
        trialDaysLeft={userData.subscriptionPlan === 'trial' ? calculateTrialDaysLeft() : undefined}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    );
  }

  // Otherwise show appropriate flow
  const renderScreen = () => {
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
          />
        );
      case 'dashboard':
        // This case handles when we explicitly navigate back to dashboard
        if (isAuthenticated && hasActiveSubscription && !isTrialExpired()) {
          return (
            <DashboardScreen 
              partnerName={userData.partnerName}
              subscriptionPlan={userData.subscriptionPlan}
              trialDaysLeft={userData.subscriptionPlan === 'trial' ? calculateTrialDaysLeft() : undefined}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          );
        }
        return <WelcomeScreen onNavigate={handleNavigate} />;
      default:
        return <WelcomeScreen onNavigate={handleNavigate} />;
    }
  };

  return renderScreen();
};

export default RootNavigator; 