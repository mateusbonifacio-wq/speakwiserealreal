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
  const [selectedSession, setSelectedSession] = useState<AudioSession | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSavingContext, setIsSavingContext] = useState(false)
  const [pitchTranscript, setPitchTranscript] = useState('')
  const [contextFields, setContextFields] = useState<ContextFields>({
    audience: project.default_audience || '',
    goal: project.default_goal || '',
    duration: project.default_duration || '',
    scenario: project.default_scenario || '',
    english_level: project.english_level || '',
    tone_style: project.tone_style || '',
    constraints: project.constraints || '',
    additional_notes: project.additional_notes || '',
    context_transcript: project.context_transcript || '',
  })

  useEffect(() => {
    loadSessions()
    loadProjectContext()
  }, [project.id])

  const loadProjectContext = async () => {
    try {
      const { data: updatedProject } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project.id)
        .single()

      if (updatedProject) {
        setContextFields({
          audience: updatedProject.default_audience || '',
          goal: updatedProject.default_goal || '',
          duration: updatedProject.default_duration || '',
          scenario: updatedProject.default_scenario || '',
          english_level: updatedProject.english_level || '',
          tone_style: updatedProject.tone_style || '',
          constraints: updatedProject.constraints || '',
          additional_notes: updatedProject.additional_notes || '',
          context_transcript: updatedProject.context_transcript || '',
        })
      }
    } catch (error) {
      console.error('Error loading project context:', error)
    }
  }

  const loadSessions = async () => {
    try {
      const { data: pitchData } = await supabase
        .from('audio_sessions')
        .select('*')
        .eq('project_id', project.id)
        .eq('type', 'pitch')
        .order('created_at', { ascending: false })

      setPitchSessions(pitchData || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const handlePitchTranscribe = async (audioFile: File) => {
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('type', 'pitch')
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
      const transcript = data.transcript || ''
      setPitchTranscript(transcript)
      await loadSessions()
      return transcript
    } catch (error: any) {
      alert(`Error: ${error.message}`)
      throw error
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleContextTranscribe = async (audioFile: File) => {
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('project_id', project.id)

      const response = await fetch('/api/project/transcribe-context', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Transcription failed')
      }

      const data = await response.json()
      const transcript = data.transcript || ''
      setContextFields((prev) => ({
        ...prev,
        context_transcript: transcript,
      }))
      // Reload project to get updated context
      await loadProjectContext()
      return transcript
    } catch (error: any) {
      alert(`Error: ${error.message}`)
      throw error
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleSaveContext = async () => {
    setIsSavingContext(true)
    try {
      const response = await fetch('/api/project/update-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          context: contextFields,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save context')
      }

      await loadProjectContext()
      alert('Context saved successfully!')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsSavingContext(false)
    }
  }

  const handleAnalyze = async (sessionId?: string) => {
    setIsAnalyzing(true)
    try {
      const body = sessionId
        ? { audio_session_id: sessionId }
        : {
            pitch_transcript: pitchTranscript,
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

      // Always reload sessions to get the latest data (including newly created sessions)
      await loadSessions()

      if (sessionId) {
        // If analyzing an existing session, select it
        const { data: refreshedSession } = await supabase
          .from('audio_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()
        if (refreshedSession) {
          setSelectedSession(refreshedSession)
        }
      } else if (data.session_id) {
        // If a new session was created, select it
        const { data: newSession } = await supabase
          .from('audio_sessions')
          .select('*')
          .eq('id', data.session_id)
          .single()
        if (newSession) {
          setSelectedSession(newSession)
        }
      } else {
        // Fallback: create temporary session object for display
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
    if (session.transcript) {
      setPitchTranscript(session.transcript)
    }
  }

  const handleStartNewAttempt = () => {
    setSelectedSession(null)
    setPitchTranscript('')
  }

  const handlePitchChange = (newTranscript: string) => {
    setPitchTranscript(newTranscript)
    // If user starts editing and transcript is different from selected session, clear selection
    if (selectedSession && newTranscript !== selectedSession.transcript) {
      setSelectedSession(null)
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
            onTranscriptChange={handlePitchChange}
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
            onSave={handleSaveContext}
            isSaving={isSavingContext}
          />
        </div>

        {pitchTranscript && (
          <div className="pt-4 border-t border-gray-200 space-y-3">
            {selectedSession && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Viewing a previous attempt. Edit the pitch above to create a new attempt.
                </p>
                <button
                  onClick={handleStartNewAttempt}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  Start New Attempt
                </button>
              </div>
            )}
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
              ) : selectedSession ? (
                '✨ Analyze as New Attempt'
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

