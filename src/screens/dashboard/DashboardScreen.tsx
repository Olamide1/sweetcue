import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Animated, TextInput, Modal, Keyboard, TouchableWithoutFeedback, SafeAreaView as RNSafeAreaView, Alert, ToastAndroid, Platform, Vibration, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, ScrollIndicator } from '../../design-system/components';
import EmptyState from '../../design-system/components/EmptyState';
import { theme } from '../../design-system/tokens';
import { partnerService } from '../../services/partners';
import { reminderService } from '../../services/reminders';
import { gestureService } from '../../services/gestures';
import DatePicker from '../../components/DatePicker';
import { MaterialIcons } from '@expo/vector-icons';
import { format, isThisWeek, parseISO } from 'date-fns';
import { subscriptionService } from '../../services/subscriptions';
import EmailVerificationReminder from '../../components/EmailVerificationReminder';
import { authService } from '../../services/auth';

type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn' | 'dashboard' | 'subscription' | 'editPartner' | 'settings' | 'recentActivity';

interface DashboardScreenProps {
  partnerName?: string;
  subscriptionPlan?: 'trial' | 'weekly' | 'monthly' | 'yearly' | null;
  trialDaysLeft?: number;
  onNavigate?: (screen: Screen) => void;
  onLogout?: () => void;
  subscriptionStatus?: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
  partnerName: initialPartnerName = "Alex",
  subscriptionPlan = 'trial',
  trialDaysLeft = 7,
  onNavigate,
  onLogout,
  subscriptionStatus
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEmailVerificationReminder, setShowEmailVerificationReminder] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [userEmail, setUserEmail] = useState('');
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

  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [reminders, setReminders] = useState<any[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersError, setRemindersError] = useState<string | null>(null);
  // State for Add Reminder and DatePicker modals
  // const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  // const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  // const [pendingReminderForm, setPendingReminderForm] = useState({ title: '', description: '', scheduled_date: '' });
  // const [gestureTemplates, setGestureTemplates] = useState<any[]>([]);
  // const [gestureLoading, setGestureLoading] = useState(false);
  // const [gestureError, setGestureError] = useState<string | null>(null);
  // const [gestureSearch, setGestureSearch] = useState('');
  // const [selectedGesture, setSelectedGesture] = useState<any>(null);
  // const [reminderForm, setReminderForm] = useState({ title: '', description: '', scheduled_date: '' });
  // const [reminderSaving, setReminderSaving] = useState(false);
  // const [reminderError, setReminderError] = useState<string | null>(null);
  // Restore Quick Gifts and Send Message modal state
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [showQuickGiftsModal, setShowQuickGiftsModal] = useState(false);
  const [messageForm, setMessageForm] = useState({ message: '', scheduled_date: '' });
  const [messageSaving, setMessageSaving] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  // const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  // const [showQuickGiftsModal, setShowQuickGiftsModal] = useState(false);
  // const [messageForm, setMessageForm] = useState({ message: '', scheduled_date: '' });
  // const [messageSaving, setMessageSaving] = useState(false);
  // const [messageError, setMessageError] = useState<string | null>(null);
  const loveLanguage = partnerProfile?.love_languages?.[0] || '';
  const allLoveLanguages = partnerProfile?.love_languages || [];
  // const [accountDeleted, setAccountDeleted] = useState(false);
  // Remove showDatePicker modal logic and use inline state
  // const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<any>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [modalActionLoading, setModalActionLoading] = useState(false);
  // Add state for calendar modal
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Calculate streak (number of completed reminders this week)
  const [streak, setStreak] = useState(0);
  const [weekProgress, setWeekProgress] = useState({ completed: 0, missed: 0, total: 0 });
  const recalculateWeekProgress = async () => {
    const { data } = await reminderService.getReminders();
    
    if (data) {
      const now = new Date();
      const today = new Date();
      const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Count completed reminders this week
      const completedThisWeek = data.filter((r: any) => {
        if (!r.is_completed) return false;
        const scheduledDate = new Date(r.scheduled_date);
        return isThisWeek(scheduledDate);
      });
      
      // Count missed reminders this week (scheduled this week but not completed and date has passed)
      const missedThisWeek = data.filter((r: any) => {
        if (r.is_completed) return false;
        
        const scheduledDate = new Date(r.scheduled_date);
        if (!isThisWeek(scheduledDate)) return false;
        
        const scheduledStartOfDay = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
        return scheduledStartOfDay < todayStartOfDay; // Only missed if the date has passed
      });
      
      // Calculate streak - count consecutive days with completed reminders
      let currentStreak = 0;
      const completedReminders = data.filter((r: any) => r.is_completed);
      
      if (completedReminders.length > 0) {
        // Sort by completion date (most recent first)
        const sortedCompleted = completedReminders.sort((a: any, b: any) => {
          const dateA = new Date(a.completed_at || a.scheduled_date);
          const dateB = new Date(b.completed_at || b.scheduled_date);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Check for consecutive days with completed reminders (extend to 30 days)
        let checkDate = new Date(todayStartOfDay);
        for (let i = 0; i < 30; i++) { // Check last 30 days instead of 7
          const dayStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
          const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
          
          const hasCompletedOnDay = sortedCompleted.some((r: any) => {
            const completedDate = new Date(r.completed_at || r.scheduled_date);
            return completedDate >= dayStart && completedDate < dayEnd;
          });
          
          if (hasCompletedOnDay) {
            currentStreak++;
          } else {
            break; // Streak broken
          }
          
          checkDate.setDate(checkDate.getDate() - 1);
        }
        
        // If no consecutive streak found, show total completed this week as fallback
        if (currentStreak === 0) {
          currentStreak = completedThisWeek.length;
        }
      }
      
      setStreak(currentStreak);
      setWeekProgress({
        completed: completedThisWeek.length,
        missed: missedThisWeek.length,
        total: completedThisWeek.length + missedThisWeek.length,
      });
      
      console.log('[DashboardScreen] Progress calculation:', {
        completed: completedThisWeek.length,
        missed: missedThisWeek.length,
        total: completedThisWeek.length + missedThisWeek.length,
        streak: currentStreak,
        totalCompleted: completedReminders.length,
        completedReminders: completedReminders.map((r: any) => ({
          id: r.id,
          title: r.title,
          completed_at: r.completed_at,
          scheduled_date: r.scheduled_date,
          is_completed: r.is_completed
        }))
      });
    }
  };
  useEffect(() => {
    recalculateWeekProgress();
    
    // Check email verification status
    const checkEmailVerification = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user?.email) {
          setUserEmail(user.email);
          const verified = await authService.isEmailVerified();
          setIsEmailVerified(verified);
          setShowEmailVerificationReminder(!verified);
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
      }
    };
    
    checkEmailVerification();
    
    // Refresh data when screen comes into focus
    const unsubscribe = () => {
      // This will be called when the component unmounts
      return () => {};
    };
    
    return unsubscribe();
  }, []);

  // Helper to show toast/snackbar
  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // For iOS, you can use a custom Toast component or Alert as fallback
      Alert.alert('', message);
    }
  };

  // Fetch partner profile and reminders on mount
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setRemindersLoading(true);
      setRemindersError(null);
      try {
        console.log('[DashboardScreen] Fetching partner data...');
        const { data: partner, error: partnerError } = await partnerService.getPartner();
        if (partnerError) throw new Error(partnerError);
        if (!partner) throw new Error('No partner profile found.');
        if (!isMounted) return;
        
        console.log('[DashboardScreen] Partner data received:', {
          name: partner.name,
          birthday: partner.birthday,
          anniversary: partner.anniversary,
          love_language: partner.love_language
        });
        
        setPartnerProfile(partner);
        const { name, birthday, anniversary, love_language } = partner;
        const partnerData = { name, birthday, anniversary };
        
        console.log('[DashboardScreen] Calling reminder service with partner data:', partnerData);
        const remindersSummary = await reminderService.getUpcomingRemindersSummary(partnerData);
        
        console.log('[DashboardScreen] Reminders summary received:', remindersSummary.length, 'items');
        if (!isMounted) return;
        setReminders(remindersSummary);
      } catch (err: any) {
        if (!isMounted) return;
        if (
          (err.message && err.message.includes('JSON object requested, multiple (or no) rows returned')) ||
          (err.code && err.code === 'PGRST116')
        ) {
          // setAccountDeleted(true); // This line was removed
          // alert('No account found with that information. Please sign up.'); // This line was removed
          // if (typeof onNavigate === 'function') onNavigate('welcome'); // This line was removed
          return;
        }
        console.error('[DashboardScreen] Error in fetchData:', err);
        setRemindersError(err.message || 'Failed to load reminders.');
      } finally {
        if (isMounted) setRemindersLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array means this runs once on mount

  // Add a separate effect to refetch data when screen is focused (for navigation back from AddReminder)
  useEffect(() => {
    const refetchData = async () => {
      if (!partnerProfile) return; // Don't refetch if partner profile isn't loaded yet
      
      console.log('[DashboardScreen] Refetching reminders after navigation...');
      setRemindersLoading(true);
      try {
        const { name, birthday, anniversary } = partnerProfile;
        const partnerData = { name, birthday, anniversary };
        const remindersSummary = await reminderService.getUpcomingRemindersSummary(partnerData);
        console.log('[DashboardScreen] Refreshed reminders:', remindersSummary.length, 'items');
        setReminders(remindersSummary);
      } catch (err: any) {
        console.error('[DashboardScreen] Error refetching reminders:', err);
      } finally {
        setRemindersLoading(false);
      }
    };

    // Refetch data when component mounts (this will catch navigation back from AddReminder)
    refetchData();
  }, [partnerProfile]); // This will run when partnerProfile changes (after initial load)

  // if (accountDeleted) return null; // This line was removed

  // Split reminders into next 3 days and future reminders
  const next3DaysReminders = reminders.filter(r => r.daysUntil <= 3);
  const futureReminders = reminders.filter(r => r.daysUntil > 3);
  // Love language emoji mapping
  const loveLanguageEmojiMap: Record<string, string> = {
    'Words of Affirmation': '💬',
    'Quality Time': '⏰',
    'Physical Touch': '🤗',
    'Acts of Service': '🛠️',
    'Receiving Gifts': '🎁',
  };
  const partnerName = partnerProfile?.name || initialPartnerName;
  const loveEmoji = loveLanguageEmojiMap[loveLanguage] || '💖';

  // Debug logging for reminder filtering
  console.log('[DashboardScreen] Reminder filtering:', {
    totalReminders: reminders.length,
    next3DaysCount: next3DaysReminders.length,
    futureCount: futureReminders.length,
    next3Days: next3DaysReminders.map(r => `${r.title} (${r.daysUntil}d)`),
    future: futureReminders.map(r => `${r.title} (${r.daysUntil}d)`)
  });

  // Contextual quick actions based on next 3 days reminders
  const getContextualActions = () => {
    const baseActions = [];

    // Add contextual actions based on next 3 days reminders
    if (next3DaysReminders.some((r: any) => r.type === 'reminder')) {
      baseActions.push({ id: 5, title: 'Send Message', emoji: '💌', color: '#10B981', priority: 2 });
    }
    
    if (next3DaysReminders.length > 0) {
      baseActions.push({ id: 6, title: 'Quick Gifts', emoji: '🎁', color: '#F59E0B', priority: 3 });
    } else {
      baseActions.push({ id: 2, title: 'View Calendar', emoji: '📅', color: '#10B981', priority: 2 });
      baseActions.push({ id: 3, title: 'Gift Ideas', emoji: '🎁', color: '#F59E0B', priority: 3 });
    }

    return baseActions.sort((a, b) => a.priority - b.priority);
  };

  const contextualActions = getContextualActions();

  const handleScrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // Handle Add Reminder navigation robustly
  const handleAddReminder = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('addReminder' as Screen);
    } else {
      showToast('Navigation is not available. Please try again later.');
      console.warn('onNavigate is not defined');
    }
  };

  // Fallback gesture templates in case database is empty
  const fallbackGestures = [
    {
      id: 'fallback-1',
      title: 'Cook their favorite meal',
      description: 'Prepare a special dinner at home',
      category: 'acts_of_service',
      effort_level: 'medium',
      cost_level: 'low'
    },
    {
      id: 'fallback-2',
      title: 'Write a love letter',
      description: 'Handwrite a heartfelt letter expressing your feelings',
      category: 'words_of_affirmation',
      effort_level: 'low',
      cost_level: 'free'
    },
    {
      id: 'fallback-3',
      title: 'Plan a date night',
      description: 'Organize a special evening just for the two of you',
      category: 'quality_time',
      effort_level: 'medium',
      cost_level: 'low'
    },
    {
      id: 'fallback-4',
      title: 'Buy their favorite flowers',
      description: 'Pick up a bouquet they love',
      category: 'receiving_gifts',
      effort_level: 'low',
      cost_level: 'low'
    },
    {
      id: 'fallback-5',
      title: 'Give a massage',
      description: 'Offer a relaxing back or foot massage',
      category: 'physical_touch',
      effort_level: 'medium',
      cost_level: 'free'
    }
  ];

  // Use database templates or fallback templates
  const availableGestures = fallbackGestures; // Removed gestureTemplates.length > 0 ? gestureTemplates : fallbackGestures;

  // Filter gestures for love language recommendations
  const recommendedGestures = availableGestures.filter(g => {
    if (!allLoveLanguages.length || !g.category) return false;
    return allLoveLanguages.some((loveLang: string) => 
      g.category.toLowerCase().includes(loveLang.toLowerCase().replace(/ /g, '_'))
    );
  });
  const otherGestures = availableGestures.filter(g => !recommendedGestures.includes(g));
  // const searchedGestures = gestureSearch
  //   ? availableGestures.filter(g =>
  //       g.title.toLowerCase().includes(gestureSearch.toLowerCase()) ||
  //       g.description?.toLowerCase().includes(gestureSearch.toLowerCase())
  //     )
  //   : availableGestures;

  // Handle gesture selection
  // const handleSelectGesture = (gesture: any) => {
  //   console.log('[DashboardScreen] Selected gesture:', gesture);
  //   setSelectedGesture(gesture);
  //   setReminderForm({
  //     title: gesture.title,
  //     description: gesture.description || '',
  //     scheduled_date: '',
  //   });
  // };

  // Handle quick action selection robustly
  const handleQuickAction = (action: number) => {
    switch (action) {
      case 1: // Add Reminder
        handleAddReminder();
        break;
      case 2: // View Calendar
        setShowCalendarModal(true);
        break;
      case 3: // Gift Ideas
        setShowQuickGiftsModal(true);
        break;
      case 5: // Send Message
        setShowSendMessageModal(true);
        setMessageForm({ message: '', scheduled_date: '' });
        setMessageError(null);
        break;
      case 6: // Quick Gifts
        setShowQuickGiftsModal(true);
        break;
      default:
        break;
    }
  };

  // Handle quick gift selection
  const handleQuickGift = async (giftName: string, giftType: 'flower' | 'food' | 'gift') => {
    try {
      if (!partnerProfile || !partnerProfile.id) {
        console.error('[DashboardScreen] No partner profile found for quick gift');
        return;
      }

      // Create a gesture for the gift
      const gestureData = {
        partner_id: partnerProfile.id,
        title: giftType === 'food' ? `Order ${giftName}` : `Buy ${giftName}`,
        description: `Surprise ${partnerName} with ${giftName.toLowerCase()}`,
        effort_level: 'low',
        cost_level: giftType === 'flower' ? 'low' : giftType === 'food' ? 'medium' : 'high',
        category: giftType === 'flower' ? 'receiving_gifts' : giftType === 'food' ? 'acts_of_service' : 'receiving_gifts',
        is_template: false,
      };

      const { data: gesture, error: gestureError } = await gestureService.createGesture(gestureData);
      
      if (gestureError) {
        console.error('[DashboardScreen] Error creating gesture for gift:', gestureError);
        return;
      }

      const gestureId = gesture?.id;

      // Create a reminder for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0); // Set to noon tomorrow

      const reminderData = {
        partner_id: partnerProfile.id,
        gesture_id: gestureId,
        title: giftType === 'food' ? `Order ${giftName}` : `Buy ${giftName}`,
        description: `Surprise ${partnerName} with ${giftName.toLowerCase()}`,
        scheduled_date: tomorrow.toISOString(),
      };

      console.log('[DashboardScreen] Creating reminder for gift:', reminderData);
      
      const { data: createdReminder, error: reminderError } = await reminderService.createReminder(reminderData);
      
      if (reminderError) {
        console.error('[DashboardScreen] Error creating reminder for gift:', reminderError);
        return;
      }

      console.log('[DashboardScreen] Quick gift created successfully:', giftName, 'Reminder ID:', createdReminder?.id);
      
      // Close modal and refresh reminders
      setShowQuickGiftsModal(false);
      
      // Refresh reminders with better error handling
      setRemindersLoading(true);
      try {
        const { name, birthday, anniversary } = partnerProfile;
        const partnerData = { name, birthday, anniversary };
        console.log('[DashboardScreen] Refreshing reminders with partner data:', partnerData);
        
        const remindersSummary = await reminderService.getUpcomingRemindersSummary(partnerData);
        console.log('[DashboardScreen] Refreshed reminders after quick gift:', remindersSummary.length, 'reminders');
        
        // Debug: Log all reminders to see what we got
        remindersSummary.forEach((reminder, index) => {
          console.log(`[DashboardScreen] Reminder ${index + 1}:`, {
            id: reminder.id,
            title: reminder.title,
            daysUntil: reminder.daysUntil,
            isUrgent: reminder.isUrgent,
            scheduled_date: reminder.scheduled_date
          });
        });
        
        setReminders(remindersSummary);
        await recalculateWeekProgress();
      } catch (refreshError: any) {
        console.error('[DashboardScreen] Error refreshing reminders after quick gift:', refreshError);
      } finally {
        setRemindersLoading(false);
      }
      
    } catch (err: any) {
      console.error('[DashboardScreen] Unexpected error creating quick gift:', err);
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageForm.message.trim()) {
      setMessageError('Please enter a message');
      return;
    }
    
    setMessageSaving(true);
    setMessageError(null);
    console.log('[DashboardScreen] Sending message...', messageForm);
    
    try {
      // Create a reminder for the message
      if (!partnerProfile || !partnerProfile.id) {
        setMessageError('Partner profile not loaded');
        setMessageSaving(false);
        return;
      }

      // Use provided date or default to tomorrow
      const scheduledDate = messageForm.scheduled_date || (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);
        return tomorrow.toISOString();
      })();

      const reminderData = {
        partner_id: partnerProfile.id,
        gesture_id: null,
        title: 'Send Message',
        description: messageForm.message,
        scheduled_date: scheduledDate,
      };

      const { error } = await reminderService.createReminder(reminderData);
      
      if (error) {
        setMessageError(error);
        setMessageSaving(false);
        return;
      }

      console.log('[DashboardScreen] Message reminder created successfully');
      setShowSendMessageModal(false);
      setMessageSaving(false);
      
      // Refresh reminders
      setRemindersLoading(true);
      try {
        const { name, birthday, anniversary } = partnerProfile;
        const partnerData = { name, birthday, anniversary };
        const remindersSummary = await reminderService.getUpcomingRemindersSummary(partnerData);
        setReminders(remindersSummary);
        await recalculateWeekProgress();
      } catch (refreshError: any) {
        console.error('[DashboardScreen] Error refreshing reminders:', refreshError);
      } finally {
        setRemindersLoading(false);
      }
      
    } catch (err: any) {
      console.error('[DashboardScreen] Error sending message:', err);
      setMessageError(err.message || 'Failed to send message');
      setMessageSaving(false);
    }
  };

  // Handle reminder form save
  // const handleSaveReminder = async () => { ... } // This function was removed

  // Quick Actions styles
  const quickActionStyles = StyleSheet.create({
    actionButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.background,
      minWidth: 90,
      minHeight: 90,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    actionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.neutral[800],
      textAlign: 'center',
      marginTop: 2,
    },
  });

  // After Quick Actions section, show subscription/billing summary card
  {subscriptionStatus && subscriptionStatus.status === 'active' && (
    <Card style={{ marginTop: 16, marginBottom: 24, backgroundColor: 'rgba(236, 233, 255, 0.7)', borderLeftWidth: 4, borderLeftColor: theme.colors.primary[400], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 }}>
      <View>
        <Text style={{ fontWeight: '700', fontSize: 16, color: theme.colors.primary[700], marginBottom: 2 }}>
          {subscriptionStatus.planType === 'weekly'
            ? 'Weekly Plan Active'
            : subscriptionStatus.planType === 'monthly'
            ? 'Monthly Plan Active'
            : subscriptionStatus.planType === 'yearly'
            ? 'Yearly Plan Active'
            : 'Paid Plan Active'}
        </Text>
        <Text style={{ color: theme.colors.neutral[700], fontSize: 14 }}>
          You have full access to all features
        </Text>
        {subscriptionStatus.next_billing_date && (
          <Text style={{ color: theme.colors.neutral[500], fontSize: 13, marginTop: 2 }}>
            Next billing: {new Date(subscriptionStatus.next_billing_date).toLocaleDateString()}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={{ backgroundColor: theme.colors.neutral[200], borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginLeft: 12 }}
        onPress={() => onNavigate?.('subscription')}
        accessibilityLabel="Manage Subscription"
        accessibilityRole="button"
      >
        <Text style={{ color: theme.colors.primary[700], fontWeight: '600', fontSize: 15 }}>Manage</Text>
      </TouchableOpacity>
    </Card>
  )}

  // Add useEffect to refetch subscriptionStatus when returning from SubscriptionScreen
  useEffect(() => {
    // Refetch subscription status when dashboard regains focus or after subscription change
    if (typeof onNavigate === 'function' && subscriptionStatus) {
      subscriptionService.getSubscriptionStatus().then((status) => {
        if (status) {
          // Optionally update local state if needed
        }
      });
    }
  }, [subscriptionStatus]);

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
          {/* Header row: partner info (left), avatar/dropdown (right) - at very top of dashboard */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, marginTop: 24, paddingHorizontal: 0 }}>
            <View style={{ flexShrink: 1 }}>
              <Text style={[responsiveStyles.greeting, { fontSize: 28, fontWeight: '700', marginBottom: 2 }]} numberOfLines={1} ellipsizeMode="tail">{partnerName} <Text style={{ fontSize: 26 }}>{loveEmoji}</Text></Text>
              <Text style={[responsiveStyles.date, { fontSize: 15, color: theme.colors.neutral[500], marginBottom: 8 }]} numberOfLines={1} ellipsizeMode="tail">{formatDate(today)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.colors.success[50], borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 2 }}>
                <Text style={{ fontSize: 15, marginRight: 2 }}>🔥</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.success[600] }}>{streak}-day streak</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Recent Activity Button */}
              <TouchableOpacity
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingVertical: 8, 
                  paddingHorizontal: 16, 
                  borderRadius: 20, 
                  backgroundColor: theme.colors.primary[50],
                  borderWidth: 1,
                  borderColor: theme.colors.primary[200]
                }}
                onPress={() => onNavigate?.('recentActivity')}
                accessibilityLabel="View Recent Activity"
                accessibilityRole="button"
              >
                <MaterialIcons name="history" size={18} color={theme.colors.primary[600]} />
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: theme.colors.primary[700], 
                  marginLeft: 6 
                }}>
                  Activity
                </Text>
              </TouchableOpacity>
              
              {/* Profile Menu Button */}
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 18, backgroundColor: theme.colors.primary[50] }}
                onPress={() => setShowProfileMenu(true)}
                accessibilityLabel="Open Profile Menu"
                accessibilityRole="button"
              >
                <MaterialIcons name="person" size={32} color={theme.colors.primary[400]} />
                <MaterialIcons name="expand-more" size={24} color={theme.colors.primary[400]} style={{ marginLeft: 4 }} />
              </Pressable>
            </View>
          </View>
          
          {/* Email Verification Reminder */}
          {showEmailVerificationReminder && (
            <EmailVerificationReminder
              email={userEmail}
              onDismiss={() => setShowEmailVerificationReminder(false)}
            />
          )}
          
          {/* Profile Dropdown Modal (top right, elegant, correct order) */}
          {showProfileMenu && (
            <Modal
              visible={showProfileMenu}
              animationType="fade"
              transparent={true}
              onRequestClose={() => setShowProfileMenu(false)}
            >
              <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.18)' }} onPress={() => setShowProfileMenu(false)}>
                <View style={{ position: 'absolute', top: 60, right: 16, minWidth: 260, backgroundColor: 'white', borderRadius: 22, padding: 20, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, elevation: 16, alignItems: 'stretch' }}>
                  {/* Profile Details */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <MaterialIcons name="person" size={32} color={theme.colors.primary[400]} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: theme.colors.neutral[900] }}>{partnerProfile?.name || partnerName}</Text>
                      <Text style={{ fontSize: 13, color: theme.colors.neutral[500], marginTop: 1 }}>
                        {allLoveLanguages.length > 0 
                          ? `Love Languages: ${allLoveLanguages.join(', ')}` 
                          : ''
                        }
                      </Text>
                    </View>
                  </View>
                  {/* Edit Profile */}
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      setShowProfileMenu(false);
                      onNavigate?.('editPartner');
                    }}
                  >
                    <MaterialIcons name="edit" size={22} color={theme.colors.primary[400]} style={{ marginRight: 10 }} />
                    <Text style={[styles.menuItemText, { color: theme.colors.primary[600] }]}>Edit Profile</Text>
                  </TouchableOpacity>
                  {/* Recent Activity */}
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      setShowProfileMenu(false);
                      onNavigate?.('recentActivity');
                    }}
                  >
                    <MaterialIcons name="history" size={22} color={theme.colors.primary[400]} style={{ marginRight: 10 }} />
                    <Text style={[styles.menuItemText, { color: theme.colors.primary[600] }]}>Recent Activity</Text>
                  </TouchableOpacity>
                  {/* Billing */}
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      setShowProfileMenu(false);
                      onNavigate && onNavigate('subscription');
                    }}
                  >
                    <MaterialIcons name="credit-card" size={22} color={theme.colors.success[500]} style={{ marginRight: 10 }} />
                    <Text style={[styles.menuItemText, { color: theme.colors.success[600] }]}>Billing</Text>
                  </TouchableOpacity>
                  {/* Settings */}
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      setShowProfileMenu(false);
                      onNavigate?.('settings');
                    }}
                  >
                    <MaterialIcons name="settings" size={22} color={theme.colors.primary[400]} style={{ marginRight: 10 }} />
                    <Text style={[styles.menuItemText, { color: theme.colors.primary[600] }]}>Settings</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                  {/* Sign Out */}
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      setShowProfileMenu(false);
                      onLogout?.();
                    }}
                  >
                    <MaterialIcons name="logout" size={22} color={theme.colors.error[500]} style={{ marginRight: 10 }} />
                    <Text style={[styles.menuItemText, styles.logoutText]}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
          )}
          {/* This Week's Progress Card */}
          <Card style={{
            marginBottom: theme.spacing[6],
            backgroundColor: '#F6F8FF',
            borderRadius: theme.radius.lg,
            padding: theme.spacing[5],
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.primary[700], marginBottom: 8 }}>This Week's Progress</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 16, color: theme.colors.success[600], fontWeight: '600', marginRight: 12 }}>✔️ {weekProgress.completed} Completed</Text>
              <TouchableOpacity 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  backgroundColor: weekProgress.missed > 0 ? theme.colors.error[50] : 'transparent',
                  borderRadius: 8,
                  paddingHorizontal: weekProgress.missed > 0 ? 8 : 0,
                  paddingVertical: weekProgress.missed > 0 ? 4 : 0,
                }}
                onPress={() => {
                  if (weekProgress.missed > 0) {
                    Alert.alert(
                      'View Missed Activities',
                      `You have ${weekProgress.missed} missed reminder${weekProgress.missed > 1 ? 's' : ''} this week. Tap to view and manage them in Recent Activities.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'View Activities', 
                          onPress: () => onNavigate?.('recentActivity'),
                          style: 'default'
                        }
                      ]
                    );
                  }
                }}
                disabled={weekProgress.missed === 0}
              >
                <Text style={{ 
                  fontSize: 16, 
                  color: theme.colors.error[600], 
                  fontWeight: '600',
                  textDecorationLine: weekProgress.missed > 0 ? 'underline' : 'none'
                }}>
                  ❌ {weekProgress.missed} Missed
                </Text>
                {weekProgress.missed > 0 && (
                  <MaterialIcons 
                    name="arrow-forward-ios" 
                    size={14} 
                    color={theme.colors.error[600]} 
                    style={{ marginLeft: 4 }}
                  />
                )}
              </TouchableOpacity>
            </View>
            {/* Progress Bar */}
            <View style={{ height: 10, borderRadius: 6, backgroundColor: theme.colors.neutral[200], overflow: 'hidden', marginTop: 4 }}>
              <View style={{
                width: weekProgress.total > 0 ? `${(weekProgress.completed / weekProgress.total) * 100}%` : '0%',
                height: '100%',
                backgroundColor: theme.colors.success[500],
                borderRadius: 6,
              }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <Text style={{ 
                fontSize: 13, 
                color: theme.colors.neutral[500],
                flex: 1,
                marginRight: 12
              }}>
                {weekProgress.total === 0 ? 'No reminders completed or missed this week yet.' : `${weekProgress.completed + weekProgress.missed} total reminders this week`}
              </Text>
              <TouchableOpacity
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  backgroundColor: theme.colors.primary[50],
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: theme.colors.primary[200],
                  flexShrink: 0
                }}
                onPress={() => onNavigate?.('recentActivity')}
              >
                <MaterialIcons name="history" size={16} color={theme.colors.primary[600]} />
                <Text style={{ 
                  fontSize: 13, 
                  fontWeight: '600', 
                  color: theme.colors.primary[600], 
                  marginLeft: 6 
                }}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
          {/* First-time user hint */}
          {reminders.length === 0 && !remindersLoading && (
            <Card style={styles.onboardingCard}>
              <View style={styles.onboardingContent}>
                <Text style={styles.onboardingEmoji}>🎯</Text>
                <View style={styles.onboardingText}>
                  <Text style={styles.onboardingTitle}>Welcome to SweetCue!</Text>
                  <Text style={styles.onboardingDescription}>
                    Start by adding your partner's birthday and anniversary, then create reminders for thoughtful gestures.
                  </Text>
                </View>
              </View>
            </Card>
          )}
          {/* Next 3 Days - Immediate Priorities */}
          <Card style={{
            marginBottom: theme.spacing[6],
            backgroundColor: '#FFF6F6',
            borderRadius: theme.radius.lg,
            padding: theme.spacing[5],
            shadowColor: '#F87171',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.error[600], marginRight: 8 }}>Next 3 Days</Text>
              <TouchableOpacity
                style={{ marginLeft: 2, backgroundColor: theme.colors.error[50], borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2 }}
                onPress={() => Alert.alert('Next 3 Days', 'Shows your most urgent reminders and upcoming birthdays/anniversaries within the next 3 days. These are your immediate priorities to focus on.')}
              >
                <Text style={{ color: theme.colors.error[500], fontWeight: '700', fontSize: 15 }}>?</Text>
              </TouchableOpacity>
              {!remindersLoading && next3DaysReminders.length > 0 && (
                <View style={{ marginLeft: 10, backgroundColor: theme.colors.error[500], borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>{next3DaysReminders.length}</Text>
                </View>
              )}
            </View>
            {remindersLoading ? (
              <EmptyState title="Loading reminders..." description="Fetching your immediate priorities." />
            ) : remindersError ? (
              <EmptyState
                title="Couldn't load reminders"
                description={remindersError}
                actionText="Retry"
                onActionPress={() => {
                  setRemindersLoading(true);
                  setRemindersError(null);
                  partnerService.getPartner().then(({ data: partner, error: partnerError }) => {
                    if (partnerError || !partner) {
                      setRemindersError(partnerError || 'No partner profile found.');
                      setRemindersLoading(false);
                      return;
                    }
                    const { name, birthday, anniversary } = partner;
                    const partnerData = { name, birthday, anniversary };
                    reminderService.getUpcomingRemindersSummary(partnerData).then((remindersSummary) => {
                      setReminders(remindersSummary);
                      setRemindersLoading(false);
                    }).catch((err) => {
                      setRemindersError(err.message || 'Failed to load reminders.');
                      setRemindersLoading(false);
                    });
                  });
                }}
                variant="error"
              />
            ) : next3DaysReminders.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 18 }}>
                <Text style={{ fontSize: 16, color: theme.colors.neutral[500], marginBottom: 6 }}>🎉 You're all caught up for the next 3 days!</Text>
                <TouchableOpacity
                  style={{ marginTop: 8, backgroundColor: theme.colors.primary[50], borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }}
                  onPress={handleAddReminder}
                >
                  <Text style={{ color: theme.colors.primary[600], fontWeight: '600', fontSize: 15 }}>Add Reminder</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: theme.spacing[3] }}>
                {next3DaysReminders.map((reminder: any, idx: number) => (
                  <Animated.View key={reminder.id} style={{ opacity: reminder._animating ? 0.5 : 1 }}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedReminder(reminder);
                        setShowReminderModal(true);
                      }}
                    >
                      <Card style={{
                        backgroundColor: '#FFF',
                        borderRadius: theme.radius.md,
                        padding: theme.spacing[4],
                        flexDirection: 'row',
                        alignItems: 'center',
                        shadowColor: '#F87171',
                        shadowOpacity: 0.07,
                        shadowRadius: 8,
                        elevation: 2,
                        marginBottom: 2,
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Text style={{ fontSize: 24, marginRight: theme.spacing[3] }}>{reminder.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.neutral[900], marginBottom: 2 }}>{reminder.title}</Text>
                            <Text style={{ fontSize: 14, color: theme.colors.error[500], fontWeight: '500' }}>
                              {reminder.daysUntil === 0 ? 'Due Today' : new Date(reminder.scheduled_date).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                          <View style={{ backgroundColor: theme.colors.error[50], borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 }}>
                            <Text style={{ color: theme.colors.error[500], fontWeight: '700', fontSize: 14 }}>
                              {reminder.daysUntil === 0 ? 'Now' : `${reminder.daysUntil}d`}
                            </Text>
                          </View>
                          {reminder.type === 'reminder' && (
                            <TouchableOpacity
                              style={styles.completeIconButton}
                              activeOpacity={0.7}
                              onPress={async () => {
                                next3DaysReminders[idx]._animating = true;
                                setReminders([...reminders]);
                                try {
                                  const { error } = await reminderService.completeReminder(reminder.id);
                                  if (error) {
                                    showToast(error);
                                  } else {
                                    showToast('Marked as completed!');
                                    setTimeout(async () => {
                                      setRemindersLoading(true);
                                      const { name, birthday, anniversary } = partnerProfile;
                                      const partnerData = { name, birthday, anniversary };
                                      const remindersSummary = await reminderService.getUpcomingRemindersSummary(partnerData);
                                      setReminders(remindersSummary);
                                      await recalculateWeekProgress();
                                      setRemindersLoading(false);
                                    }, 500); // Increased delay to 500ms for DB consistency
                                  }
                                } catch (err: any) {
                                  showToast(err.message || 'Failed to complete reminder');
                                }
                              }}
                              accessibilityLabel="Mark as Completed"
                            >
                              <MaterialIcons name={reminder._animating ? 'check-circle' : 'check-circle-outline'} size={28} color={reminder._animating ? theme.colors.success[600] || '#22C55E' : theme.colors.neutral[400]} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </Card>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}
          </Card>
          {/* Upcoming Reminders */}
          <Card style={{
            marginBottom: theme.spacing[6],
            backgroundColor: '#F7FAFF',
            borderRadius: theme.radius.lg,
            padding: theme.spacing[5],
            shadowColor: '#60A5FA',
            shadowOpacity: 0.07,
            shadowRadius: 12,
            elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.primary[700], marginRight: 8 }}>Upcoming Reminders</Text>
              <TouchableOpacity
                style={{ marginLeft: 2, backgroundColor: theme.colors.primary[50], borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2 }}
                onPress={() => Alert.alert('Upcoming Reminders', 'Shows reminders, birthdays, and anniversaries coming up in the next 30 days. This helps you plan ahead for important moments.')}
              >
                <Text style={{ color: theme.colors.primary[500], fontWeight: '700', fontSize: 15 }}>?</Text>
              </TouchableOpacity>
              {!remindersLoading && futureReminders.length > 3 && (
                <TouchableOpacity style={{ marginLeft: 10, backgroundColor: theme.colors.primary[500], borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 }} onPress={() => onNavigate?.('reminderSetup')}>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            {remindersLoading ? (
              <EmptyState title="Loading reminders..." description="Fetching your upcoming reminders." />
            ) : remindersError ? (
              <EmptyState
                title="Couldn't load reminders"
                description={remindersError}
                actionText="Retry"
                onActionPress={() => {
                  setRemindersLoading(true);
                  setRemindersError(null);
                  partnerService.getPartner().then(({ data: partner, error: partnerError }) => {
                    if (partnerError || !partner) {
                      setRemindersError(partnerError || 'No partner profile found.');
                      setRemindersLoading(false);
                      return;
                    }
                    const { name, birthday, anniversary } = partner;
                    const partnerData = { name, birthday, anniversary };
                    reminderService.getUpcomingRemindersSummary(partnerData).then((remindersSummary) => {
                      setReminders(remindersSummary);
                      setRemindersLoading(false);
                    }).catch((err) => {
                      setRemindersError(err.message || 'Failed to load reminders.');
                      setRemindersLoading(false);
                    });
                  });
                }}
                variant="error"
              />
            ) : futureReminders.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 18 }}>
                <Text style={{ fontSize: 16, color: theme.colors.neutral[500], marginBottom: 6 }}>🎉 No upcoming reminders!</Text>
                <TouchableOpacity
                  style={{ marginTop: 8, backgroundColor: theme.colors.primary[50], borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }}
                  onPress={handleAddReminder}
                >
                  <Text style={{ color: theme.colors.primary[600], fontWeight: '600', fontSize: 15 }}>Add Reminder</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: theme.spacing[3] }}>
                {futureReminders.map((reminder: any, idx: number) => {
                  const isBirthday = reminder.type === 'birthday';
                  const isAnniversary = reminder.type === 'anniversary';
                  return (
                    <Animated.View key={reminder.id} style={{ opacity: reminder._animating ? 0.5 : 1 }}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => {
                          setSelectedReminder(reminder);
                          setShowReminderModal(true);
                        }}
                      >
                        <Card style={{
                          backgroundColor: isBirthday ? '#FFF7ED' : isAnniversary ? '#F0FDF4' : '#FFF',
                          borderRadius: theme.radius.md,
                          padding: theme.spacing[4],
                          flexDirection: 'row',
                          alignItems: 'center',
                          shadowColor: '#60A5FA',
                          shadowOpacity: 0.07,
                          shadowRadius: 8,
                          elevation: 2,
                          marginBottom: 2,
                          borderWidth: isBirthday || isAnniversary ? 2 : 0,
                          borderColor: isBirthday ? theme.colors.warning[500] : isAnniversary ? theme.colors.success[500] : 'transparent',
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Text style={{ fontSize: 24, marginRight: theme.spacing[3] }}>{reminder.emoji}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.neutral[900], marginBottom: 2 }}>{reminder.title}</Text>
                              <Text style={{ fontSize: 14, color: isBirthday ? theme.colors.warning[600] : isAnniversary ? theme.colors.success[600] : theme.colors.primary[600], fontWeight: '500' }}>
                                {new Date(reminder.scheduled_date).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                          <View style={{ alignItems: 'center' }}>
                            <View style={{ backgroundColor: theme.colors.primary[50], borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 }}>
                              <Text style={{ color: theme.colors.primary[500], fontWeight: '700', fontSize: 14 }}>{reminder.daysUntil}d</Text>
                            </View>
                            {reminder.type === 'reminder' && (
                              <TouchableOpacity
                                style={{ backgroundColor: theme.colors.success[50], borderRadius: 20, padding: 4, alignItems: 'center', justifyContent: 'center' }}
                                activeOpacity={0.7}
                                onPress={async () => {
                                  futureReminders[idx]._animating = true;
                                  setReminders([...reminders]);
                                  try {
                                    const { error } = await reminderService.completeReminder(reminder.id);
                                    if (error) {
                                      showToast(error);
                                    } else {
                                      showToast('Marked as completed!');
                                      setTimeout(async () => {
                                        setRemindersLoading(true);
                                        const { name, birthday, anniversary } = partnerProfile;
                                        const partnerData = { name, birthday, anniversary };
                                        const remindersSummary = await reminderService.getUpcomingRemindersSummary(partnerData);
                                        setReminders(remindersSummary);
                                        await recalculateWeekProgress();
                                        setRemindersLoading(false);
                                      }, 500); // Increased delay to 500ms for DB consistency
                                    }
                                  } catch (err: any) {
                                    showToast(err.message || 'Failed to complete reminder');
                                  }
                                }}
                                accessibilityLabel="Mark as Completed"
                              >
                                <MaterialIcons name={reminder._animating ? 'check-circle' : 'check-circle-outline'} size={28} color={reminder._animating ? theme.colors.success[600] || '#22C55E' : theme.colors.neutral[400]} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </Card>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </Card>
          {/* Quick Actions */}
          <View style={{ marginTop: 28, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 19, fontWeight: '700', color: theme.colors.neutral[900], letterSpacing: 0.1 }}>Quick Actions</Text>
              <TouchableOpacity style={{ marginLeft: 8, backgroundColor: theme.colors.primary[50], borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2 }} onPress={() => Alert.alert('Quick Actions', 'Shortcuts to your most common actions: send a message, quick gifts, and more.') }>
                <Text style={{ color: theme.colors.primary[400], fontWeight: '700', fontSize: 16 }}>?</Text>
              </TouchableOpacity>
            </View>
            <View style={{
              backgroundColor: theme.colors.background,
              borderRadius: 22,
              padding: 18,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 4,
              gap: 18,
            }}>
              <TouchableOpacity
                style={quickActionStyles.actionButton}
                onPress={() => setShowSendMessageModal(true)}
                activeOpacity={0.85}
                accessibilityLabel="Send Message"
                accessibilityRole="button"
              >
                <View style={[quickActionStyles.iconCircle, { backgroundColor: theme.colors.success[50] }] }>
                  <MaterialIcons name="mail" size={30} color={theme.colors.success[600]} />
                </View>
                <Text style={quickActionStyles.actionLabel}>Send Message</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={quickActionStyles.actionButton}
                onPress={() => handleQuickAction(3)}
                activeOpacity={0.85}
                accessibilityLabel="Quick Gifts"
                accessibilityRole="button"
              >
                <View style={[quickActionStyles.iconCircle, { backgroundColor: theme.colors.warning[50] }] }>
                  <MaterialIcons name="card-giftcard" size={30} color={theme.colors.warning[600]} />
                </View>
                <Text style={quickActionStyles.actionLabel}>Quick Gifts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={quickActionStyles.actionButton}
                onPress={() => handleQuickAction(2)}
                activeOpacity={0.85}
                accessibilityLabel="View Calendar"
                accessibilityRole="button"
              >
                <View style={[quickActionStyles.iconCircle, { backgroundColor: theme.colors.primary[50] }] }>
                  <MaterialIcons name="calendar-today" size={30} color={theme.colors.primary[600]} />
                </View>
                <Text style={quickActionStyles.actionLabel}>View Calendar</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Subscription Status - Moved to bottom */}
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
                      {subscriptionPlan === 'weekly' ? 'Weekly Plan Active' : subscriptionPlan === 'monthly' ? 'Monthly Plan Active' : subscriptionPlan === 'yearly' ? 'Yearly Plan Active' : 'Paid Plan Active'}
                    </Text>
                    <Text style={styles.subscriptionSubtext}>
                      You have full access to all features
                    </Text>
                    {subscriptionStatus?.next_billing_date && (
                      <Text style={styles.subscriptionSubtext}>
                        Next billing: {new Date(subscriptionStatus.next_billing_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.manageButton}
                  onPress={() => onNavigate && onNavigate('subscription')}
                >
                  <Text style={styles.manageButtonText}>Manage</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Send Message Modal */}
          {showSendMessageModal && (
            <Modal visible onRequestClose={() => setShowSendMessageModal(false)} animationType="slide" transparent>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                  <RNSafeAreaView style={{ width: '100%', alignItems: 'center', flex: 1 }}>
                    <Card style={{ width: '95%', maxWidth: 420, maxHeight: '90%', padding: 0, marginTop: 16, marginBottom: 16 }}>
                      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingTop: theme.spacing[6] }} showsVerticalScrollIndicator={false}>
                        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: theme.spacing[2] }}>Send Message</Text>
                        <Text style={{ color: theme.colors.neutral[600], marginBottom: theme.spacing[3], fontSize: 15 }}>
                          Send a sweet message to {partnerName}. You can schedule it for later or send it now.
                        </Text>
                        
                        {/* Message Form */}
                        <View style={{ marginBottom: theme.spacing[3] }}>
                          <Text style={{ fontWeight: '600', marginBottom: theme.spacing[1] }}>Message</Text>
                          <TextInput
                            style={{ backgroundColor: theme.colors.neutral[50], borderRadius: 8, padding: 10, fontSize: 16, marginBottom: theme.spacing[2], minHeight: 80 }}
                            placeholder="Write your message here..."
                            value={messageForm.message}
                            onChangeText={text => setMessageForm(f => ({ ...f, message: text }))}
                            placeholderTextColor={theme.colors.neutral[400]}
                            multiline
                            textAlignVertical="top"
                            accessibilityLabel="Message Text"
                          />
                          <Text style={{ fontWeight: '600', marginBottom: theme.spacing[1] }}>When to send</Text>
                          <DatePicker 
                            label="Date" 
                            value={messageForm.scheduled_date} 
                            onDateChange={date => setMessageForm(f => ({ ...f, scheduled_date: date }))} 
                          />
                        </View>
                        
                        {messageError && <Text style={{ color: theme.colors.error[600], marginBottom: theme.spacing[2] }}>{messageError}</Text>}
                        <Button
                          title={messageSaving ? 'Sending...' : 'Send Message'}
                          onPress={handleSendMessage}
                          style={messageSaving ? { ...styles.primaryButton, ...styles.primaryButtonDisabled } : styles.primaryButton}
                          disabled={messageSaving}
                        />
                        <Button title="Cancel" onPress={() => setShowSendMessageModal(false)} variant="ghost" />
                      </ScrollView>
                    </Card>
                  </RNSafeAreaView>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}

          {/* Quick Gifts Modal */}
          {showQuickGiftsModal && (
            <Modal visible onRequestClose={() => setShowQuickGiftsModal(false)} animationType="slide" transparent>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                  <RNSafeAreaView style={{ width: '100%', alignItems: 'center', flex: 1 }}>
                    <Card style={{ width: '95%', maxWidth: 420, maxHeight: '90%', padding: 0, marginTop: 16, marginBottom: 16 }}>
                      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingTop: theme.spacing[6] }} showsVerticalScrollIndicator={false}>
                        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: theme.spacing[2] }}>Quick Gifts</Text>
                        <Text style={{ color: theme.colors.neutral[600], marginBottom: theme.spacing[3], fontSize: 15 }}>
                          Quick gift ideas for {partnerName}. Tap any gift to create a reminder.
                        </Text>
                        <View style={{ backgroundColor: theme.colors.primary[50], padding: theme.spacing[3], borderRadius: theme.radius.md, marginBottom: theme.spacing[3] }}>
                          <Text style={{ fontSize: 13, color: theme.colors.primary[700], fontWeight: '500' }}>💡 How it works:</Text>
                          <Text style={{ fontSize: 13, color: theme.colors.primary[600], marginTop: 2 }}>
                            Selecting a gift creates both a gesture and a reminder. The reminder will appear in "Next 3 Days" when it's time to get the gift.
                          </Text>
                        </View>
                        
                        {/* Gift Categories */}
                        <View style={{ marginBottom: theme.spacing[4] }}>
                          <Text style={{ fontWeight: '600', marginBottom: theme.spacing[2] }}>💐 Flowers & Plants</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
                            {['Roses', 'Tulips', 'Sunflowers', 'Succulent Plant', 'Orchid'].map((gift) => (
                              <TouchableOpacity 
                                key={gift}
                                style={{ 
                                  backgroundColor: theme.colors.primary[50], 
                                  paddingHorizontal: theme.spacing[3], 
                                  paddingVertical: theme.spacing[2], 
                                  borderRadius: theme.radius.md,
                                  borderWidth: 1,
                                  borderColor: theme.colors.primary[200]
                                }}
                                onPress={() => handleQuickGift(gift, 'flower')}
                              >
                                <Text style={{ color: theme.colors.primary[700], fontWeight: '500' }}>{gift}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        <View style={{ marginBottom: theme.spacing[4] }}>
                          <Text style={{ fontWeight: '600', marginBottom: theme.spacing[2] }}>☕ Food & Drinks</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
                            {['Coffee Delivery', 'Chocolate Box', 'Wine', 'Fruit Basket', 'Cake'].map((gift) => (
                              <TouchableOpacity 
                                key={gift}
                                style={{ 
                                  backgroundColor: theme.colors.primary[50], 
                                  paddingHorizontal: theme.spacing[3], 
                                  paddingVertical: theme.spacing[2], 
                                  borderRadius: theme.radius.md,
                                  borderWidth: 1,
                                  borderColor: theme.colors.primary[200]
                                }}
                                onPress={() => handleQuickGift(gift, 'food')}
                              >
                                <Text style={{ color: theme.colors.primary[700], fontWeight: '500' }}>{gift}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        <View style={{ marginBottom: theme.spacing[4] }}>
                          <Text style={{ fontWeight: '600', marginBottom: theme.spacing[2] }}>🎁 Small Gifts</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
                            {['Candle', 'Book', 'Socks', 'Jewelry', 'Spa Kit'].map((gift) => (
                              <TouchableOpacity 
                                key={gift}
                                style={{ 
                                  backgroundColor: theme.colors.primary[50], 
                                  paddingHorizontal: theme.spacing[3], 
                                  paddingVertical: theme.spacing[2], 
                                  borderRadius: theme.radius.md,
                                  borderWidth: 1,
                                  borderColor: theme.colors.primary[200]
                                }}
                                onPress={() => handleQuickGift(gift, 'gift')}
                              >
                                <Text style={{ color: theme.colors.primary[700], fontWeight: '500' }}>{gift}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        <Button title="Cancel" onPress={() => setShowQuickGiftsModal(false)} variant="ghost" />
                      </ScrollView>
                    </Card>
                  </RNSafeAreaView>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}

          {/* Reminder Details Modal */}
          {showReminderModal && selectedReminder && (
            <Modal
              visible
              transparent
              animationType="slide"
              onRequestClose={() => setShowReminderModal(false)}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                  <Card style={{ width: '95%', maxWidth: 420, padding: 0 }}>
                    <View style={{ padding: 24 }}>
                      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>{selectedReminder.title}</Text>
                      <Text style={{ color: theme.colors.neutral[600], marginBottom: 8 }}>{selectedReminder.description}</Text>
                      <Text style={{ color: theme.colors.primary[600], marginBottom: 8 }}>Date: {new Date(selectedReminder.scheduled_date).toLocaleDateString()}</Text>
                      {selectedReminder.gesture && <Text style={{ color: theme.colors.neutral[700], marginBottom: 8 }}>Gesture: {selectedReminder.gesture}</Text>}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
                        {/* Edit Action */}
                        <TouchableOpacity
                          style={{ padding: 12, borderRadius: 8, backgroundColor: theme.colors.primary[50], marginRight: 8, opacity: modalActionLoading ? 0.5 : 1 }}
                          disabled={modalActionLoading}
                          onPress={() => {
                            setShowReminderModal(false);
                            // Store the reminder data for editing
                            (global as any).editingReminder = selectedReminder;
                            onNavigate && onNavigate('addReminder' as Screen);
                          }}
                        >
                          <Text style={{ color: theme.colors.primary[600], fontWeight: '600' }}>Edit</Text>
                        </TouchableOpacity>
                        {/* Mark as Completed */}
                        {!selectedReminder.is_completed && (
                          <TouchableOpacity
                            style={{ padding: 12, borderRadius: 8, backgroundColor: theme.colors.success[50], marginRight: 8, opacity: modalActionLoading ? 0.5 : 1 }}
                            disabled={modalActionLoading}
                            onPress={async () => {
                              setModalActionLoading(true);
                              try {
                                const { error } = await reminderService.completeReminder(selectedReminder.id);
                                if (error) {
                                  showToast(error);
                                } else {
                                  showToast('Marked as completed!');
                                  setShowReminderModal(false);
                                  setRemindersLoading(true);
                                  try {
                                    const { name, birthday, anniversary } = partnerProfile;
                                    const partnerData = { name, birthday, anniversary };
                                    const remindersSummary = await reminderService.getUpcomingRemindersSummary(partnerData);
                                    setReminders(remindersSummary);
                                    await recalculateWeekProgress();
                                  } catch (refreshError) {
                                    console.error('Error refreshing data after completion:', refreshError);
                                  } finally {
                                    setRemindersLoading(false);
                                  }
                                }
                              } catch (err: any) {
                                showToast(err.message || 'Failed to complete reminder');
                              } finally {
                                setModalActionLoading(false);
                              }
                            }}
                          >
                            <Text style={{ color: theme.colors.success[600], fontWeight: '600' }}>Mark as Completed</Text>
                          </TouchableOpacity>
                        )}
                        {/* Delete Action */}
                        <TouchableOpacity
                          style={{ padding: 12, borderRadius: 8, backgroundColor: theme.colors.error[50], opacity: modalActionLoading ? 0.5 : 1 }}
                          disabled={modalActionLoading}
                          onPress={() => {
                            Alert.alert(
                              'Delete Reminder',
                              'Are you sure you want to delete this reminder?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: async () => {
                                    setModalActionLoading(true);
                                    try {
                                      const { error } = await reminderService.deleteReminder(selectedReminder.id);
                                      if (error) {
                                        showToast(error);
                                      } else {
                                        showToast('Reminder deleted');
                                        setShowReminderModal(false);
                                        setRemindersLoading(true);
                                        const { name, birthday, anniversary } = partnerProfile;
                                        const partnerData = { name, birthday, anniversary };
                                        const remindersSummary = await reminderService.getUpcomingRemindersSummary(partnerData);
                                        setReminders(remindersSummary);
                                        await recalculateWeekProgress();
                                        setRemindersLoading(false);
                                      }
                                    } catch (err: any) {
                                      showToast(err.message || 'Failed to delete reminder');
                                    } finally {
                                      setModalActionLoading(false);
                                    }
                                  }
                                }
                              ]
                            );
                          }}
                        >
                          <Text style={{ color: theme.colors.error[600], fontWeight: '600' }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={{ marginTop: 24, alignSelf: 'center', opacity: modalActionLoading ? 0.5 : 1 }}
                        disabled={modalActionLoading}
                        onPress={() => setShowReminderModal(false)}
                      >
                        <Text style={{ color: theme.colors.neutral[500], fontWeight: '500' }}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}

          {/* Menu Backdrop */}
          {showProfileMenu && (
            <TouchableOpacity 
              style={styles.menuBackdrop}
              onPress={() => setShowProfileMenu(false)}
              activeOpacity={1}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      {/* DatePicker Modal */}
      {/* Removed as DatePicker is now inline */}
      <View style={{ position: 'absolute', bottom: 96, right: 24, zIndex: 100 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            Vibration.vibrate(10);
            handleAddReminder();
          }}
          accessibilityLabel="Add Reminder"
          accessibilityRole="button"
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: theme.colors.primary[400],
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.22,
            shadowRadius: 16,
            elevation: 16,
          }}
        >
          <MaterialIcons name="add" size={36} color="white" />
        </TouchableOpacity>
      </View>

      {/* View Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '90%', backgroundColor: 'white', borderRadius: 18, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.primary[700], marginBottom: 12 }}>View Calendar</Text>
              {/* Placeholder for calendar UI */}
              <View style={{ width: '100%', height: 320, backgroundColor: theme.colors.primary[50], borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: theme.colors.primary[400], fontSize: 16 }}>Calendar coming soon!</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCalendarModal(false)}
                style={{ marginTop: 8, paddingVertical: 10, paddingHorizontal: 32, backgroundColor: theme.colors.primary[600], borderRadius: 8 }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  helpButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  helpIcon: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.neutral[500],
  },
  onboardingCard: {
    marginBottom: theme.spacing[6],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[400],
  },
  onboardingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  onboardingEmoji: {
    fontSize: 24,
    marginRight: theme.spacing[3],
  },
  onboardingText: {
    flex: 1,
  },
  onboardingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing[1],
  },
  onboardingDescription: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    lineHeight: 20,
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
  completeIconButton: {
    marginTop: 8,
    marginLeft: 8,
    backgroundColor: theme.colors.success[50] || '#ECFDF5',
    borderRadius: 20,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
},
  primaryButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    ...theme.elevation.lg,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    opacity: 1, // Always full opacity when enabled
  },
  primaryButtonDisabled: {
    opacity: 0.5, // Only dim when actually disabled
  },
  primaryButtonActive: {
    backgroundColor: '#4F46E5', // Slightly darker for pressed state
  },
});

export default DashboardScreen; 