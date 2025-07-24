import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Animated, TextInput, Modal, Keyboard, TouchableWithoutFeedback, SafeAreaView as RNSafeAreaView, Alert, ToastAndroid, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, ScrollIndicator } from '../../design-system/components';
import EmptyState from '../../design-system/components/EmptyState';
import { theme } from '../../design-system/tokens';
import { partnerService } from '../../services/partners';
import { reminderService } from '../../services/reminders';
import { gestureService } from '../../services/gestures';
import DatePicker from '../../components/DatePicker';
import { MaterialIcons } from '@expo/vector-icons';

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
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [gestureTemplates, setGestureTemplates] = useState<any[]>([]);
  const [gestureLoading, setGestureLoading] = useState(false);
  const [gestureError, setGestureError] = useState<string | null>(null);
  const [gestureSearch, setGestureSearch] = useState('');
  const [selectedGesture, setSelectedGesture] = useState<any>(null);
  const [reminderForm, setReminderForm] = useState({ title: '', description: '', scheduled_date: '' });
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [showQuickGiftsModal, setShowQuickGiftsModal] = useState(false);
  const [messageForm, setMessageForm] = useState({ message: '', scheduled_date: '' });
  const [messageSaving, setMessageSaving] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const loveLanguage = partnerProfile?.love_language || '';
  const [accountDeleted, setAccountDeleted] = useState(false);

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
          setAccountDeleted(true);
          alert('No account found with that information. Please sign up.');
          if (typeof onNavigate === 'function') onNavigate('welcome');
          return;
        }
        console.error('[DashboardScreen] Error in fetchData:', err);
        setRemindersError(err.message || 'Failed to load reminders.');
      } finally {
        if (isMounted) setRemindersLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  if (accountDeleted) return null;

  // Split reminders into next 3 days and future reminders
  const next3DaysReminders = reminders.filter(r => r.daysUntil <= 3);
  const futureReminders = reminders.filter(r => r.daysUntil > 3);
  const partnerName = partnerProfile?.name || initialPartnerName;

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
    const baseActions = [
      { id: 1, title: 'Add Reminder', emoji: '➕', color: '#6366F1', priority: 1 },
    ];

    // Add contextual actions based on next 3 days reminders
    if (next3DaysReminders.some((r: any) => r.type === 'reminder')) {
      baseActions.splice(1, 0, { id: 5, title: 'Send Message', emoji: '💌', color: '#10B981', priority: 2 });
    }
    
    if (next3DaysReminders.length > 0) {
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

  // Open Add Reminder modal and fetch gestures
  const handleAddReminder = () => {
    setShowAddReminderModal(true);
    setGestureLoading(true);
    setGestureError(null);
    console.log('[DashboardScreen] Opening Add Reminder modal...');
    
    gestureService.getTemplates().then(({ data, error }) => {
      if (error) {
        console.error('[DashboardScreen] Error loading gesture templates:', error);
        setGestureError(error);
      } else {
        console.log('[DashboardScreen] Loaded gesture templates:', data?.length || 0);
        setGestureTemplates(data || []);
      }
      setGestureLoading(false);
    });
    
    setGestureSearch('');
    setSelectedGesture(null);
    setReminderForm({ title: '', description: '', scheduled_date: '' });
    setReminderError(null);
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
  const availableGestures = gestureTemplates.length > 0 ? gestureTemplates : fallbackGestures;

  // Filter gestures for love language recommendations
  const recommendedGestures = availableGestures.filter(g =>
    loveLanguage && g.category && g.category.toLowerCase().includes(loveLanguage.toLowerCase().replace(/ /g, '_'))
  );
  const otherGestures = availableGestures.filter(g => !recommendedGestures.includes(g));
  const searchedGestures = gestureSearch
    ? availableGestures.filter(g =>
        g.title.toLowerCase().includes(gestureSearch.toLowerCase()) ||
        g.description?.toLowerCase().includes(gestureSearch.toLowerCase())
      )
    : availableGestures;

  // Handle gesture selection
  const handleSelectGesture = (gesture: any) => {
    console.log('[DashboardScreen] Selected gesture:', gesture);
    setSelectedGesture(gesture);
    setReminderForm({
      title: gesture.title,
      description: gesture.description || '',
      scheduled_date: '',
    });
  };

  // Handle quick action selection
  const handleQuickAction = (actionId: number) => {
    console.log('[DashboardScreen] Quick action selected:', actionId);
    
    switch (actionId) {
      case 1: // Add Reminder
        handleAddReminder();
        break;
      case 2: // View Calendar
        console.log('[DashboardScreen] View Calendar action - TODO: implement calendar view');
        // TODO: Implement calendar view
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
        console.log('[DashboardScreen] Unknown action ID:', actionId);
    }
  };

  // Handle quick gift selection
  const handleQuickGift = async (giftName: string, giftType: string) => {
    console.log('[DashboardScreen] Creating quick gift:', giftName, giftType);
    
    if (!partnerProfile || !partnerProfile.id) {
      console.error('[DashboardScreen] No partner profile found for quick gift');
      return;
    }

    try {
      let gestureId = null;
      
      // Try to create a gesture first (if RLS policies are fixed)
      try {
        const gestureInput = {
          partner_id: partnerProfile.id,
          title: giftType === 'food' ? `Order ${giftName}` : `Buy ${giftName}`,
          description: `Surprise ${partnerName} with ${giftName.toLowerCase()}`,
          effort_level: 'low',
          cost_level: giftType === 'food' ? 'low' : 'medium',
          category: 'receiving_gifts',
          is_template: false,
        };

        console.log('[DashboardScreen] Creating gesture for gift:', gestureInput);
        
        const { data: createdGesture, error: gestureError } = await gestureService.createGesture(gestureInput);
        
        if (gestureError) {
          console.error('[DashboardScreen] Error creating gesture for gift:', gestureError);
          // Continue without gesture - this is expected if RLS policies aren't fixed yet
        } else {
          gestureId = createdGesture?.id;
          console.log('[DashboardScreen] Gesture created successfully:', createdGesture?.title);
        }
      } catch (gestureErr: any) {
        console.error('[DashboardScreen] Gesture creation failed (RLS issue?):', gestureErr);
        // Continue without gesture
      }

      // Create the reminder for tomorrow to ensure it shows up in upcoming reminders
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
  const handleSaveReminder = async () => {
    setReminderSaving(true);
    setReminderError(null);
    console.log('[DashboardScreen] Saving reminder...', { selectedGesture, reminderForm });
    
    try {
      if (!partnerProfile || !partnerProfile.id) {
        const error = 'Partner profile not loaded. Please refresh or complete your profile.';
        setReminderError(error);
        console.error('[DashboardScreen] No partner profile found');
        setReminderSaving(false);
        return;
      }
      
      if (!reminderForm.title || !reminderForm.scheduled_date) {
        const error = 'Title and date are required.';
        setReminderError(error);
        console.error('[DashboardScreen] Missing required fields:', { title: reminderForm.title, date: reminderForm.scheduled_date });
        setReminderSaving(false);
        return;
      }

      let gestureId = null;
      let customGestureCreated = false;

      // Handle custom gesture creation
      if (!selectedGesture || selectedGesture.id?.startsWith('fallback-')) {
        // This is a custom gesture - create it in the database first
        if (reminderForm.title && reminderForm.description) {
          console.log('[DashboardScreen] Creating custom gesture...');
          
          // Determine category based on partner's love language
          const category = partnerProfile.love_language 
            ? partnerProfile.love_language.toLowerCase().replace(/ /g, '_')
            : 'romance';
          
          const customGestureData = {
            partner_id: partnerProfile.id,
            title: reminderForm.title,
            description: reminderForm.description,
            effort_level: 'medium', // Default for custom gestures
            cost_level: 'low', // Default for custom gestures
            category: category,
            is_template: false, // This is a user-created gesture, not a template
          };

          const { data: gestureData, error: gestureError } = await gestureService.createGesture(customGestureData);
          
          if (gestureError) {
            console.error('[DashboardScreen] Error creating custom gesture:', gestureError);
            // Continue without gesture_id - just save the reminder
          } else {
            gestureId = gestureData?.id;
            customGestureCreated = true;
            console.log('[DashboardScreen] Custom gesture created successfully:', gestureData?.title);
          }
        }
      } else {
        // This is a template gesture
        gestureId = selectedGesture.id;
      }

      // Prepare reminder data
      const reminderData = {
        partner_id: partnerProfile.id,
        gesture_id: gestureId,
        title: reminderForm.title,
        description: reminderForm.description || '',
        scheduled_date: reminderForm.scheduled_date,
      };

      console.log('[DashboardScreen] Creating reminder with data:', reminderData);
      
      const { data, error } = await reminderService.createReminder(reminderData);
      
      if (error) {
        console.error('[DashboardScreen] Error creating reminder:', error);
        setReminderError(error);
        setReminderSaving(false);
        return;
      }

      console.log('[DashboardScreen] Reminder created successfully:', data?.title);
      
      // Close modal and refresh reminders
      setShowAddReminderModal(false);
      setReminderSaving(false);
      
      // Refetch reminders
      setRemindersLoading(true);
      setRemindersError(null);
      try {
        const { name, birthday, anniversary } = partnerProfile;
        const partnerData = { name, birthday, anniversary };
        const remindersSummary = await reminderService.getUpcomingRemindersSummary(partnerData);
        setReminders(remindersSummary);
        console.log('[DashboardScreen] Refreshed reminders:', remindersSummary.length);
      } catch (refreshError: any) {
        console.error('[DashboardScreen] Error refreshing reminders:', refreshError);
        setRemindersError('Reminder saved but failed to refresh list');
      } finally {
        setRemindersLoading(false);
      }
      
    } catch (err: any) {
      console.error('[DashboardScreen] Unexpected error saving reminder:', err);
      setReminderError(err.message || 'Failed to save reminder.');
      setReminderSaving(false);
    }
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
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={responsiveStyles.sectionTitle}>Next 3 Days</Text>
                <TouchableOpacity 
                  style={styles.helpButton} 
                  onPress={() => Alert.alert('Next 3 Days', 'Shows your most urgent reminders and upcoming birthdays/anniversaries within the next 3 days. These are your immediate priorities to focus on.')}
                >
                  <Text style={styles.helpIcon}>?</Text>
                </TouchableOpacity>
              </View>
              {remindersLoading && <Text style={styles.urgentBadgeText}>Loading...</Text>}
              {!remindersLoading && next3DaysReminders.length > 0 && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>{next3DaysReminders.length}</Text>
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
                  // Refetch reminders
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
              <EmptyState
                emoji="📝"
                title="No immediate priorities!"
                description="You're all caught up for the next 3 days. Add a new reminder or check upcoming reminders below."
                actionText="Add Reminder"
                onActionPress={() => handleAddReminder()}
                variant="encouraging"
              />
            ) : (
              <View style={styles.remindersContainer}>
                {next3DaysReminders.map((reminder: any, idx: number) => (
                  <Animated.View key={reminder.id} style={{ opacity: reminder._animating ? 0.5 : 1 }}>
                    <Card style={{ ...styles.reminderCard, ...styles.urgentReminderCard }}>
                      <View style={styles.reminderContent}>
                        <View style={styles.reminderLeft}>
                          <Text style={styles.reminderEmoji}>{reminder.emoji}</Text>
                          <View style={styles.reminderInfo}>
                            <Text style={styles.reminderTitle}>{reminder.title}</Text>
                            <Text style={{ ...styles.reminderDate, ...styles.urgentReminderDate }}>
                              {reminder.daysUntil === 0 ? 'Due Today' : new Date(reminder.scheduled_date).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.reminderRight}>
                          <View style={{ ...styles.daysUntil, ...styles.urgentDaysUntil }}>
                            <Text style={styles.urgentDaysUntilText}>
                              {reminder.daysUntil === 0 ? 'Now' : `${reminder.daysUntil}d`}
                            </Text>
                          </View>
                          {/* Modern Icon Button */}
                          {reminder.type === 'reminder' && (
                            <TouchableOpacity
                              style={styles.completeIconButton}
                              activeOpacity={0.7}
                              onPress={async () => {
                                // Animate out (optional: fade/slide)
                                next3DaysReminders[idx]._animating = true;
                                setReminders([...reminders]);
                                try {
                                  const { error } = await reminderService.completeReminder(reminder.id);
                                  if (error) {
                                    showToast(error);
                                  } else {
                                    showToast('Marked as completed!');
                                    // Remove from list after short delay
                                    setTimeout(async () => {
                                      setRemindersLoading(true);
                                      const { name, birthday, anniversary } = partnerProfile;
                                      const partnerData = { name, birthday, anniversary };
                                      const remindersSummary = await reminderService.getUpcomingRemindersSummary(partnerData);
                                      setReminders(remindersSummary);
                                      setRemindersLoading(false);
                                    }, 400);
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
                      </View>
                    </Card>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>

          {/* All Upcoming Reminders - Moved up for better visibility */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={responsiveStyles.sectionTitle}>Upcoming Reminders</Text>
                <TouchableOpacity 
                  style={styles.helpButton} 
                  onPress={() => Alert.alert('Upcoming Reminders', 'Shows reminders, birthdays, and anniversaries coming up in the next 30 days. This helps you plan ahead for important moments.')}
                >
                  <Text style={styles.helpIcon}>?</Text>
                </TouchableOpacity>
              </View>
              {!remindersLoading && futureReminders.length > 3 && (
                <TouchableOpacity style={styles.viewAllButton} onPress={() => onNavigate?.('reminderSetup')}>
                  <Text style={styles.viewAllText}>View All</Text>
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
                  // Refetch reminders
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
              <EmptyState
                emoji="🎉"
                title="No upcoming reminders!"
                description="Add reminders for birthdays, anniversaries, or thoughtful gestures. Shows events within the next 30 days."
                actionText="Add Reminder"
                onActionPress={() => handleAddReminder()}
                variant="encouraging"
              />
            ) : (
              <View style={styles.remindersContainer}>
                {futureReminders.map((reminder: any, idx: number) => (
                  <Animated.View key={reminder.id} style={{ opacity: reminder._animating ? 0.5 : 1 }}>
                    <Card style={styles.reminderCard}>
                      <View style={styles.reminderContent}>
                        <View style={styles.reminderLeft}>
                          <Text style={styles.reminderEmoji}>{reminder.emoji}</Text>
                          <View style={styles.reminderInfo}>
                            <Text style={styles.reminderTitle}>{reminder.title}</Text>
                            <Text style={styles.reminderDate}>{new Date(reminder.scheduled_date).toLocaleDateString()}</Text>
                          </View>
                        </View>
                        <View style={styles.reminderRight}>
                          <Text style={styles.daysUntil}>{reminder.daysUntil}d</Text>
                          {/* Modern Icon Button */}
                          {reminder.type === 'reminder' && (
                            <TouchableOpacity
                              style={styles.completeIconButton}
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
                                      setRemindersLoading(false);
                                    }, 400);
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
                      </View>
                    </Card>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>

          {/* Quick Actions - Contextual (moved after reminders for better UX) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={responsiveStyles.sectionTitle}>
                  {next3DaysReminders.length > 0 
                    ? 'Quick Actions' 
                    : 'What would you like to do?'
                  }
                </Text>
                <TouchableOpacity 
                  style={styles.helpButton} 
                  onPress={() => Alert.alert('Quick Actions', 'Contextual actions based on your reminders. Add reminders, send messages, or get quick gift ideas to stay connected with your partner.')}
                >
                  <Text style={styles.helpIcon}>?</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.actionsGrid, { gap: responsive.gap }]}>
              {contextualActions.map((action) => (
                <TouchableOpacity 
                  key={action.id} 
                  onPress={() => handleQuickAction(action.id)}
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
                  onPress={() => onNavigate?.('subscription')}
                >
                  <Text style={styles.manageButtonText}>Manage</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Add Reminder Modal */}
          {showAddReminderModal && (
            <Modal visible onRequestClose={() => setShowAddReminderModal(false)} animationType="slide" transparent>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                  <RNSafeAreaView style={{ width: '100%', alignItems: 'center', flex: 1 }}>
                    <Card style={{ width: '95%', maxWidth: 420, maxHeight: '90%', padding: 0, marginTop: 16, marginBottom: 16 }}>
                      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingTop: theme.spacing[6] }} showsVerticalScrollIndicator={false}>
                        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: theme.spacing[2] }}>Add Reminder</Text>
                        <Text style={{ color: theme.colors.neutral[600], marginBottom: theme.spacing[3], fontSize: 15 }}>
                          Choose a gesture idea or type your own. You can customize any suggestion or create something completely new.
                        </Text>
                        <View style={{ backgroundColor: theme.colors.primary[50], padding: theme.spacing[3], borderRadius: theme.radius.md, marginBottom: theme.spacing[3] }}>
                          <Text style={{ fontSize: 13, color: theme.colors.primary[700], fontWeight: '500' }}>💡 Tip:</Text>
                          <Text style={{ fontSize: 13, color: theme.colors.primary[600], marginTop: 2 }}>
                            Reminders help you remember important moments. They'll appear in "Next 3 Days" when urgent, or "Upcoming Reminders" for future planning.
                          </Text>
                        </View>
                        {/* Gesture Recommendations */}
                        {gestureLoading ? (
                          <EmptyState title="Loading gesture ideas..." description="Fetching gesture templates for inspiration." />
                        ) : gestureError ? (
                          <EmptyState title="Couldn't load gestures" description={gestureError} actionText="Retry" onActionPress={handleAddReminder} variant="error" />
                        ) : gestureTemplates.length === 0 ? (
                          <EmptyState title="No gesture templates found" description="Try adding your own custom gesture." />
                        ) : (
                          <>
                            {loveLanguage && recommendedGestures.length > 0 && (
                              <View style={{ marginBottom: theme.spacing[3] }}>
                                <Text style={{ fontWeight: '600', marginBottom: theme.spacing[2] }}>Recommended for {loveLanguage}:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing[2] }}>
                                  {recommendedGestures.map((g) => (
                                    <Card key={g.id} style={{ marginRight: theme.spacing[3], minWidth: 160, maxWidth: 200, borderColor: selectedGesture?.id === g.id ? theme.colors.primary[500] : theme.colors.neutral[200], borderWidth: selectedGesture?.id === g.id ? 2 : 1, backgroundColor: selectedGesture?.id === g.id ? theme.colors.primary[50] : 'white' }}>
                                      <TouchableOpacity onPress={() => handleSelectGesture(g)} style={{ padding: theme.spacing[3], alignItems: 'flex-start' }}>
                                        <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: theme.spacing[1] }}>{g.title}</Text>
                                        <Text style={{ color: theme.colors.neutral[700], fontSize: 13 }}>{g.description}</Text>
                                        {selectedGesture?.id === g.id && <Text style={{ position: 'absolute', top: 8, right: 8, fontSize: 18, color: theme.colors.primary[500] }}>✔️</Text>}
                                      </TouchableOpacity>
                                    </Card>
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                            {/* Search Bar */}
                            <Card style={{ padding: theme.spacing[2], flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[3], backgroundColor: theme.colors.neutral[50] }}>
                              <Text style={{ fontSize: 16, color: theme.colors.neutral[700], marginRight: theme.spacing[2] }}>🔍</Text>
                              <TextInput
                                style={{ flex: 1, fontSize: 16, color: theme.colors.neutral[900] }}
                                placeholder="Search gestures or ideas..."
                                value={gestureSearch}
                                onChangeText={setGestureSearch}
                                placeholderTextColor={theme.colors.neutral[400]}
                                accessibilityLabel="Search gestures or ideas"
                              />
                              {gestureSearch.length > 0 && (
                                <TouchableOpacity onPress={() => setGestureSearch('')}>
                                  <Text style={{ fontSize: 18, color: theme.colors.neutral[400] }}>✕</Text>
                                </TouchableOpacity>
                              )}
                            </Card>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing[3] }}>
                              {searchedGestures.filter(g => !recommendedGestures.some(rg => rg.id === g.id)).map((g) => (
                                <Card key={g.id} style={{ marginRight: theme.spacing[3], minWidth: 160, maxWidth: 200, borderColor: selectedGesture?.id === g.id ? theme.colors.primary[500] : theme.colors.neutral[200], borderWidth: selectedGesture?.id === g.id ? 2 : 1, backgroundColor: selectedGesture?.id === g.id ? theme.colors.primary[50] : 'white' }}>
                                  <TouchableOpacity onPress={() => handleSelectGesture(g)} style={{ padding: theme.spacing[3], alignItems: 'flex-start' }}>
                                    <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: theme.spacing[1] }}>{g.title}</Text>
                                    <Text style={{ color: theme.colors.neutral[700], fontSize: 13 }}>{g.description}</Text>
                                    {selectedGesture?.id === g.id && <Text style={{ position: 'absolute', top: 8, right: 8, fontSize: 18, color: theme.colors.primary[500] }}>✔️</Text>}
                                  </TouchableOpacity>
                                </Card>
                              ))}
                            </ScrollView>
                          </>
                        )}
                        {/* Reminder Form */}
                        <View style={{ marginBottom: theme.spacing[3] }}>
                          <Text style={{ fontWeight: '600', marginBottom: theme.spacing[1] }}>Title</Text>
                          <TextInput
                            style={{ backgroundColor: theme.colors.neutral[50], borderRadius: 8, padding: 10, fontSize: 16, marginBottom: theme.spacing[2] }}
                            placeholder={selectedGesture ? "Customize the title..." : "What do you want to remember?"}
                            value={reminderForm.title}
                            onChangeText={text => {
                              setReminderForm(f => ({ ...f, title: text }));
                              // If user starts typing a custom title, clear the selected gesture
                              if (selectedGesture && text !== selectedGesture.title) {
                                setSelectedGesture(null);
                              }
                            }}
                            placeholderTextColor={theme.colors.neutral[400]}
                            accessibilityLabel="Reminder Title"
                          />
                          <Text style={{ fontWeight: '600', marginBottom: theme.spacing[1] }}>Description</Text>
                          <TextInput
                            style={{ backgroundColor: theme.colors.neutral[50], borderRadius: 8, padding: 10, fontSize: 15, marginBottom: theme.spacing[2], minHeight: 40 }}
                            placeholder={selectedGesture ? "Add more details..." : "Optional details..."}
                            value={reminderForm.description}
                            onChangeText={text => {
                              setReminderForm(f => ({ ...f, description: text }));
                              // If user starts typing a custom description, clear the selected gesture
                              if (selectedGesture && text !== selectedGesture.description) {
                                setSelectedGesture(null);
                              }
                            }}
                            placeholderTextColor={theme.colors.neutral[400]}
                            multiline
                            accessibilityLabel="Reminder Description"
                          />
                          <Text style={{ fontWeight: '600', marginBottom: theme.spacing[1] }}>Date</Text>
                          <DatePicker label="Date" value={reminderForm.scheduled_date} onDateChange={date => setReminderForm(f => ({ ...f, scheduled_date: date }))} />
                        </View>
                        {reminderError && <Text style={{ color: theme.colors.error[600], marginBottom: theme.spacing[2] }}>{reminderError}</Text>}
                        <Button title={reminderSaving ? 'Saving...' : 'Save Reminder'} onPress={handleSaveReminder} disabled={reminderSaving} />
                        <Button title="Cancel" onPress={() => setShowAddReminderModal(false)} variant="ghost" />
                      </ScrollView>
                    </Card>
                  </RNSafeAreaView>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
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
                        <Button title={messageSaving ? 'Sending...' : 'Send Message'} onPress={handleSendMessage} disabled={messageSaving} />
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
                  onNavigate?.('recentActivity');
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
        </ScrollView>
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
});

export default DashboardScreen; 