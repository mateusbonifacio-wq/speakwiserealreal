-- Add context fields to projects table
-- Run this in Supabase SQL Editor

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS english_level TEXT,
ADD COLUMN IF NOT EXISTS tone_style TEXT,
ADD COLUMN IF NOT EXISTS constraints TEXT,
ADD COLUMN IF NOT EXISTS additional_notes TEXT,
ADD COLUMN IF NOT EXISTS context_transcript TEXT;

-- Note: default_audience, default_goal, default_duration, default_scenario already exist

