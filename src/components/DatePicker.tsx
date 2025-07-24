import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../design-system/tokens';

interface DatePickerProps {
  label: string;
  value?: string; // Date string in YYYY-MM-DD format
  placeholder?: string;
  onDateChange: (date: string) => void;
  style?: any;
  pastOnly?: boolean; // If true, restrict to past dates only
  minDate?: Date;
  maxDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  placeholder = "Select date",
  onDateChange,
  style,
  pastOnly = false,
  minDate,
  maxDate
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // In useEffect and initial state, always use a valid date for selectedDate
  const getValidDate = (val?: string) => {
    if (val && !isNaN(new Date(val).getTime())) {
      return new Date(val);
    }
    return new Date();
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getValidDate(value));
  const [tempDate, setTempDate] = useState<Date>(getValidDate(value));

  // Sync selectedDate with value prop
  useEffect(() => {
    setSelectedDate(getValidDate(value));
    setTempDate(getValidDate(value));
  }, [value]);

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatBackendDate = (date: Date): string => {
    // Format as YYYY-MM-DD for Supabase
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && date) {
        // Only update on confirm
        setSelectedDate(date);
        onDateChange(formatBackendDate(date));
      }
      closePicker();
    } else if (date) {
      setTempDate(date);
    }
  };

  const openPicker = () => {
    setTempDate(selectedDate);
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
    setError(null);
  };

  const handleCancel = () => {
    closePicker();
  };

  const handleDone = () => {
    // Edge case: If pastOnly, block future dates
    if (pastOnly && tempDate > new Date()) {
      setError('Please select a past date.');
      return;
    }
    setError(null);
    setSelectedDate(tempDate);
    onDateChange(formatBackendDate(tempDate));
    closePicker();
  };

  // Determine min/max date
  const min = minDate || new Date(1900, 0, 1);
  const max = maxDate || (pastOnly ? new Date() : undefined);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dateButton} onPress={openPicker} accessibilityLabel={label}>
        <Text style={[styles.dateText, !selectedDate && styles.placeholderText]}>
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {/* iOS Custom Modal */}
      {Platform.OS === 'ios' && showPicker && (
        <Modal visible transparent animationType="slide" onRequestClose={closePicker}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel} style={styles.modalHeaderButton} accessibilityLabel="Cancel">
                  <Text style={styles.modalHeaderButtonText}>✕</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={handleDone} style={styles.modalHeaderButton} accessibilityLabel="Done">
                  <Text style={styles.modalHeaderButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={min}
                maximumDate={max}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </Modal>
      )}
      {/* Android Custom Modal */}
      {Platform.OS === 'android' && showPicker && (
        <Modal visible transparent animationType="fade" onRequestClose={closePicker}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentAndroid}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel} style={styles.modalHeaderButton} accessibilityLabel="Cancel">
                  <Text style={styles.modalHeaderButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={min}
                maximumDate={max}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing[3],
  },
  dateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.elevation.sm,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.neutral[900],
  },
  placeholderText: {
    color: theme.colors.neutral[400],
  },
  icon: {
    fontSize: 20,
  },
  errorText: {
    color: theme.colors.error[600],
    fontSize: 13,
    marginTop: 4,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    paddingTop: 0,
    minHeight: 320,
  },
  modalContentAndroid: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 24,
    paddingBottom: 24,
    paddingTop: 0,
    minHeight: 320,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  modalHeaderButton: {
    padding: 8,
  },
  modalHeaderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary[600],
  },
});

export default DatePicker; 