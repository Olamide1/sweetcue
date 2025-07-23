import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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

  // Sync selectedDate with value prop
  useEffect(() => {
    setSelectedDate(getValidDate(value));
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
      setShowPicker(false);
    }
    if (date) {
      // Edge case: If pastOnly, block future dates
      if (pastOnly && date > new Date()) {
        setError('Please select a past date.');
        return;
      }
      setError(null);
      setSelectedDate(date);
      const formattedDate = formatBackendDate(date);
      onDateChange(formattedDate);
    }
  };

  const openPicker = () => {
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
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
      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={min}
          maximumDate={max}
        />
      )}
      {Platform.OS === 'ios' && showPicker && (
        <View style={styles.iosPickerContainer}>
          <View style={styles.iosPickerHeader}>
            <TouchableOpacity onPress={closePicker} accessibilityLabel="Done">
              <Text style={styles.iosPickerButton}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  iosPickerContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  iosPickerButton: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary[600],
  },
  errorText: {
    color: theme.colors.error[600],
    fontSize: 13,
    marginTop: 4,
    marginBottom: 4,
  },
});

export default DatePicker; 