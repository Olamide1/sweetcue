import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../design-system/tokens';

interface DatePickerProps {
  label: string;
  value?: string; // Date string in YYYY-MM-DD format
  placeholder?: string;
  onDateChange: (date: string) => void;
  style?: any;
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  placeholder = "Select date",
  onDateChange,
  style
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );

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

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dateButton} onPress={openPicker}>
        <Text style={[styles.dateText, !selectedDate && styles.placeholderText]}>
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()} // Can't select future dates
          minimumDate={new Date(1900, 0, 1)} // Reasonable minimum date
        />
      )}

      {Platform.OS === 'ios' && showPicker && (
        <View style={styles.iosPickerContainer}>
          <View style={styles.iosPickerHeader}>
            <TouchableOpacity onPress={closePicker}>
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
});

export default DatePicker; 