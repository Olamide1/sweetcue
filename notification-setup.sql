-- Notification Setup for SweetCue
-- Run this in your Supabase SQL Editor

-- Add notification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"pushEnabled": true, "emailEnabled": true, "reminderAdvance": 1}';

-- Update existing profiles to have default notification preferences
UPDATE public.profiles 
SET notification_preferences = '{"pushEnabled": true, "emailEnabled": true, "reminderAdvance": 1}'
WHERE notification_preferences IS NULL; 