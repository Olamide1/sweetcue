# App Icon Setup Guide

## Overview
This guide explains how to update the SweetCue app icon for both iOS and Android platforms.

## Current Icon Files
The app currently uses these icon files in the `assets/` directory:
- `icon.png` - Main app icon (1024x1024px)
- `adaptive-icon.png` - Android adaptive icon (1024x1024px)
- `splash-icon.png` - Splash screen icon (1024x1024px)
- `notification-icon.png` - Notification icon (96x96px)
- `favicon.png` - Web favicon (32x32px)

## Icon Requirements

### Main App Icon (`icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Design**: Should be square with rounded corners (iOS will automatically round corners)
- **Background**: Can be transparent or solid color
- **Content**: Should be centered and leave padding around edges

### Android Adaptive Icon (`adaptive-icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Design**: Should work well with Android's adaptive icon system
- **Safe Zone**: Keep important content within the center 66% of the image
- **Background**: Can be transparent or solid color

### Splash Screen Icon (`splash-icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Design**: Should look good on both light and dark backgrounds
- **Content**: Centered logo/icon that works well at various sizes

### Notification Icon (`notification-icon.png`)
- **Size**: 96x96 pixels
- **Format**: PNG with transparency
- **Design**: Simple, recognizable icon that works well at small sizes
- **Background**: Should be transparent or white

## How to Update Icons

### Step 1: Prepare Your Icon
1. Create your icon design following the requirements above
2. Export in the required sizes and formats
3. Ensure all icons have the same visual identity

### Step 2: Replace Icon Files
1. Navigate to the `sweetcue-app/assets/` directory
2. Replace the existing icon files with your new ones:
   - Replace `icon.png` with your main app icon
   - Replace `adaptive-icon.png` with your Android adaptive icon
   - Replace `splash-icon.png` with your splash screen icon
   - Replace `notification-icon.png` with your notification icon
   - Replace `favicon.png` with your web favicon

### Step 3: Test the Icons
1. Run the app in development mode to see how icons look
2. Test on both iOS and Android simulators/devices
3. Check that icons display correctly in different contexts (app icon, splash screen, notifications)

### Step 4: Build and Deploy
1. Build a new version of the app
2. Test the icons in TestFlight/Play Console
3. Deploy the updated app

## Icon Design Guidelines

### SweetCue Brand Guidelines
- **Primary Color**: Pink (#FF6B9D)
- **Secondary Colors**: Purple (#6366F1), Green (#10B981)
- **Style**: Modern, clean, relationship-focused
- **Mood**: Warm, caring, romantic but not overly sentimental

### Design Tips
1. **Simplicity**: Icons should be recognizable at small sizes
2. **Consistency**: All icons should share the same visual language
3. **Accessibility**: Ensure good contrast and readability
4. **Scalability**: Design should work well at various sizes

## File Structure
```
sweetcue-app/
├── assets/
│   ├── icon.png              # Main app icon (1024x1024)
│   ├── adaptive-icon.png     # Android adaptive icon (1024x1024)
│   ├── splash-icon.png       # Splash screen icon (1024x1024)
│   ├── notification-icon.png # Notification icon (96x96)
│   └── favicon.png          # Web favicon (32x32)
└── app.json                 # Icon configuration
```

## Configuration in app.json
The app.json file already has the correct icon configuration:
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png"
        }
      ]
    ]
  }
}
```

## Troubleshooting

### Common Issues
1. **Icons not updating**: Clear build cache and rebuild
2. **Wrong sizes**: Ensure all icons meet the size requirements
3. **Transparency issues**: Check that PNG files have proper transparency
4. **Android adaptive icon issues**: Ensure the icon works well with Android's adaptive icon system

### Testing Commands
```bash
# Clear Expo cache
npx expo start --clear

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Next Steps
1. Design your new app icon following these guidelines
2. Export in the required sizes and formats
3. Replace the existing icon files
4. Test thoroughly on both platforms
5. Build and deploy the updated app

## Support
If you encounter issues with icon setup, check:
1. Expo documentation on app icons
2. Platform-specific icon requirements
3. Build logs for any icon-related errors 