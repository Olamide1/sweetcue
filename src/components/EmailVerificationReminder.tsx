import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Card } from '../design-system/components';
import { theme } from '../design-system/tokens';
import { authService } from '../services/auth';

interface EmailVerificationReminderProps {
  email: string;
  onDismiss?: () => void;
}

const EmailVerificationReminder: React.FC<EmailVerificationReminderProps> = ({ 
  email, 
  onDismiss 
}) => {
  const [loading, setLoading] = useState(false);

  const handleResendVerification = async () => {
    setLoading(true);
    
    try {
      const { error } = await authService.sendEmailVerification(email);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Verification Email Sent',
          'Check your email for a verification link. If you don\'t see it, check your spam folder.',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

  return (
    <Card style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📧</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            Please verify your email address to unlock all features and ensure account security.
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleResendVerification}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Sending...' : 'Resend Email'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleDismiss}
          >
            <Text style={styles.secondaryButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing[4],
    marginVertical: theme.spacing[2],
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
    borderWidth: 1,
  },
  content: {
    padding: theme.spacing[4],
    alignItems: 'center' as const,
  },
  emoji: {
    fontSize: 24,
    marginBottom: theme.spacing[2],
  },
  textContainer: {
    alignItems: 'center' as const,
    marginBottom: theme.spacing[3],
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing[1],
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: theme.spacing[2],
  },
  button: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.md,
    minWidth: 100,
    alignItems: 'center' as const,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary[600],
  },
  primaryButtonText: {
    color: theme.colors.neutral[50],
    fontSize: 14,
    fontWeight: '500' as const,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },
  secondaryButtonText: {
    color: theme.colors.neutral[600],
    fontSize: 14,
    fontWeight: '500' as const,
  },
});

export default EmailVerificationReminder; 