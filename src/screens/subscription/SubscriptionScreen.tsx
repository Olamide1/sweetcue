import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, ScrollIndicator } from '../../design-system/components';
import { theme } from '../../design-system/tokens';
import { subscriptionService } from '../../services/subscriptions';
import { Alert } from 'react-native';

type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn' | 'dashboard' | 'subscription';

interface SubscriptionScreenProps {
  onNavigate?: (screen: Screen) => void;
  onSubscriptionComplete?: (plan: 'trial' | 'monthly' | 'yearly') => void;
  userEmail?: string;
  partnerName?: string;
}

interface PricingPlan {
  id: 'trial' | 'monthly' | 'yearly';
  name: string;
  price: string;
  period: string;
  originalPrice?: string;
  savings?: string;
  features: string[];
  badge?: string;
  popular?: boolean;
}

const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ 
  onNavigate, 
  onSubscriptionComplete,
  userEmail = "user@example.com",
  partnerName = "Alex"
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'monthly' | 'yearly'>('trial');
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      setLoadingStatus(true);
      const status = await subscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(status);
      setLoadingStatus(false);
    };
    fetchStatus();
  }, []);

  // Get screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414;

  // Create responsive styles
  const responsiveStyles = StyleSheet.create({
    scrollContent: {
      padding: isSmallScreen ? theme.spacing[4] : theme.spacing[6],
      paddingBottom: theme.spacing[8],
    },
    headerTitle: {
      fontSize: isSmallScreen ? 16 : 18,
      fontWeight: '600' as const,
      color: theme.colors.neutral[900],
    },
    welcomeTitle: {
      fontSize: isSmallScreen ? 24 : isMediumScreen ? 26 : 28,
      fontWeight: '700' as const,
      color: theme.colors.neutral[900],
      textAlign: 'center' as const,
      marginBottom: theme.spacing[3],
    },
    welcomeSubtitle: {
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.neutral[600],
      textAlign: 'center' as const,
      lineHeight: 22,
      paddingHorizontal: theme.spacing[4],
    },
    trialTitle: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '600' as const,
      color: theme.colors.primary[700],
      marginBottom: theme.spacing[1],
    },
    trialSubtext: {
      fontSize: isSmallScreen ? 12 : 14,
      color: theme.colors.primary[600],
    },
    sectionTitle: {
      fontSize: isSmallScreen ? 16 : 18,
      fontWeight: '600' as const,
      color: theme.colors.neutral[900],
      marginBottom: theme.spacing[4],
    },
    planName: {
      fontSize: isSmallScreen ? 18 : 20,
      fontWeight: '600' as const,
      color: theme.colors.neutral[900],
      marginBottom: theme.spacing[2],
    },
    planPrice: {
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: '700' as const,
      color: theme.colors.neutral[900],
      marginRight: theme.spacing[2],
    },
    planPeriod: {
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.neutral[600],
    },
    originalPrice: {
      fontSize: isSmallScreen ? 12 : 14,
      color: theme.colors.neutral[500],
      textDecorationLine: 'line-through' as const,
    },
    savings: {
      fontSize: isSmallScreen ? 12 : 14,
      fontWeight: '600' as const,
      color: theme.colors.success[600],
    },
    featureText: {
      fontSize: isSmallScreen ? 13 : 15,
      color: theme.colors.neutral[700],
      flex: 1,
    },
    skipButtonText: {
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.primary[600],
      textDecorationLine: 'underline' as const,
    },
    disclaimerText: {
      fontSize: isSmallScreen ? 12 : 14,
      color: theme.colors.neutral[500],
      textAlign: 'center' as const,
      lineHeight: 20,
    },
  });

  const plans: PricingPlan[] = [
    {
      id: 'trial',
      name: '7-Day Free Trial',
      price: 'Free',
      period: 'for 7 days',
      features: [
        'Full access to all features',
        'Unlimited reminders',
        'Partner profile & preferences',
        'No credit card required'
      ],
      badge: 'Start Here',
      popular: true
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$8',
      period: 'per month',
      features: [
        'All premium features',
        'Unlimited reminders',
        'Advanced scheduling',
        'Gift recommendations',
        'Calendar integration'
      ]
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: '$72',
      period: 'per year',
      originalPrice: '$96',
      savings: 'Save $24',
      features: [
        'All premium features',
        'Priority support',
        'Advanced analytics',
        'Custom reminder types',
        'Relationship insights'
      ],
      badge: 'Best Value'
    }
  ];

  const calculateTrialEndDate = () => {
    const today = new Date();
    const trialEnd = new Date(today);
    trialEnd.setDate(today.getDate() + 7);
    return trialEnd.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handlePlanSelect = (planId: 'trial' | 'monthly' | 'yearly') => {
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    // TODO: Implement actual payment processing for paid plans
    console.log('Selected plan:', selectedPlan);
    console.log('User:', { email: userEmail, partnerName });
    
    if (selectedPlan === 'trial') {
      console.log('Starting 7-day free trial, ends:', calculateTrialEndDate());
    } else {
      console.log('Processing payment for plan:', selectedPlan);
      // Here would integrate with Stripe/payment processor
    }
    
    // Complete subscription flow
    onSubscriptionComplete?.(selectedPlan);
  };

  const handleScrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSkipTrial = () => {
    // Go directly to monthly plan
    setSelectedPlan('monthly');
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  const handleBack = async () => {
    const status = await subscriptionService.getSubscriptionStatus();
    if (status.isActive && !status.isTrialExpired) {
      onNavigate?.('dashboard');
    } else {
      onNavigate?.('dashboard'); // fallback, always go to dashboard
    }
  };

  // Determine subscription states
  const onActiveTrial = subscriptionStatus && subscriptionStatus.hasSubscription && subscriptionStatus.planType === 'trial' && subscriptionStatus.trialDaysLeft > 0 && !subscriptionStatus.isTrialExpired;
  const onExpiredTrial = subscriptionStatus && subscriptionStatus.hasSubscription && subscriptionStatus.planType === 'trial' && subscriptionStatus.isTrialExpired;
  const onActivePaid = subscriptionStatus && subscriptionStatus.hasSubscription && subscriptionStatus.status === 'active' && subscriptionStatus.planType !== 'trial' && !subscriptionStatus.isTrialExpired;
  const onCancelledOrExpiredPaid = subscriptionStatus && subscriptionStatus.hasSubscription && (subscriptionStatus.status === 'cancelled' || subscriptionStatus.status === 'expired');
  const noSubscription = !subscriptionStatus || !subscriptionStatus.hasSubscription;

  // Show trial option only if no subscription or trial expired
  const showTrialOption = noSubscription || onExpiredTrial;
  // Show paid plans if not on active paid plan
  const showPaidPlans = noSubscription || onActiveTrial || onExpiredTrial || onCancelledOrExpiredPaid;
  // Show manage if on active paid plan
  const showManage = onActivePaid;

  return (
    <View style={styles.container}>
      {/* Modern Gradient Background */}
      <LinearGradient
        colors={['#FFF0F5', '#FFFFFF', '#F8F0FF']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={responsiveStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Subscription Status Summary */}
          {loadingStatus ? (
            <Text style={{ textAlign: 'center', marginVertical: 16 }}>Loading subscription status...</Text>
          ) : subscriptionStatus && subscriptionStatus.hasSubscription ? (
            <Card style={{ marginBottom: 16, backgroundColor: 'rgba(99,102,241,0.08)' }}>
              <View style={{ padding: 16 }}>
                <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 4 }}>
                  {subscriptionStatus.planType === 'trial'
                    ? `You are on a Free Trial`
                    : `You are on the ${subscriptionStatus.planType} plan`}
                </Text>
                {subscriptionStatus.planType === 'trial' && subscriptionStatus.trialDaysLeft > 0 && (
                  <Text style={{ fontSize: 14 }}>
                    {subscriptionStatus.trialDaysLeft} days left in trial
                  </Text>
                )}
                {subscriptionStatus.planType !== 'trial' && subscriptionStatus.status === 'active' && subscriptionStatus.trialDaysLeft === 0 && (
                  <Text style={{ fontSize: 14 }}>
                    Next billing: {subscriptionStatus.next_billing_date ? new Date(subscriptionStatus.next_billing_date).toLocaleDateString() : 'N/A'}
                  </Text>
                )}
                {subscriptionStatus.isTrialExpired && (
                  <Text style={{ fontSize: 14, color: 'red' }}>Trial expired</Text>
                )}
              </View>
            </Card>
          ) : null}
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={responsiveStyles.headerTitle}>Choose Your Plan</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Welcome Message */}
          <View style={styles.welcomeSection}>
            <Text style={responsiveStyles.welcomeTitle}>
              Welcome to SweetCue! 💕
            </Text>
            <Text style={responsiveStyles.welcomeSubtitle}>
              You're about to start your journey to never miss the moments that matter with {partnerName}.
            </Text>
          </View>

          {/* Only show plan selection if not on active paid plan */}
          {showPaidPlans && (
            <>
              {showTrialOption && (
                <Card style={styles.trialHighlight}>
                  <View style={styles.trialContent}>
                    <Text style={styles.trialEmoji}>🎉</Text>
                    <View style={styles.trialInfo}>
                      <Text style={responsiveStyles.trialTitle}>Start your free trial today!</Text>
                      <Text style={responsiveStyles.trialSubtext}>
                        Free until {calculateTrialEndDate()}, then $8/month
                      </Text>
                    </View>
                  </View>
                </Card>
              )}
              <View style={styles.plansSection}>
                <Text style={responsiveStyles.sectionTitle}>Choose Your Plan</Text>
                <View style={styles.plansContainer}>
                  {plans.filter(plan => showTrialOption || plan.id !== 'trial').map((plan) => (
                    <TouchableOpacity
                      key={plan.id}
                      style={[
                        styles.planCard,
                        selectedPlan === plan.id && styles.planCardSelected,
                        plan.popular && styles.planCardPopular
                      ]}
                      onPress={() => handlePlanSelect(plan.id)}
                    >
                      {plan.badge && (
                        <View style={[
                          styles.planBadge,
                          plan.popular ? styles.planBadgePopular : styles.planBadgeDefault
                        ]}>
                          <Text style={[
                            styles.planBadgeText,
                            plan.popular ? styles.planBadgeTextPopular : styles.planBadgeTextDefault
                          ]}>
                            {plan.badge}
                          </Text>
                        </View>
                      )}
                      <View style={styles.planHeader}>
                        <Text style={responsiveStyles.planName}>{plan.name}</Text>
                        <View style={styles.planPricing}>
                          <Text style={responsiveStyles.planPrice}>{plan.price}</Text>
                          <Text style={responsiveStyles.planPeriod}>{plan.period}</Text>
                        </View>
                        {plan.originalPrice && (
                          <View style={styles.savingsContainer}>
                            <Text style={responsiveStyles.originalPrice}>{plan.originalPrice}</Text>
                            <Text style={responsiveStyles.savings}>{plan.savings}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.planFeatures}>
                        {plan.features.map((feature, index) => (
                          <View key={index} style={styles.featureRow}>
                            <Text style={styles.featureCheck}>✓</Text>
                            <Text style={responsiveStyles.featureText}>{feature}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.planSelection}>
                        <View style={[
                          styles.radioButton,
                          selectedPlan === plan.id && styles.radioButtonSelected
                        ]}>
                          {selectedPlan === plan.id && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Action Section */}
          <View style={styles.actionSection}>
            {showPaidPlans && (
              <Button
                title={showTrialOption && selectedPlan === 'trial' ? 'Start Free Trial' : (selectedPlan === 'monthly' ? 'Subscribe Monthly' : selectedPlan === 'yearly' ? 'Subscribe Yearly' : 'Subscribe')}
                variant="primary"
                size="lg"
                onPress={handleContinue}
                style={styles.primaryButton}
                disabled={showTrialOption && selectedPlan === 'trial' && onActiveTrial}
              />
            )}
            {showManage && (
              <Button
                title="Manage Subscription"
                variant="primary"
                size="lg"
                onPress={() => Alert.alert('Manage Subscription', 'This would open the subscription management UI.')}
                style={styles.primaryButton}
              />
            )}
            {onActiveTrial && (
              <Text style={{ color: theme.colors.success[600], textAlign: 'center', marginTop: 8 }}>
                You are currently on a Free Trial. {subscriptionStatus.trialDaysLeft} days left.
              </Text>
            )}
            {onActivePaid && (
              <Text style={{ color: theme.colors.success[600], textAlign: 'center', marginTop: 8 }}>
                You are subscribed to the {subscriptionStatus.planType} plan. Next billing: {subscriptionStatus.next_billing_date ? new Date(subscriptionStatus.next_billing_date).toLocaleDateString() : 'N/A'}
              </Text>
            )}
            {onCancelledOrExpiredPaid && (
              <Text style={{ color: theme.colors.error[600], textAlign: 'center', marginTop: 8 }}>
                Your subscription is {subscriptionStatus.status}.
              </Text>
            )}
            {onExpiredTrial && (
              <Text style={{ color: theme.colors.error[600], textAlign: 'center', marginTop: 8 }}>
                Your trial has expired.
              </Text>
            )}
            <TouchableOpacity style={styles.skipButton} onPress={() => onNavigate?.('welcome')}>
              <Text style={responsiveStyles.skipButtonText}>Maybe later</Text>
            </TouchableOpacity>
            <Text style={responsiveStyles.disclaimerText}>
              Cancel anytime. No commitment required.
            </Text>
          </View>
        </ScrollView>

        {/* Scroll Indicator */}
        <ScrollIndicator
          scrollY={scrollY}
          onPress={handleScrollToBottom}
          showThreshold={150}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[6],
    paddingBottom: theme.spacing[8],
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.sm,
  },
  backButtonText: {
    fontSize: 20,
    color: theme.colors.neutral[700],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral[900],
  },
  placeholder: {
    width: 40,
  },

  // Welcome Section
  welcomeSection: {
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.neutral[900],
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: theme.colors.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing[4],
  },

  // Trial Highlight
  trialHighlight: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: theme.colors.primary[200],
    borderWidth: 1,
    marginBottom: theme.spacing[6],
  },
  trialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  trialEmoji: {
    fontSize: 24,
    marginRight: theme.spacing[3],
  },
  trialInfo: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary[700],
    marginBottom: theme.spacing[1],
  },
  trialSubtext: {
    fontSize: 14,
    color: theme.colors.primary[600],
  },

  // Plans Section
  plansSection: {
    marginBottom: theme.spacing[6],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing[4],
  },
  plansContainer: {
    gap: theme.spacing[4],
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing[5],
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    ...theme.elevation.sm,
  },
  planCardSelected: {
    borderColor: theme.colors.primary[400],
    backgroundColor: 'rgba(255, 255, 255, 1)',
    ...theme.elevation.md,
  },
  planCardPopular: {
    borderColor: theme.colors.primary[300],
  },
  planBadge: {
    position: 'absolute',
    top: -8,
    left: theme.spacing[5],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.full,
  },
  planBadgePopular: {
    backgroundColor: theme.colors.primary[500],
  },
  planBadgeDefault: {
    backgroundColor: theme.colors.neutral[600],
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planBadgeTextPopular: {
    color: 'white',
  },
  planBadgeTextDefault: {
    color: 'white',
  },

  // Plan Content
  planHeader: {
    marginBottom: theme.spacing[4],
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing[2],
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing[1],
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.neutral[900],
    marginRight: theme.spacing[2],
  },
  planPeriod: {
    fontSize: 16,
    color: theme.colors.neutral[600],
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  originalPrice: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    textDecorationLine: 'line-through',
  },
  savings: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success[600],
  },

  // Plan Features
  planFeatures: {
    marginBottom: theme.spacing[4],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  featureCheck: {
    fontSize: 16,
    color: theme.colors.success[500],
    marginRight: theme.spacing[3],
    fontWeight: '600',
  },
  featureText: {
    fontSize: 15,
    color: theme.colors.neutral[700],
    flex: 1,
  },

  // Plan Selection
  planSelection: {
    alignItems: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary[500],
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary[500],
  },

  // Action Section
  actionSection: {
    alignItems: 'center',
    gap: theme.spacing[4],
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    ...theme.elevation.lg,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
  },
  skipButton: {
    paddingVertical: theme.spacing[2],
  },
  skipButtonText: {
    fontSize: 16,
    color: theme.colors.primary[600],
    textDecorationLine: 'underline',
  },
  disclaimerText: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SubscriptionScreen; 