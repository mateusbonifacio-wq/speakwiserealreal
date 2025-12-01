-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    project_type TEXT,
    default_audience TEXT,
    default_goal TEXT,
    default_duration TEXT,
    default_scenario TEXT,
    english_level TEXT,
    tone_style TEXT,
    constraints TEXT,
    additional_notes TEXT,
    context_transcript TEXT,
    transcription_language TEXT,
    slide_deck_original_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Audio sessions table
CREATE TABLE IF NOT EXISTS public.audio_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    audio_path TEXT NOT NULL,
    transcript TEXT,
    analysis_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Project slides table
CREATE TABLE IF NOT EXISTS public.project_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    index INTEGER NOT NULL,
    title TEXT,
    content TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(project_id, index)
);

CREATE INDEX IF NOT EXISTS idx_project_slides_project_id ON public.project_slides(project_id);
CREATE INDEX IF NOT EXISTS idx_project_slides_project_index ON public.project_slides(project_id, index);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_slides ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
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

-- Projects RLS Policies
CREATE POLICY "Users can select own projects"
    ON public.projects
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
    ON public.projects
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON public.projects
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON public.projects
    FOR DELETE
    USING (auth.uid() = user_id);

-- Audio sessions RLS Policies
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

-- Project slides RLS Policies
-- Users can select slides for their own projects
CREATE POLICY "Users can select own project slides"
    ON public.project_slides
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_slides.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can insert slides for their own projects
CREATE POLICY "Users can insert own project slides"
    ON public.project_slides
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_slides.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can update slides for their own projects
CREATE POLICY "Users can update own project slides"
    ON public.project_slides
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_slides.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can delete slides for their own projects
CREATE POLICY "Users can delete own project slides"
    ON public.project_slides
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_slides.project_id
            AND projects.user_id = auth.uid()
        )
    );

