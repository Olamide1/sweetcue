-- Fix RLS policies for reminders table to allow proper creation and access
-- This fixes the issue where reminders cannot be created due to RLS policy violations

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can view own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON public.reminders;

-- Create new policies that properly handle partner_id relationships
CREATE POLICY "Users can insert own reminders" ON public.reminders
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = reminders.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own reminders" ON public.reminders
  FOR SELECT USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = reminders.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own reminders" ON public.reminders
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = reminders.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own reminders" ON public.reminders
  FOR DELETE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = reminders.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

-- Also fix gestures policies to be more permissive for user-created gestures
DROP POLICY IF EXISTS "Users can insert own gestures" ON public.gestures;
DROP POLICY IF EXISTS "Users can view own gestures and templates" ON public.gestures;
DROP POLICY IF EXISTS "Users can update own gestures" ON public.gestures;
DROP POLICY IF EXISTS "Users can delete own gestures" ON public.gestures;

-- Create more permissive gestures policies
CREATE POLICY "Users can insert own gestures" ON public.gestures
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR 
    (is_template = true AND user_id IS NULL) OR
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = gestures.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own gestures and templates" ON public.gestures
  FOR SELECT USING (
    (auth.uid() = user_id) OR 
    is_template = true OR
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = gestures.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own gestures" ON public.gestures
  FOR UPDATE USING (
    (auth.uid() = user_id) OR
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = gestures.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own gestures" ON public.gestures
  FOR DELETE USING (
    (auth.uid() = user_id) OR
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = gestures.partner_id 
      AND partners.user_id = auth.uid()
    )
  ); 