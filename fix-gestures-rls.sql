-- Fix RLS policies for gestures table to allow user-created gestures
-- This fixes the issue where Quick Gifts modal fails when creating gestures

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own gestures" ON public.gestures;

-- Create a new policy that allows users to insert gestures with their user_id
CREATE POLICY "Users can insert own gestures" ON public.gestures
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (is_template = true AND user_id IS NULL)
  );

-- Add a policy to allow users to view gestures linked to their partners
CREATE POLICY "Users can view partner gestures" ON public.gestures
  FOR SELECT USING (
    auth.uid() = user_id OR 
    is_template = true OR
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = gestures.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

-- Add a policy to allow users to update gestures linked to their partners
CREATE POLICY "Users can update partner gestures" ON public.gestures
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = gestures.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

-- Add a policy to allow users to delete gestures linked to their partners
CREATE POLICY "Users can delete partner gestures" ON public.gestures
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = gestures.partner_id 
      AND partners.user_id = auth.uid()
    )
  ); 