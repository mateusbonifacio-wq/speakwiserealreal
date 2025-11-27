-- ============================================
-- SPEAKWISE PITCH COACH - COMPLETE SETUP SQL
-- ============================================
-- Copy and paste this entire file into Supabase SQL Editor
-- Then click "Run" or press Ctrl+Enter
-- ============================================

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 3: Create Audio Sessions table
CREATE TABLE IF NOT EXISTS public.audio_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    audio_path TEXT NOT NULL,
    transcript TEXT,
    analysis_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 4: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_sessions ENABLE ROW LEVEL SECURITY;

-- Step 5: Profiles RLS Policies
-- Users can select their own profile
CREATE POLICY "Users can select own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Step 6: Audio Sessions RLS Policies
-- Users can insert their own audio sessions
CREATE POLICY "Users can insert own audio sessions"
    ON public.audio_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can select their own audio sessions
CREATE POLICY "Users can select own audio sessions"
    ON public.audio_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own audio sessions
CREATE POLICY "Users can update own audio sessions"
    ON public.audio_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own audio sessions
CREATE POLICY "Users can delete own audio sessions"
    ON public.audio_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- DONE! Tables and RLS policies created.
-- Next: Create the Storage bucket manually
-- ============================================

