-- Privacy & Security Database Setup
-- Run this script in your Supabase SQL editor to set up the login_history table

-- Create login history table for privacy & security
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info TEXT, -- "iPhone 15, iOS 17.0"
  success BOOLEAN DEFAULT TRUE,
  ip_address TEXT, -- Optional, if you want to track
  user_agent TEXT, -- Browser/app info
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_time ON public.login_history(login_time);

-- Enable Row Level Security (RLS)
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Login History: Users can only see their own login history
CREATE POLICY "Users can view own login history" ON public.login_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own login history" ON public.login_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional: Allow users to delete their own login history
CREATE POLICY "Users can delete own login history" ON public.login_history
  FOR DELETE USING (auth.uid() = user_id); 