# Privacy & Security Features

This document outlines the privacy and security features implemented in SweetCue.

## Features Implemented

### 1. Change Password
- **Location**: Privacy & Security Screen → Password Tab
- **Functionality**: 
  - Verify current password before allowing changes
  - New password validation (minimum 6 characters)
  - Password confirmation matching
  - Show/hide password toggles
- **Security**: Uses Supabase Auth's `updateUser()` method with current password verification

### 2. Login History
- **Location**: Privacy & Security Screen → History Tab
- **Functionality**:
  - Track all login attempts (successful and failed)
  - Display device information (device name, OS, version)
  - Show login timestamps
  - Clear all login history option
- **Data Stored**:
  - Login timestamp
  - Device information (device name, OS, version)
  - Success/failure status
  - User agent (app identifier)
- **Privacy**: Users can only see their own login history

### 3. Current Session Information
- **Location**: Privacy & Security Screen → Session Tab
- **Functionality**:
  - Display current device information
  - Show session login time
  - Display session expiry time
  - Sign out from current device option
- **Security**: Uses Supabase Auth session data

## Database Schema

### login_history Table
```sql
CREATE TABLE public.login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info TEXT,
  success BOOLEAN DEFAULT TRUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)
- Users can only view their own login history
- Users can only insert their own login records
- Users can delete their own login history

## Setup Instructions

1. **Database Setup**: Run the SQL script in `privacy-security-setup.sql` in your Supabase SQL editor
2. **App Integration**: The features are automatically integrated into the settings flow
3. **Login Tracking**: Login tracking is automatically enabled for all sign-in attempts

## Security Considerations

- **Password Changes**: Require current password verification
- **Session Management**: Limited to current session only (Supabase Auth limitation)
- **Data Privacy**: All data is user-scoped with RLS policies
- **Login Tracking**: Only tracks basic device info, no location data
- **Data Retention**: Users can clear their own login history

## Technical Implementation

### Services
- `privacyService`: Handles all privacy and security operations
- `authService`: Enhanced with login tracking

### Components
- `PrivacySecurityScreen`: Main screen with tabbed interface
- Integrated into existing settings navigation

### Dependencies
- `expo-device`: For device information
- `date-fns`: For date formatting
- Existing design system components

## Future Enhancements

Potential Phase 2 features (not implemented):
- Multi-device session management
- Advanced device fingerprinting
- Login location tracking (with user consent)
- Two-factor authentication
- Security alerts for suspicious activity

## Privacy Compliance

- **GDPR**: Users can delete their login history
- **Data Minimization**: Only essential data is collected
- **User Control**: Users have full control over their privacy data
- **Transparency**: Clear information about what data is collected 