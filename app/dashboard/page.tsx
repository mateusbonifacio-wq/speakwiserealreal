'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import PitchSection from '@/app/components/PitchSection'
import ContextSection from '@/app/components/ContextSection'
import SessionsPanel from '@/app/components/SessionsPanel'
import AnalysisPanel from '@/app/components/AnalysisPanel'

interface AudioSession {
  id: string
  user_id: string
  type: string
  audio_path: string
  transcript: string | null
  analysis_json: any | null
  created_at: string
}

interface ContextFields {
  audience: string
  goal: string
  duration: string
  scenario: string
  english_level: string
  tone_style: string
  constraints: string
  additional_notes: string
  context_transcript: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [pitchSessions, setPitchSessions] = useState<AudioSession[]>([])
  const [contextSessions, setContextSessions] = useState<AudioSession[]>([])
  const [selectedSession, setSelectedSession] = useState<AudioSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Pitch state
  const [pitchTranscript, setPitchTranscript] = useState('')

  // Context state
  const [contextFields, setContextFields] = useState<ContextFields>({
    audience: '',
    goal: '',
    duration: '',
    scenario: '',
    english_level: '',
    tone_style: '',
    constraints: '',
    additional_notes: '',
    context_transcript: '',
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUser()
    loadSessions()
  }, [])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const loadSessions = async () => {
    try {
      const { data: pitchData } = await supabase
        .from('audio_sessions')
        .select('*')
        .eq('type', 'pitch')
        .order('created_at', { ascending: false })

      const { data: contextData } = await supabase
        .from('audio_sessions')
        .select('*')
        .eq('type', 'context')
        .order('created_at', { ascending: false })

      setPitchSessions(pitchData || [])
      setContextSessions(contextData || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const handleTranscribe = async (audioFile: File, type: 'pitch' | 'context'): Promise<string> => {
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('type', type)

      const response = await fetch('/api/audio/upload-and-transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Transcription failed')
      }

      const data = await response.json()
      await loadSessions()
      return data.transcript || ''
    } catch (error: any) {
      alert(`Error: ${error.message}`)
      throw error
    } finally {
      setIsTranscribing(false)
    }
  }

  const handlePitchTranscribe = async (audioFile: File): Promise<string> => {
    return handleTranscribe(audioFile, 'pitch')
  }

  const handleContextTranscribe = async (audioFile: File): Promise<string> => {
    return handleTranscribe(audioFile, 'context')
  }

  const handleAnalyze = async (sessionId?: string) => {
    setIsAnalyzing(true)
    try {
      // If sessionId provided, use old format; otherwise use new format with current state
      const body = sessionId
        ? { audio_session_id: sessionId }
        : {
            pitch_transcript: pitchTranscript,
            context: contextFields,
          }

      const response = await fetch('/api/audio/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Analysis failed')
      }

      const data = await response.json()

      // If we have a selected session, update it
      if (selectedSession) {
        await loadSessions()
        const { data: updatedSession } = await supabase
          .from('audio_sessions')
          .select('*')
          .eq('id', selectedSession.id)
          .single()
        if (updatedSession) setSelectedSession(updatedSession)
      } else {
        // Create a temporary session object to display analysis
        setSelectedSession({
          id: 'temp',
          user_id: user.id,
          type: 'pitch',
          audio_path: '',
          transcript: pitchTranscript,
          analysis_json: data.analysis_json,
          created_at: new Date().toISOString(),
        })
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSelectSession = (session: AudioSession) => {
    setSelectedSession(session)
    if (session.type === 'pitch' && session.transcript) {
      setPitchTranscript(session.transcript)
    } else if (session.type === 'context' && session.transcript) {
      setContextFields((prev) => ({
        ...prev,
        context_transcript: session.transcript || '',
        additional_notes: prev.additional_notes
          ? `${prev.additional_notes}\n\n${session.transcript}`
          : session.transcript || '',
      }))
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-500 via-purple-500 to-sky-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-500 via-purple-500 to-sky-500 py-8 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">SpeakWise Real</h1>
          <p className="text-indigo-100 text-sm mt-1">AI-Powered Pitch & Communication Coach</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white text-sm">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        {/* Pitch Section */}
        <div className="mb-8">
          <PitchSection
            pitchTranscript={pitchTranscript}
            onTranscriptChange={setPitchTranscript}
            onTranscribe={handlePitchTranscribe}
            isTranscribing={isTranscribing}
          />
        </div>

        {/* Context Section */}
        <div className="mb-8">
          <ContextSection
            contextFields={contextFields}
            onContextChange={(fields) => setContextFields((prev) => ({ ...prev, ...fields }))}
            onTranscribe={handleContextTranscribe}
            isTranscribing={isTranscribing}
          />
        </div>

        {/* Sessions + Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-gray-200">
          <SessionsPanel
            pitchSessions={pitchSessions}
            contextSessions={contextSessions}
            selectedSession={selectedSession}
            onSelectSession={handleSelectSession}
          />
          <AnalysisPanel
            session={selectedSession}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            pitchTranscript={pitchTranscript}
          />
        </div>

        {/* Analyze Button for Current State */}
        {pitchTranscript && !selectedSession && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing || !pitchTranscript.trim()}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                '✨ Analyze Current Pitch with AI'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
