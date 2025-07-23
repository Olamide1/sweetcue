import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, ScrollIndicator } from '../../design-system/components';
import { theme } from '../../design-system/tokens';

type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn' | 'dashboard' | 'subscription' | 'editPartner' | 'settings';

interface DashboardScreenProps {
  partnerName?: string;
  subscriptionPlan?: 'trial' | 'monthly' | 'yearly' | null;
  trialDaysLeft?: number;
  onNavigate?: (screen: Screen) => void;
  onLogout?: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
  partnerName = "Alex", // Default for now, will come from backend later
  subscriptionPlan = 'trial',
  trialDaysLeft = 7,
  onNavigate,
  onLogout
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Get screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  
  // Responsive breakpoints
  const isSmallScreen = screenWidth < 375; // iPhone SE and smaller
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414; // Standard iPhone
  const isLargeScreen = screenWidth >= 414; // iPhone Plus/Pro Max and larger
  
  // Responsive calculations
  const getResponsiveValues = () => {
    if (isSmallScreen) {
      return {
        actionsPerRow: 3,
        actionIconSize: 36,
        actionFontSize: 11,
        actionPadding: theme.spacing[2],
        gap: theme.spacing[2],
      };
    } else if (isMediumScreen) {
      return {
        actionsPerRow: 3,
        actionIconSize: 42,
        actionFontSize: 13,
        actionPadding: theme.spacing[3],
        gap: theme.spacing[3],
      };
    } else {
      return {
        actionsPerRow: 3,
        actionIconSize: 46,
        actionFontSize: 14,
        actionPadding: theme.spacing[4],
        gap: theme.spacing[3],
      };
    }
  };
  
  const responsive = getResponsiveValues();
  
  const today = new Date();
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Create responsive styles inside component
  const responsiveStyles = StyleSheet.create({
    scrollContent: {
      padding: isSmallScreen ? theme.spacing[4] : theme.spacing[6],
      paddingBottom: theme.spacing[8],
    },
    greeting: {
      fontSize: isSmallScreen ? 20 : 24,
      fontWeight: '700' as const,
      color: theme.colors.neutral[900],
      marginBottom: theme.spacing[1],
    },
    date: {
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.neutral[600],
    },
    sectionTitle: {
      fontSize: isSmallScreen ? 16 : 18,
      fontWeight: '600' as const,
      color: theme.colors.neutral[900],
      marginBottom: theme.spacing[4],
    },
    profileMenu: {
      position: 'absolute' as const,
      top: 60,
      right: isSmallScreen ? theme.spacing[4] : theme.spacing[6],
      backgroundColor: 'white',
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing[2],
      minWidth: isSmallScreen ? 180 : 200,
      maxWidth: screenWidth - (theme.spacing[4] * 2),
      ...theme.elevation.lg,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      zIndex: 1000,
    },
  });

  const upcomingReminders = [
    {
      id: 1,
      title: `${partnerName}'s Birthday`,
      date: 'March 15',
      daysUntil: 12,
      type: 'birthday',
      emoji: '🎂',
      isUrgent: false
    },
    {
      id: 2,
      title: 'Anniversary',
      date: 'March 22',
      daysUntil: 19,
      type: 'anniversary',
      emoji: '💕',
      isUrgent: false
    },
    {
      id: 3,
      title: 'Send flowers',
      date: 'Tomorrow',
      daysUntil: 1,
      type: 'reminder',
      emoji: '🌹',
      isUrgent: true
    },
    {
      id: 4,
      title: 'Plan date night',
      date: 'Today',
      daysUntil: 0,
      type: 'reminder',
      emoji: '💫',
      isUrgent: true
    }
  ];

  // Filter urgent reminders (due in next 48 hours)
  const urgentReminders = upcomingReminders.filter(reminder => reminder.daysUntil <= 2);
  const regularReminders = upcomingReminders.filter(reminder => reminder.daysUntil > 2);

  // Contextual quick actions based on urgent reminders
  const getContextualActions = () => {
    const baseActions = [
      { id: 1, title: 'Add Reminder', emoji: '➕', color: '#6366F1', priority: 1 },
    ];

    // Add contextual actions based on urgent reminders
    if (urgentReminders.some(r => r.type === 'reminder')) {
      baseActions.splice(1, 0, { id: 5, title: 'Send Message', emoji: '💌', color: '#10B981', priority: 2 });
    }
    
    if (urgentReminders.length > 0) {
      baseActions.splice(2, 0, { id: 6, title: 'Quick Gifts', emoji: '🎁', color: '#F59E0B', priority: 3 });
    } else {
      baseActions.splice(1, 0, { id: 2, title: 'View Calendar', emoji: '📅', color: '#10B981', priority: 2 });
      baseActions.splice(2, 0, { id: 3, title: 'Gift Ideas', emoji: '🎁', color: '#F59E0B', priority: 3 });
    }

    return baseActions.sort((a, b) => a.priority - b.priority);
  };

  const contextualActions = getContextualActions();

