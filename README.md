# SpeakWise Pitch Coach

AI-powered pitch coaching application built with Next.js, TypeScript, Supabase, ElevenLabs, and Google Gemini.

## Features

- **Authentication**: Email/password authentication via Supabase
- **Audio Upload & Recording**: Upload or record audio for pitch and context
- **Speech-to-Text**: Automatic transcription using ElevenLabs API
- **AI Analysis**: Get structured feedback using Google Gemini API
- **Session Management**: Track and review past audio sessions

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
- Row Level Security (RLS) policies

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
│   ├── dashboard/
│   │   └── page.tsx          # Main dashboard
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

The ElevenLabs Speech-to-Text endpoint may need adjustment based on their current API documentation. Update the endpoint in `lib/ai/elevenlabs.ts` if needed.

### Google Gemini API

The code uses the `gemini-pro` model. You may want to update to `gemini-1.5-pro` or another model based on availability.

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

