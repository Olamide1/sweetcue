# Database Setup Guide

## Gesture Templates Setup

To fix the "save gestures" error, you need to populate your Supabase database with gesture templates. Here's how:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-seed-gestures.sql`
4. Run the SQL script

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login


# Link your project (replace with your project ref)
supabase link --project-ref YOUR_PROJECT_REF

# Run the seed file
supabase db reset --db-url YOUR_DATABASE_URL
```

### Option 3: Manual Insertion

You can also manually insert a few gesture templates through the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Table Editor > gestures
3. Insert the following sample records:

```sql
INSERT INTO public.gestures (title, description, effort_level, cost_level, category, is_template, user_id) VALUES
('Cook their favorite meal', 'Prepare a special dinner at home', 'medium', 'low', 'acts_of_service', true, NULL),
('Write a love letter', 'Handwrite a heartfelt letter expressing your feelings', 'low', 'free', 'words_of_affirmation', true, NULL),
('Plan a date night', 'Organize a special evening just for the two of you', 'medium', 'low', 'quality_time', true, NULL);
```

## What This Fixes

The error occurs because:
1. When you select a gesture idea, the app tries to save a reminder with a `gesture_id`
2. If no gesture templates exist in the database, the `gesture_id` is null or invalid
3. This causes the reminder creation to fail

## Fallback Solution

The app now includes fallback gesture templates that will work even if your database is empty. However, it's still recommended to populate your database with the full set of gesture templates for the best user experience.

## Verification

After running the seed file, you should see:
- 30+ gesture templates in your `gestures` table
- Templates categorized by love language (words_of_affirmation, quality_time, etc.)
- All templates have `is_template = true` and `user_id = NULL`

The app will now be able to save reminders with selected gestures without errors. 