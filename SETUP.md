# Setup Guide

This guide will walk you through setting up the SpeakWise Pitch Coach application.

## Prerequisites

- Node.js 18+ installed
- A Supabase account
- ElevenLabs API key
- Google AI (Gemini) API key

## Step-by-Step Setup

### 1. Clone and Install

```bash
npm install
```

### 2. Supabase Setup

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned

#### Set Up Database

1. Go to the SQL Editor in your Supabase dashboard
2. Run the SQL from `supabase/schema.sql` to create:
   - `profiles` table
   - `audio_sessions` table
   - Row Level Security policies

#### Set Up Storage

1. Go to Storage in your Supabase dashboard
2. Click "Create bucket"
3. Name it: `audio-recordings`
4. Set it to **Private** (uncheck "Public bucket")
5. Go to the SQL Editor and run `supabase/storage-policies.sql` to set up RLS policies

#### Get API Keys

1. Go to Project Settings > API
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 3. ElevenLabs Setup

1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Go to your profile/API settings
3. Copy your API key → `ELEVENLABS_API_KEY`

**Note:** The ElevenLabs Speech-to-Text endpoint may need adjustment. Check their documentation for the current endpoint and update `lib/ai/elevenlabs.ts` if needed.

### 4. Google AI (Gemini) Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey) or [Google Cloud Console](https://console.cloud.google.com/)
2. Create an API key for Gemini
3. Copy the API key → `GOOGLE_AI_API_KEY`

### 5. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ELEVENLABS_API_KEY=your-elevenlabs-key
GOOGLE_AI_API_KEY=your-google-ai-key
```

### 6. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Test the Application

1. Sign up with a new account
2. You should be redirected to the dashboard
3. Try uploading or recording a pitch audio
4. Wait for transcription
5. Click "Analyze with AI" to get feedback

## Troubleshooting

### "Unauthorized" errors

- Check that your Supabase keys are correct
- Verify RLS policies are set up correctly
- Make sure the user is authenticated

### Transcription errors

- Verify your ElevenLabs API key is correct
- Check the ElevenLabs endpoint in `lib/ai/elevenlabs.ts`
- Check the API response format - it may need adjustment

### Analysis errors

- Verify your Google AI API key is correct
- Check that the Gemini model name is correct in `lib/ai/gemini.ts`
- Ensure the API quota hasn't been exceeded

### Storage upload errors

- Verify the `audio-recordings` bucket exists
- Check storage policies are set up
- Ensure the service role key has proper permissions

## Next Steps

- Customize the UI styling
- Add more analysis types
- Implement project management features
- Add audio playback functionality