  const handleScrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.welcomeSection}>
              <Text style={responsiveStyles.greeting}>{getGreeting()}! 👋</Text>
              <Text style={responsiveStyles.date}>{formatDate(today)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={() => setShowProfileMenu(!showProfileMenu)}
            >
              <Text style={styles.profileEmoji}>👤</Text>
            </TouchableOpacity>
          </View>

          {/* Today's Focus - Urgent Reminders (next 24-48 hours) */}
          {urgentReminders.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={responsiveStyles.sectionTitle}>Today's Focus</Text>
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>{urgentReminders.length}</Text>
                </View>
              </View>
              <View style={styles.remindersContainer}>
                                 {urgentReminders.map((reminder) => (
                   <Card key={reminder.id} style={{...styles.reminderCard, ...styles.urgentReminderCard}}>
                    <View style={styles.reminderContent}>
                      <View style={styles.reminderLeft}>
                        <Text style={styles.reminderEmoji}>{reminder.emoji}</Text>
                        <View style={styles.reminderInfo}>
                          <Text style={styles.reminderTitle}>{reminder.title}</Text>
                                                     <Text style={{...styles.reminderDate, ...styles.urgentReminderDate}}>
                            {reminder.daysUntil === 0 ? 'Due Today' : reminder.date}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reminderRight}>
                                                 <View style={{...styles.daysUntil, ...styles.urgentDaysUntil}}>
                          <Text style={styles.urgentDaysUntilText}>
                            {reminder.daysUntil === 0 ? 'Now' : `${reminder.daysUntil}d`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          )}

          {/* Quick Actions - Contextual */}
          <View style={styles.section}>
            <Text style={responsiveStyles.sectionTitle}>
              {urgentReminders.length > 0 ? 'Quick Actions' : 'What would you like to do?'}
            </Text>
            <View style={[styles.actionsGrid, { gap: responsive.gap }]}>
              {contextualActions.map((action) => (
                <TouchableOpacity 
                  key={action.id} 
                                     style={[
                     styles.actionCard, 
                     { 
                       flex: 0.3, // 3 items per row, more space per item
                       padding: responsive.actionPadding,
                       minHeight: 80, // Ensure minimum touch target
                     }
                   ]}
                >
                  <View style={[
                    styles.actionIcon, 
                    { 
                      backgroundColor: action.color,
                      width: responsive.actionIconSize,
                      height: responsive.actionIconSize,
                      borderRadius: responsive.actionIconSize / 2,
                    }
                  ]}>
                    <Text style={[styles.actionEmoji, { fontSize: responsive.actionIconSize * 0.45 }]}>
                      {action.emoji}
                    </Text>
                  </View>
                  <Text style={[styles.actionTitle, { fontSize: responsive.actionFontSize }]}>
                    {action.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Subscription Status - Now more prominent */}
          {subscriptionPlan === 'trial' && trialDaysLeft !== undefined && (
            <Card style={styles.subscriptionCard}>
              <View style={styles.subscriptionContent}>
                <View style={styles.subscriptionLeft}>
                  <Text style={styles.subscriptionEmoji}>⏰</Text>
                  <View style={styles.subscriptionInfo}>
                    <Text style={styles.subscriptionTitle}>
                      {trialDaysLeft > 0 ? `${trialDaysLeft} days left in trial` : 'Trial expired'}
                    </Text>
                    <Text style={styles.subscriptionSubtext}>
                      {trialDaysLeft > 0 
                        ? 'Upgrade anytime to continue after trial' 
                        : 'Subscribe to continue using SweetCue'
                      }
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.upgradeButton}
                  onPress={() => onNavigate?.('subscription')}
                >
                  <Text style={styles.upgradeButtonText}>
                    {trialDaysLeft > 0 ? 'Upgrade' : 'Subscribe'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {subscriptionPlan && subscriptionPlan !== 'trial' && (
            <Card style={styles.subscriptionCard}>
              <View style={styles.subscriptionContent}>
                <View style={styles.subscriptionLeft}>
                  <Text style={styles.subscriptionEmoji}>✨</Text>
                  <View style={styles.subscriptionInfo}>
                    <Text style={styles.subscriptionTitle}>
                      {subscriptionPlan === 'monthly' ? 'Monthly' : 'Yearly'} Plan Active
                    </Text>
                    <Text style={styles.subscriptionSubtext}>
                      You have full access to all features
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.manageButton}
                  onPress={() => onNavigate?.('subscription')}
                >
                  <Text style={styles.manageButtonText}>Manage</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Partner Summary */}
          <Card style={styles.partnerCard}>
            <View style={styles.partnerInfo}>
              <View style={styles.partnerAvatar}>
                <Text style={styles.partnerEmoji}>👤</Text>
              </View>
              <View style={styles.partnerDetails}>
                <Text style={styles.partnerName}>{partnerName}</Text>
                <Text style={styles.partnerSubtext}>Your partner's preferences saved</Text>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  console.log('Edit button pressed - navigating to editPartner');
                  onNavigate?.('editPartner');
                }}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* All Upcoming Reminders */}
          {regularReminders.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={responsiveStyles.sectionTitle}>Upcoming Reminders</Text>
                {regularReminders.length > 3 && (
                  <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.remindersContainer}>
                {regularReminders.slice(0, 3).map((reminder) => (
                  <Card key={reminder.id} style={styles.reminderCard}>
                    <View style={styles.reminderContent}>
                      <View style={styles.reminderLeft}>
                        <Text style={styles.reminderEmoji}>{reminder.emoji}</Text>
                        <View style={styles.reminderInfo}>
                          <Text style={styles.reminderTitle}>{reminder.title}</Text>
                          <Text style={styles.reminderDate}>{reminder.date}</Text>
                        </View>
                      </View>
                      <View style={styles.reminderRight}>
                        <Text style={styles.daysUntil}>{reminder.daysUntil}d</Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Menu Backdrop */}
        {showProfileMenu && (
          <TouchableOpacity 
            style={styles.menuBackdrop}
            onPress={() => setShowProfileMenu(false)}
            activeOpacity={1}
          />
        )}

        {/* Profile Menu */}
        {showProfileMenu && (
          <View style={responsiveStyles.profileMenu}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                console.log('Edit Partner menu item pressed');
                setShowProfileMenu(false);
                onNavigate?.('editPartner');
              }}
            >
              <Text style={styles.menuItemEmoji}>👤</Text>
              <Text style={styles.menuItemText}>Edit Partner</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                console.log('Manage Subscription menu item pressed');
                setShowProfileMenu(false);
                onNavigate?.('subscription');
              }}
            >
              <Text style={styles.menuItemEmoji}>💳</Text>
              <Text style={styles.menuItemText}>Manage Subscription</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                console.log('Settings menu item pressed');
                setShowProfileMenu(false);
                onNavigate?.('settings');
              }}
            >
              <Text style={styles.menuItemEmoji}>⚙️</Text>
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                console.log('Recent Activity menu item pressed');
                setShowProfileMenu(false);
                // TODO: Navigate to recent activity when implemented
                console.log('Navigate to recent activity');
              }}
            >
              <Text style={styles.menuItemEmoji}>📊</Text>
              <Text style={styles.menuItemText}>Recent Activity</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                console.log('Sign Out menu item pressed');
                setShowProfileMenu(false);
                onLogout?.();
              }}
            >
              <Text style={styles.menuItemEmoji}>👋</Text>
              <Text style={[styles.menuItemText, styles.logoutText]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scroll Indicator */}
        <ScrollIndicator
          scrollY={scrollY}
          onPress={handleScrollToBottom}
          showThreshold={200}
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  welcomeSection: {
    flex: 1,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.sm,
  },
  profileEmoji: {
    fontSize: 20,
  },

  // Partner Card
  partnerCard: {
    marginBottom: theme.spacing[6],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  partnerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[4],
  },
  partnerEmoji: {
    fontSize: 24,
  },
  partnerDetails: {
    flex: 1,
  },
  partnerName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing[1],
  },
  partnerSubtext: {
    fontSize: 14,
    color: theme.colors.neutral[600],
  },
  editButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    backgroundColor: theme.colors.primary[100],
    borderRadius: theme.radius.md,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary[600],
  },

  // Sections
  section: {
    marginBottom: theme.spacing[8],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  // sectionTitle moved to responsiveStyles

  // Reminders
  remindersContainer: {
    gap: theme.spacing[3],
  },
  reminderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  reminderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderEmoji: {
    fontSize: 24,
    marginRight: theme.spacing[3],
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing[1],
  },
  reminderDate: {
    fontSize: 14,
    color: theme.colors.neutral[600],
  },
  reminderRight: {
    alignItems: 'center',
  },
  daysUntil: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.sm,
  },

  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: theme.radius.lg,
    ...theme.elevation.sm,
  },
  actionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[2],
  },
  actionEmoji: {
  },
  actionTitle: {
    fontWeight: '500',
    color: theme.colors.neutral[700],
    textAlign: 'center',
    lineHeight: 16,
  },

  // Subscription Card
  subscriptionCard: {
    marginBottom: theme.spacing[6],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[500],
  },
  subscriptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subscriptionEmoji: {
    fontSize: 24,
    marginRight: theme.spacing[3],
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing[1],
  },
  subscriptionSubtext: {
    fontSize: 14,
    color: theme.colors.neutral[600],
  },
  upgradeButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.radius.md,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  manageButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.radius.md,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.neutral[700],
  },

  // Profile Menu
  // Profile menu styles moved to responsiveStyles
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  menuItemEmoji: {
    fontSize: 18,
    marginRight: theme.spacing[3],
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.neutral[700],
  },
  logoutText: {
    color: theme.colors.error[500],
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
    marginVertical: theme.spacing[1],
    marginHorizontal: theme.spacing[4],
  },

  // Today's Focus
  urgentBadge: {
    backgroundColor: theme.colors.error[500],
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  urgentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  urgentReminderCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error[500],
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  urgentReminderDate: {
    color: theme.colors.error[600],
    fontWeight: '600',
  },
  urgentDaysUntil: {
    backgroundColor: theme.colors.error[500],
  },
  urgentDaysUntilText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },

  // View All Button
  viewAllButton: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary[600],
  },

  // Menu Backdrop
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
});

export default DashboardScreen; 