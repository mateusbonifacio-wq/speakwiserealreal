'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PitchSection from './PitchSection'
import ContextSection from './ContextSection'
import SessionsPanel from './SessionsPanel'
import AnalysisPanel from './AnalysisPanel'
import ProgressPanel from './ProgressPanel'
import type { Project } from '@/lib/supabase/projects'

interface WorkspaceUser {
  id: string
  email?: string | null
}

interface AudioSession {
  id: string
  user_id: string
  project_id: string | null
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

interface ProjectWorkspaceProps {
  project: Project
  user: WorkspaceUser
}

export default function ProjectWorkspace({ project, user }: ProjectWorkspaceProps) {
  const supabase = createClient()

  const [pitchSessions, setPitchSessions] = useState<AudioSession[]>([])
  const [contextSessions, setContextSessions] = useState<AudioSession[]>([])
  const [selectedSession, setSelectedSession] = useState<AudioSession | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [pitchTranscript, setPitchTranscript] = useState('')
  const [contextFields, setContextFields] = useState<ContextFields>({
    audience: project.default_audience || '',
    goal: project.default_goal || '',
    duration: project.default_duration || '',
    scenario: project.default_scenario || '',
    english_level: '',
    tone_style: '',
    constraints: '',
    additional_notes: '',
    context_transcript: '',
  })

  useEffect(() => {
    loadSessions()
  }, [project.id])

  const loadSessions = async () => {
    try {
      const { data: pitchData } = await supabase
        .from('audio_sessions')
        .select('*')
        .eq('project_id', project.id)
        .eq('type', 'pitch')
        .order('created_at', { ascending: false })

      const { data: contextData } = await supabase
        .from('audio_sessions')
        .select('*')
        .eq('project_id', project.id)
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
      formData.append('project_id', project.id)

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

  const handlePitchTranscribe = async (audioFile: File) => {
    const transcript = await handleTranscribe(audioFile, 'pitch')
    setPitchTranscript(transcript)
    return transcript
  }

  const handleContextTranscribe = async (audioFile: File) => {
    const transcript = await handleTranscribe(audioFile, 'context')
    setContextFields((prev) => ({
      ...prev,
      context_transcript: transcript,
      additional_notes: prev.additional_notes
        ? `${prev.additional_notes}\n\n${transcript}`
        : transcript,
    }))
    return transcript
  }

  const handleAnalyze = async (sessionId?: string) => {
    setIsAnalyzing(true)
    try {
      const body = sessionId
        ? { audio_session_id: sessionId }
        : {
            pitch_transcript: pitchTranscript,
            context: contextFields,
            project_id: project.id,
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

      if (sessionId) {
        await loadSessions()
        const { data: refreshedSession } = await supabase
          .from('audio_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()
        if (refreshedSession) {
          setSelectedSession(refreshedSession)
        }
      } else {
        setSelectedSession({
          id: 'temp',
          user_id: user.id,
          project_id: project.id,
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
        <div>
          <p className="text-sm text-gray-500">
            Project: <span className="font-semibold text-gray-900">{project.name}</span>
            {project.project_type && (
              <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                {project.project_type}
              </span>
            )}
          </p>
          {project.description && (
            <p className="mt-2 text-sm text-gray-600">{project.description}</p>
          )}
        </div>

        <div>
          <PitchSection
            pitchTranscript={pitchTranscript}
            onTranscriptChange={setPitchTranscript}
            onTranscribe={handlePitchTranscribe}
            isTranscribing={isTranscribing}
          />
        </div>

        <div>
          <ContextSection
            contextFields={contextFields}
            onContextChange={(fields) => setContextFields((prev) => ({ ...prev, ...fields }))}
            onTranscribe={handleContextTranscribe}
            isTranscribing={isTranscribing}
          />
        </div>

        {pitchTranscript && !selectedSession && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing || !pitchTranscript.trim()}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Analyzing...
                </>
              ) : (
                '✨ Analyze Current Pitch with AI'
              )}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-6 pt-8 border-t border-gray-200">
          {/* Mobile: Sessions first, then analysis */}
          {/* Left Column: Past Sessions */}
          <div>
            <SessionsPanel
              pitchSessions={pitchSessions}
              contextSessions={contextSessions}
              selectedSession={selectedSession}
              onSelectSession={handleSelectSession}
            />
          </div>

          {/* Right Column: Current Feedback + Progress */}
          <div className="space-y-6">
            {/* Top: Current Feedback */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Feedback</h3>
              <AnalysisPanel
                session={selectedSession}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                pitchTranscript={pitchTranscript}
              />
            </div>

            {/* Bottom: Progress */}
            <div>
              <ProgressPanel pitchSessions={pitchSessions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

