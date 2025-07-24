import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Platform, ToastAndroid, Alert, SafeAreaView } from 'react-native';
import { reminderService } from '../../services/reminders';
import { theme } from '../../design-system/tokens';
import { Card } from '../../design-system/components';
import { MaterialIcons } from '@expo/vector-icons';
import { format, isThisWeek, isSameWeek, subWeeks, parseISO } from 'date-fns';
import { Screen } from '../settings/SettingsScreen';

interface RecentActivityScreenProps {
  onNavigate?: (screen: Screen) => void;
}

const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
};

const groupByWeek = (reminders: any[]): { thisWeek: any[]; lastWeek: any[]; earlier: any[] } => {
  const thisWeek: any[] = [];
  const lastWeek: any[] = [];
  const earlier: any[] = [];
  reminders.forEach((r: any) => {
    const date = parseISO(r.scheduled_date);
    if (isThisWeek(date)) thisWeek.push(r);
    else if (isSameWeek(date, subWeeks(new Date(), 1))) lastWeek.push(r);
    else earlier.push(r);
  });
  return { thisWeek, lastWeek, earlier };
};

const RecentActivityScreen: React.FC<RecentActivityScreenProps> = ({ onNavigate }) => {
  const [completed, setCompleted] = useState<any[]>([]);
  const [missed, setMissed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ completed: 0, missed: 0 });

  const fetchReminders = async () => {
    setLoading(true);
    const { data } = await reminderService.getReminders();
    if (data) {
      const now = new Date();
      const completedReminders = data.filter((r: any) => r.is_completed);
      const missedReminders = data.filter((r: any) => !r.is_completed && new Date(r.scheduled_date) < now);
      setCompleted(completedReminders);
      setMissed(missedReminders);
      setSummary({ completed: completedReminders.filter((r: any) => isThisWeek(parseISO(r.scheduled_date))).length, missed: missedReminders.filter((r: any) => isThisWeek(parseISO(r.scheduled_date))).length });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReminders();
    // Optionally, add event listener for focus if using navigation
    const unsubscribe = () => {
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('focus', fetchReminders);
        return () => window.removeEventListener('focus', fetchReminders);
      }
      return () => {};
    };
    return unsubscribe();
  }, []);

  const handleMarkCompleted = async (reminder: any, idx: number) => {
    missed[idx]._animating = true;
    setMissed([...missed]);
    try {
      const { error } = await reminderService.completeReminder(reminder.id);
      if (error) {
        showToast(error);
      } else {
        showToast('Marked as completed!');
        setTimeout(fetchReminders, 400);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to complete reminder');
    }
  };

  const renderSection = (title: string, reminders: any[], icon: string, color: string, isMissed: boolean = false) => {
    if (!reminders.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {reminders.map((reminder: any, idx: number) => (
          <Animated.View key={reminder.id} style={{ opacity: reminder._animating ? 0.5 : 1 }}>
            <Card style={styles.activityCard}>
              <View style={styles.activityRow}>
                <MaterialIcons name={icon as any} size={24} color={color} style={{ marginRight: 12 }} />
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{reminder.title}</Text>
                  <Text style={styles.activityDate}>{format(parseISO(reminder.scheduled_date), 'MMM d, yyyy')}</Text>
                  {reminder.completion_note && <Text style={styles.activityNote}>{reminder.completion_note}</Text>}
                </View>
                {isMissed && (
                  <TouchableOpacity
                    style={styles.completeIconButton}
                    activeOpacity={0.7}
                    onPress={() => handleMarkCompleted(reminder, idx)}
                    accessibilityLabel="Mark as Completed"
                  >
                    <MaterialIcons name="check-circle" size={28} color={theme.colors.success[600] || '#22C55E'} />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          </Animated.View>
        ))}
      </View>
    );
  };

  const completedGroups = groupByWeek(completed);
  const missedGroups = groupByWeek(missed);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          {onNavigate && (
            <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('dashboard')}>
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary[600]} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.header}>Recent Activity</Text>
        </View>
        <Text style={styles.summary}>{`You completed ${summary.completed} gestures this week! ${summary.missed} reminders were missed.`}</Text>
        {renderSection('Missed This Week', missedGroups.thisWeek, 'error-outline', theme.colors.error[600], true)}
        {renderSection('Completed This Week', completedGroups.thisWeek, 'check-circle', theme.colors.success[600])}
        {renderSection('Missed Last Week', missedGroups.lastWeek, 'error-outline', theme.colors.error[500], true)}
        {renderSection('Completed Last Week', completedGroups.lastWeek, 'check-circle', theme.colors.success[500])}
        {renderSection('Earlier Missed', missedGroups.earlier, 'error-outline', theme.colors.error[50], true)}
        {renderSection('Earlier Completed', completedGroups.earlier, 'check-circle', theme.colors.success[50])}
      </ScrollView>
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
    backgroundColor: '#FFF8FA',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary[50],
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary[600],
    marginLeft: 4,
    fontWeight: '500',
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.primary[700],
    marginBottom: 8,
  },
  summary: {
    fontSize: 16,
    color: theme.colors.neutral[700],
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: 8,
  },
  activityCard: {
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: theme.radius.md,
    ...theme.elevation.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.neutral[900],
  },
  activityDate: {
    fontSize: 13,
    color: theme.colors.neutral[500],
    marginTop: 2,
  },
  activityNote: {
    fontSize: 13,
    color: theme.colors.primary[500],
    marginTop: 2,
  },
  completeIconButton: {
    marginLeft: 8,
    backgroundColor: theme.colors.success[50] || '#ECFDF5',
    borderRadius: 20,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RecentActivityScreen; 