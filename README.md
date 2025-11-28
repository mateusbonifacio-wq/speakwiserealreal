# SpeakWise Pitch Coach

AI-powered pitch coaching application built with Next.js, TypeScript, Supabase, ElevenLabs, and Google Gemini.

## Features

- **Authentication**: Email/password authentication via Supabase
- **Audio Upload & Recording**: Upload or record audio for pitch and context
- **Speech-to-Text**: Automatic transcription using ElevenLabs API
- **AI Analysis**: Get structured feedback using Google Gemini API
- **Session Management**: Track and review past audio sessions
- **Projects Layer**: Organize multiple pitches/interviews with project-specific defaults

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database & Auth**: Supabase
- **Storage**: Supabase Storage
- **Speech-to-Text**: ElevenLabs API
- **AI Analysis**: Google Gemini API

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

### 3. Supabase Setup

#### Database Schema

Run the SQL in `supabase/schema.sql` in your Supabase SQL editor to create:
- `profiles` table
- `audio_sessions` table
- `projects` table (if not already created)
- Row Level Security (RLS) policies

**Important:** If you're adding the projects feature to an existing database, run `supabase/add-projects.sql` instead to add the `projects` table and `project_id` column to `audio_sessions` without recreating existing tables.

#### Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `audio-recordings`
3. Set it to **Private** (not public)
4. Configure RLS policies:
   - Users can upload files to their own folder (`{user_id}/*`)
   - Users can only access their own files

You can use this SQL to set up storage policies:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read their own files
CREATE POLICY "Users can read own audio"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/
│   │   └── audio/
│   │       ├── upload-and-transcribe/route.ts
│   │       └── analyze/route.ts
│   ├── auth/
│   │   └── page.tsx          # Sign up/sign in page
│   ├── projects/
│   │   ├── page.tsx          # Projects dashboard
│   │   └── [projectId]/page.tsx # Project workspace
│   ├── layout.tsx
│   ├── page.tsx              # Root page (redirects)
│   └── globals.css
├── lib/
│   ├── ai/
│   │   ├── elevenlabs.ts    # ElevenLabs STT integration
│   │   └── gemini.ts        # Google Gemini integration
│   └── supabase/
│       ├── client.ts         # Browser client
│       ├── server.ts         # Server client
│       ├── service.ts        # Service role client
│       ├── storage.ts        # Storage helpers
│       ├── audio-sessions.ts # Audio session helpers
│       └── database.types.ts # TypeScript types
├── supabase/
│   └── schema.sql            # Database schema
├── middleware.ts             # Auth middleware
└── package.json
```

## API Routes

### POST `/api/audio/upload-and-transcribe`

Uploads audio, stores it in Supabase Storage, and transcribes it using ElevenLabs.

**Request:**
- `audio`: Audio file (multipart/form-data)
- `type`: `'pitch'` or `'context'`

**Response:**
```json
{
  "audio_session_id": "uuid",
  "transcript": "transcribed text",
  "audio_path": "storage/path"
}
```

### POST `/api/audio/analyze`

Analyzes a transcribed audio session using Google Gemini.

**Request:**
```json
{
  "audio_session_id": "uuid"
}
```

**Response:**
```json
{
  "analysis_json": {
    "summary": "...",
    "strengths": [...],
    "improvements": [...],
    "suggestions": [...],
    "improved_pitch": "..." // if type is 'pitch'
  }
}
```

## Notes

### ElevenLabs API

The ElevenLabs Speech-to-Text integration uses the REST API endpoint. The current implementation:

- **Endpoint**: `https://api.elevenlabs.io/v1/speech-to-text/convert`
- **Model**: `scribe_v1` (may need to be `eleven_scribe_v1` depending on your API version)
- **Features**: Diarization and audio event tagging enabled by default

If you encounter issues:

1. **Check the endpoint**: The endpoint might be `/v1/speech-to-text/transcribe` or `/v1/speech-to-text` instead
2. **Verify model ID**: Try `eleven_scribe_v1` if `scribe_v1` doesn't work
3. **Check field name**: The audio field might need to be `audio` instead of `file`
4. **Review API docs**: Check [ElevenLabs API documentation](https://elevenlabs.io/docs/api-reference/speech-to-text) for the latest endpoint format

Update `lib/ai/elevenlabs.ts` with the correct endpoint and parameters based on your API version.

### Google Gemini API

The code uses the REST API directly with verified working models. The implementation includes automatic fallback across multiple models:
- Primary: `gemini-2.5-flash` (latest and most capable)
- Fallbacks: `gemini-2.5-flash-lite`, `gemini-2.0-flash`, `gemini-2.0-flash-001`, `gemini-2.0-flash-lite`, `gemini-2.0-flash-lite-001`

All models are verified working via the REST API endpoint: `https://generativelanguage.googleapis.com/v1/models/{model}:generateContent`

If you encounter 404 errors, the code will automatically try the next model in the fallback list.

### Audio Format

The app accepts various audio formats (mp3, wav, webm, etc.). Recorded audio from the browser will be in WebM format.

## Deployment

This app is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Make sure to set all environment variables in your deployment platform.

## Future Enhancements

- Project management
- Deployed pitches
- Enhanced UI/UX
- Audio playback
- Export functionality
- Multiple analysis types

