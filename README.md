# SweetCue

Convert intent into concrete actions through timed nudges. SweetCue helps partners maintain strong bonds with smart reminders and gesture tracking.

## Project Overview

SweetCue is a React Native app built with Expo that helps couples strengthen their relationships through timely gestures and reminders. The project includes both the mobile app and a standalone landing page.

### Key Features

- **Gesture Library** - Templates flagged by effort and cost
- **Smart Reminders** - Fixed dates and flexible scheduling
- **Push Notifications** - Server-scheduled delivery
- **Private Workspaces** - One timeline per relationship
- **Completion Tracking** - Mark done, add notes, track streaks
- **LDR Support** - Auto time-zone shift, one-tap calls

### Target Users

- Co-located couples (20-45)
- Long-distance couples across time zones
- Poly/open relationship groups

## Project Structure

```
sweetcue-app/
├── src/                    # React Native app source
│   ├── components/         # Reusable components
│   ├── design-system/      # Sprout DS tokens & components
│   ├── screens/           # App screens
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── landing/               # Standalone landing page
│   ├── index.html         # Main landing page
│   ├── serve.js           # Local development server
│   └── README.md          # Landing page documentation
├── assets/                # App assets
└── [config files]         # Expo, TypeScript, etc.
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd sweetcue-app
   npm install
   ```

### Running the App

```bash
# Start the development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Start with tunnel for device testing
npx expo start --tunnel
```

### Running the Landing Page

```bash
# Navigate to landing directory
cd landing

# Start local server
node serve.js

# Or use any static file server
python -m http.server 3000
```

The landing page will be available at `http://localhost:3000`

## Design System

SweetCue uses the **Sprout Design System** with:

- **Colors**: Pastel primary (#FFB6C1), accent (#6F8DF6), neutrals
- **Typography**: Inter font, 12-14-16-20-28-40px scale
- **Spacing**: 4-point grid system
- **Components**: Buttons, cards, modals with consistent styling

## Technology Stack

### Mobile App
- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Backend**: Supabase (Auth, Database, Storage)
- **Push Notifications**: Expo Push
- **Billing**: RevenueCat
- **Analytics**: Amplitude

### Landing Page
- **Technology**: Pure HTML/CSS/JavaScript
- **Hosting**: Any static hosting service
- **Design**: Sprout DS compliance

## Key Metrics

- **Activation**: Profile + first reminder within 3 minutes
- **Engagement**: 3+ logged gestures per relationship/week
- **Retention**: <15% day-30 subscription churn
- **Revenue**: 5% free-trial to paid conversion by day 60
- **NPS**: Target 50

## Pricing

- **Free Trial**: 7 days, full feature access
- **Monthly**: $8/month
- **Annual**: $80/year (17% discount)

## Development

### Code Style

- TypeScript strict mode
- ESLint with Airbnb rules
- Prettier for formatting
- Storybook for component development

### Database

See `DATABASE_SETUP.md` for Supabase schema and setup instructions.

### Notifications

See `notification-setup.sql` for push notification configuration.

## Deployment

### App Store Deployment

```bash
# Build for production
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Landing Page Deployment

The landing page can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## Contributing

1. Follow the existing code style
2. Use the Sprout Design System components
3. Write tests for new features
4. Update documentation as needed

## License

Built with love for stronger relationships. ❤️

## Support

For technical support or feature requests, please refer to the project documentation or create an issue in the repository. 