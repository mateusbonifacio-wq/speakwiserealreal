-- Add slide deck support to projects
-- Run this in Supabase SQL Editor

-- 1. Add slide_deck_original_url to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS slide_deck_original_url TEXT;

-- 2. Create project_slides table
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

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_slides_project_id ON public.project_slides(project_id);
CREATE INDEX IF NOT EXISTS idx_project_slides_project_index ON public.project_slides(project_id, index);

-- 4. Enable RLS
ALTER TABLE public.project_slides ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for project_slides
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

