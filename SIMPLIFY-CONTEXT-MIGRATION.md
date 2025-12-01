# Context Simplification Migration Guide

## Overview
This migration removes "Context Sessions" and moves all context fields to the project level. Context is now static and editable at any time, simplifying the user flow.

## Database Migration

### Step 1: Add Context Fields to Projects Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add context fields to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS english_level TEXT,
ADD COLUMN IF NOT EXISTS tone_style TEXT,
ADD COLUMN IF NOT EXISTS constraints TEXT,
ADD COLUMN IF NOT EXISTS additional_notes TEXT,
ADD COLUMN IF NOT EXISTS context_transcript TEXT;
```

Or use the provided migration file:
- `supabase/add-context-fields.sql`

## Changes Summary

### ✅ Removed
- Context Sessions tab in Past Sessions panel
- Context session creation in upload-and-transcribe API
- All UI references to `type = "context"` sessions
- Context parameter from analysis API (now uses project context)

### ✅ Added
- Context fields stored directly in `projects` table:
  - `english_level`
  - `tone_style`
  - `constraints`
  - `additional_notes`
  - `context_transcript` (for voice notes)
- New API endpoint: `/api/project/transcribe-context` (saves directly to project)
- New API endpoint: `/api/project/update-context` (saves context fields to project)
- "Save Context" button in ContextSection
- Attempt numbers in Past Sessions (Attempt #1, #2, etc.)

### ✅ Updated
- `ContextSection`: Now saves directly to project, includes "Save Context" button
- `SessionsPanel`: Removed tabs, shows only pitch attempts with attempt numbers
- `ProjectWorkspace`: Loads context from project, saves on change
- Analysis API: Always uses project context (no context parameter needed)
- Context voice notes: Save to `projects.context_transcript` instead of creating sessions

## User Flow (After Migration)

1. **Set Project Context Once**: User edits context fields and clicks "Save Context"
2. **Make Pitch Attempt**: User records/enters pitch transcript
3. **Get Feedback**: AI analyzes using pitch transcript + project context
4. **Start Next Attempt**: User iterates on pitch, context remains the same
5. **View Progress**: Past Sessions shows "Attempt #1", "Attempt #2", etc.

## Testing Checklist

- [ ] Run database migration
- [ ] Verify context fields appear in projects table
- [ ] Test saving context from UI
- [ ] Test context voice note transcription
- [ ] Test pitch analysis (should use project context)
- [ ] Verify Past Sessions shows only pitch attempts with attempt numbers
- [ ] Verify no context sessions are created
- [ ] Test progress tracking across multiple attempts

## Rollback (If Needed)

If you need to rollback:

1. The context fields in projects table can remain (they're optional)
2. Context sessions can still be created manually via API if needed
3. Old code paths for context sessions are removed, so you'd need to restore from git history

## Notes

- Existing context sessions in the database will remain but won't be displayed in the UI
- All new context is saved to the project level
- Context is shared across all pitch attempts for a project
- Context can be updated at any time and will be used for future analyses

