import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView, Platform, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../design-system/tokens';
import { Card } from '../../design-system/components';
import { reminderService } from '../../services/reminders';
import { gestureService } from '../../services/gestures';
import { partnerService } from '../../services/partners';

interface AddReminderScreenProps {
  onNavigate: (screen: 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn' | 'dashboard' | 'addReminder' | 'subscription' | 'editPartner' | 'settings' | 'privacySecurity' | 'notifications' | 'helpSupport' | 'recentActivity') => void;
  onReminderAdded?: () => void;
}

const AddReminderScreen: React.FC<AddReminderScreenProps> = ({ onNavigate, onReminderAdded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gestureTemplates, setGestureTemplates] = useState<any[]>([]);
  const [selectedGesture, setSelectedGesture] = useState<any>(null);
  const [gestureSearch, setGestureSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [gestureLoading, setGestureLoading] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [loveLanguages, setLoveLanguages] = useState<string[]>([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(scheduledDate);

  const scrollViewRef = useRef<ScrollView>(null);
  const [showMoreBelow, setShowMoreBelow] = useState(false);
  const [visibleHeight, setVisibleHeight] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setGestureLoading(true);
    try {
      // Load partner profile for love language
      const { data: partner, error: partnerError } = await partnerService.getPartner();
      if (partner) {
        setPartnerProfile(partner);
        setLoveLanguages(partner.love_languages || []);
      }

      // Load gesture templates
      const { data, error } = await gestureService.getTemplates();
      if (error) {
        console.error('Error loading gesture templates:', error);
      } else {
        setGestureTemplates(data || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setGestureLoading(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  };

  const handleSelectGesture = (gesture: any) => {
    console.log('[AddReminderScreen] Selected gesture:', gesture);
    setSelectedGesture(gesture);
    setTitle(gesture.title);
    setDescription(gesture.description || '');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your reminder');
      return;
    }

    setLoading(true);
    try {
      // Get partner ID first
      const { data: partner, error: partnerError } = await partnerService.getPartner();
      if (partnerError || !partner) {
        Alert.alert('Error', 'Partner profile not found. Please complete your partner profile first.');
        setLoading(false);
        return;
      }

      let gestureId = null;
      let customGestureCreated = false;

      // Handle custom gesture creation
      if (!selectedGesture || selectedGesture.id?.startsWith('fallback-')) {
        // This is a custom gesture - create it in the database first
        if (title && description) {
          console.log('[AddReminderScreen] Creating custom gesture...');
          
          // Determine category based on partner's love language
          const category = loveLanguages.length > 0 
            ? loveLanguages[0].toLowerCase().replace(/ /g, '_') // Assuming the first love language is the primary
            : 'romance';
          
          const customGestureData = {
            partner_id: partner.id,
            title: title.trim(),
            description: description.trim(),
            effort_level: 'medium', // Default for custom gestures
            cost_level: 'low', // Default for custom gestures
            category: category,
            is_template: false, // This is a user-created gesture, not a template
          };

          const { data: gestureData, error: gestureError } = await gestureService.createGesture(customGestureData);
          
          if (gestureError) {
            console.error('[AddReminderScreen] Error creating custom gesture:', gestureError);
            // Continue without gesture_id - just save the reminder
          } else {
            gestureId = gestureData?.id;
            customGestureCreated = true;
            console.log('[AddReminderScreen] Custom gesture created successfully:', gestureData?.title);
          }
        }
      } else {
        // This is a template gesture
        gestureId = selectedGesture.id;
      }

      const reminderData = {
        partner_id: partner.id,
        gesture_id: gestureId,
        title: title.trim(),
        description: description.trim(),
        scheduled_date: scheduledDate.toISOString().split('T')[0], // YYYY-MM-DD format
      };

      const { error } = await reminderService.createReminder(reminderData);
      
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Reminder created successfully!', [
          { text: 'OK', onPress: () => {
            onReminderAdded?.();
            onNavigate('dashboard');
          }}
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create reminder');
    }
    setLoading(false);
  };

  const handleLayout = (event: any) => {
    setVisibleHeight(event.nativeEvent.layout.height);
  };

  const handleContentSizeChange = (contentWidth: number, contentHeight: number) => {
    setShowMoreBelow(contentHeight > visibleHeight + 10);
  };

  // Use database templates or fallback templates
  const availableGestures = gestureTemplates.length > 0 ? gestureTemplates : [
    { id: 'fallback-1', title: 'Cook their favorite meal', description: 'Surprise them with a homemade dinner', category: 'acts_of_service' },
    { id: 'fallback-2', title: 'Write a love note', description: 'Leave a sweet message for them to find', category: 'words_of_affirmation' },
    { id: 'fallback-3', title: 'Plan a date night', description: 'Organize a special evening together', category: 'quality_time' },
    { id: 'fallback-4', title: 'Give them a massage', description: 'Help them relax with a gentle massage', category: 'physical_touch' },
    { id: 'fallback-5', title: 'Buy them a small gift', description: 'Pick up something they\'ve been wanting', category: 'receiving_gifts' },
  ];

  // Filter gestures for love language recommendations
  const recommendedGestures = availableGestures.filter(g => {
    if (loveLanguages.length === 0) return false;
    const category = g.category?.toLowerCase() || '';
    const loveLang = loveLanguages[0].toLowerCase(); // Assuming the first love language is the primary
    
    return (
      (loveLang.includes('words') && category.includes('words')) ||
      (loveLang.includes('time') && category.includes('time')) ||
      (loveLang.includes('touch') && category.includes('touch')) ||
      (loveLang.includes('service') && category.includes('service')) ||
      (loveLang.includes('gifts') && category.includes('gifts'))
    );
  });

  const otherGestures = availableGestures.filter(g => !recommendedGestures.includes(g));
  const searchedGestures = gestureSearch
    ? availableGestures.filter(g =>
        g.title.toLowerCase().includes(gestureSearch.toLowerCase()) ||
        g.description?.toLowerCase().includes(gestureSearch.toLowerCase())
      )
    : availableGestures;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }} onLayout={handleLayout}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={styles.content}
          onContentSizeChange={handleContentSizeChange}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => onNavigate('dashboard')}
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary[600]} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Reminder</Text>
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <Card style={styles.formCard}>
            <Text style={{ fontSize: 15, color: theme.colors.neutral[600], marginBottom: theme.spacing[3] }}>
              Choose a gesture idea or type your own. You can customize any suggestion or create something completely new.
            </Text>

            {/* Gesture Recommendations */}
            {gestureLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading gesture ideas...</Text>
              </View>
            ) : (
              <>
                {loveLanguages.length > 0 && recommendedGestures.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recommended for {loveLanguages[0]}:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gestureScroll}>
                      {recommendedGestures.map((g) => (
                        <TouchableOpacity
                          key={g.id}
                          style={[
                            styles.gestureCard,
                            selectedGesture?.id === g.id && styles.gestureCardSelected
                          ]}
                          onPress={() => handleSelectGesture(g)}
                        >
                          <Text style={styles.gestureTitle}>{g.title}</Text>
                          <Text style={styles.gestureDescription}>{g.description}</Text>
                          {selectedGesture?.id === g.id && (
                            <MaterialIcons 
                              name="check-circle" 
                              size={20} 
                              color={theme.colors.primary[600]} 
                              style={styles.checkIcon}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <MaterialIcons name="search" size={20} color={theme.colors.neutral[600]} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search gestures or ideas..."
                    value={gestureSearch}
                    onChangeText={setGestureSearch}
                    placeholderTextColor={theme.colors.neutral[400]}
                  />
                  {gestureSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setGestureSearch('')}>
                      <MaterialIcons name="close" size={20} color={theme.colors.neutral[400]} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* All Gestures */}
                {!gestureSearch && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>All Gesture Ideas:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gestureScroll}>
                      {otherGestures.map((g) => (
                        <TouchableOpacity
                          key={g.id}
                          style={[
                            styles.gestureCard,
                            selectedGesture?.id === g.id && styles.gestureCardSelected
                          ]}
                          onPress={() => handleSelectGesture(g)}
                        >
                          <Text style={styles.gestureTitle}>{g.title}</Text>
                          <Text style={styles.gestureDescription}>{g.description}</Text>
                          {selectedGesture?.id === g.id && (
                            <MaterialIcons 
                              name="check-circle" 
                              size={20} 
                              color={theme.colors.primary[600]} 
                              style={styles.checkIcon}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Search Results */}
                {gestureSearch && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Search Results:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gestureScroll}>
                      {searchedGestures.map((g) => (
                        <TouchableOpacity
                          key={g.id}
                          style={[
                            styles.gestureCard,
                            selectedGesture?.id === g.id && styles.gestureCardSelected
                          ]}
                          onPress={() => handleSelectGesture(g)}
                        >
                          <Text style={styles.gestureTitle}>{g.title}</Text>
                          <Text style={styles.gestureDescription}>{g.description}</Text>
                          {selectedGesture?.id === g.id && (
                            <MaterialIcons 
                              name="check-circle" 
                              size={20} 
                              color={theme.colors.primary[600]} 
                              style={styles.checkIcon}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}

            {/* Reminder Form */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Reminder Details:</Text>
              
              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={text => {
                    setTitle(text);
                    // If user starts typing a custom title, clear the selected gesture
                    if (selectedGesture && text !== selectedGesture.title) {
                      setSelectedGesture(null);
                    }
                  }}
                  placeholder={selectedGesture ? "Customize the title..." : "What do you want to remember?"}
                  placeholderTextColor={theme.colors.neutral[400]}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={description}
                  onChangeText={text => {
                    setDescription(text);
                    // If user starts typing a custom description, clear the selected gesture
                    if (selectedGesture && text !== selectedGesture.description) {
                      setSelectedGesture(null);
                    }
                  }}
                  placeholder={selectedGesture ? "Add more details..." : "Optional details..."}
                  placeholderTextColor={theme.colors.neutral[400]}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date *</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setTempDate(scheduledDate);
                    setShowDateModal(true);
                  }}
                >
                  <Text style={styles.dateButtonText}>
                    {scheduledDate.toLocaleDateString()}
                  </Text>
                  <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary[600]} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Date Picker Modal Popover */}
          {showDateModal && (
            <Modal
              visible
              transparent
              animationType="fade"
              onRequestClose={() => setShowDateModal(false)}
            >
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'white', borderRadius: 16, width: '90%', maxWidth: 400, padding: 0, overflow: 'hidden' }}>
                  {/* Top Bar */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', padding: 12 }}>
                    <TouchableOpacity onPress={() => setShowDateModal(false)}>
                      <Text style={{ color: theme.colors.primary[600], fontWeight: '600', fontSize: 16 }}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={{ fontWeight: '700', fontSize: 16 }}>Select Date</Text>
                    <TouchableOpacity onPress={() => { setScheduledDate(tempDate); setShowDateModal(false); }}>
                      <Text style={{ color: theme.colors.primary[600], fontWeight: '600', fontSize: 16 }}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Date Picker */}
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => { if (date) setTempDate(date); }}
                    minimumDate={new Date()}
                    style={{ width: '100%' }}
                  />
                </View>
              </View>
            </Modal>
          )}
        </ScrollView>

        {/* More Below Indicator */}
        {showMoreBelow && (
          <View style={styles.moreBelowContainer}>
            <MaterialIcons name="keyboard-arrow-down" size={28} color={theme.colors.primary[400]} />
            <Text style={styles.moreBelowText}>More below</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8FA',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary[50],
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary[600],
    marginLeft: 4,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary[700],
  },
  saveButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.neutral[400],
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    padding: 24,
    ...theme.elevation.sm,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.neutral[600],
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: 12,
  },
  gestureScroll: {
    marginBottom: 8,
  },
  gestureCard: {
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 160,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    position: 'relative',
  },
  gestureCardSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  gestureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: 4,
  },
  gestureDescription: {
    fontSize: 12,
    color: theme.colors.neutral[600],
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.neutral[900],
    marginLeft: 8,
  },
  formSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.neutral[900],
    backgroundColor: theme.colors.neutral[50],
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: 8,
    padding: 12,
    backgroundColor: theme.colors.neutral[50],
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.colors.neutral[900],
  },
  moreBelowContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  moreBelowText: {
    color: theme.colors.primary[400],
    fontSize: 14,
    fontWeight: '500',
    marginTop: -4,
  },
});

export default AddReminderScreen; 