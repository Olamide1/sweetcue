-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  push_token TEXT,
  notification_preferences JSONB DEFAULT '{"pushEnabled": true, "emailEnabled": true, "reminderAdvance": 1}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create partners table
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  birthday DATE,
  anniversary DATE,
  love_language TEXT,
  dislikes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gestures table (for gesture library)
CREATE TABLE IF NOT EXISTS public.gestures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  effort_level TEXT CHECK (effort_level IN ('low', 'medium', 'high')) NOT NULL,
  cost_level TEXT CHECK (cost_level IN ('free', 'low', 'medium', 'high')) NOT NULL,
  category TEXT NOT NULL,
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  gesture_id UUID REFERENCES public.gestures(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  rrule TEXT, -- For recurring rules (RFC 5545)
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_note TEXT,
  snooze_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT CHECK (plan_type IN ('trial', 'monthly', 'yearly')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
  trial_end_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

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

-- Create support requests table for help & support
CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')) DEFAULT 'pending',
  admin_response TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON public.partners(user_id);
CREATE INDEX IF NOT EXISTS idx_gestures_user_id ON public.gestures(user_id);
CREATE INDEX IF NOT EXISTS idx_gestures_partner_id ON public.gestures(partner_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_partner_id ON public.reminders(partner_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_date ON public.reminders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_time ON public.login_history(login_time);
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON public.support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON public.support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON public.support_requests(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gestures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Partners: Users can only see and modify their own partners
CREATE POLICY "Users can view own partners" ON public.partners
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own partners" ON public.partners
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own partners" ON public.partners
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own partners" ON public.partners
  FOR DELETE USING (auth.uid() = user_id);

-- Gestures: Users can only see and modify their own gestures + templates
CREATE POLICY "Users can view own gestures and templates" ON public.gestures
  FOR SELECT USING (auth.uid() = user_id OR is_template = true);

CREATE POLICY "Users can insert own gestures" ON public.gestures
  FOR INSERT WITH CHECK (auth.uid() = user_id OR (is_template = true AND user_id IS NULL));

CREATE POLICY "Users can update own gestures" ON public.gestures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gestures" ON public.gestures
  FOR DELETE USING (auth.uid() = user_id);

-- Reminders: Users can only see and modify their own reminders
CREATE POLICY "Users can view own reminders" ON public.reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON public.reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON public.reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON public.reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions: Users can only see and modify their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Login History: Users can only see their own login history
CREATE POLICY "Users can view own login history" ON public.login_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own login history" ON public.login_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Support Requests: Users can only see and modify their own support requests
CREATE POLICY "Users can view own support requests" ON public.support_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own support requests" ON public.support_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own support requests" ON public.support_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_gestures_updated_at
  BEFORE UPDATE ON public.gestures
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_support_requests_updated_at
  BEFORE UPDATE ON public.support_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some default gesture templates
INSERT INTO public.gestures (user_id, partner_id, title, description, effort_level, cost_level, category, is_template)
VALUES 
  (NULL, NULL, 'Send a sweet good morning text', 'Start their day with love', 'low', 'free', 'communication', true),
  (NULL, NULL, 'Order their favorite coffee', 'Surprise delivery to their workplace', 'low', 'low', 'gifts', true),
  (NULL, NULL, 'Plan a surprise date night', 'Book dinner and activities they love', 'high', 'medium', 'experiences', true),
  (NULL, NULL, 'Send flowers', 'Beautiful bouquet delivered to their location', 'low', 'medium', 'gifts', true),
  (NULL, NULL, 'Write a love letter', 'Handwritten note expressing your feelings', 'medium', 'free', 'communication', true),
  (NULL, NULL, 'Cook their favorite meal', 'Prepare a special dinner at home', 'medium', 'low', 'acts_of_service', true),
  (NULL, NULL, 'Plan a weekend getaway', 'Book a romantic trip together', 'high', 'high', 'experiences', true),
  (NULL, NULL, 'Give them a massage', 'Relaxing massage after a long day', 'medium', 'free', 'physical_touch', true)
ON CONFLICT DO NOTHING; 