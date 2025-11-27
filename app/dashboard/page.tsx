'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AudioSession {
  id: string
  user_id: string
  type: string
  audio_path: string
  transcript: string | null
  analysis_json: any | null
  created_at: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [pitchSessions, setPitchSessions] = useState<AudioSession[]>([])
  const [contextSessions, setContextSessions] = useState<AudioSession[]>([])
  const [selectedSession, setSelectedSession] = useState<AudioSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
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

  const handleFileUpload = async (file: File, type: 'pitch' | 'context') => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('audio', file)
      formData.append('type', type)

      const response = await fetch('/api/audio/upload-and-transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      await loadSessions()
      alert('Audio uploaded and transcribed successfully!')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const startRecording = async (type: 'pitch' | 'context') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
        await handleFileUpload(file, type)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setRecording(true)
    } catch (error) {
      alert('Error accessing microphone')
      console.error(error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setRecording(false)
    }
  }

  const handleAnalyze = async (sessionId: string) => {
    try {
      const response = await fetch('/api/audio/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_session_id: sessionId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Analysis failed')
      }

      await loadSessions()
      const updatedSession = [...pitchSessions, ...contextSessions].find(s => s.id === sessionId)
      if (updatedSession) {
        const { data } = await supabase
          .from('audio_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()
        if (data) setSelectedSession(data)
      }
      alert('Analysis completed!')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Welcome, {user?.email}</h1>
        <button
          onClick={handleSignOut}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Pitch Audio Section */}
        <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ marginBottom: '1rem' }}>Pitch Audio</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'pitch')
              }}
              disabled={uploading || recording}
              style={{ marginBottom: '0.5rem' }}
            />
            <div>
              {recording ? (
                <button
                  onClick={stopRecording}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Stop Recording
                </button>
              ) : (
                <button
                  onClick={() => startRecording('pitch')}
                  disabled={uploading || recording}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Record Audio
                </button>
              )}
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Past Pitch Sessions</h3>
            {pitchSessions.length === 0 ? (
              <p style={{ color: '#666' }}>No pitch sessions yet</p>
            ) : (
              <ul style={{ listStyle: 'none' }}>
                {pitchSessions.map((session) => (
                  <li
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    style={{
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      backgroundColor: selectedSession?.id === session.id ? '#e3f2fd' : '#f5f5f5',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                  >
                    {new Date(session.created_at).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Context Audio Section */}
        <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ marginBottom: '1rem' }}>Context Audio</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'context')
              }}
              disabled={uploading || recording}
              style={{ marginBottom: '0.5rem' }}
            />
            <div>
              {recording ? (
                <button
                  onClick={stopRecording}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Stop Recording
                </button>
              ) : (
                <button
                  onClick={() => startRecording('context')}
                  disabled={uploading || recording}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Record Audio
                </button>
              )}
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Past Context Sessions</h3>
            {contextSessions.length === 0 ? (
              <p style={{ color: '#666' }}>No context sessions yet</p>
            ) : (
              <ul style={{ listStyle: 'none' }}>
                {contextSessions.map((session) => (
                  <li
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    style={{
                      padding: '0.5rem',
                      marginBottom: '0.5rem',
                      backgroundColor: selectedSession?.id === session.id ? '#e3f2fd' : '#f5f5f5',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                  >
                    {new Date(session.created_at).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Selected Session Details */}
      {selectedSession && (
        <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px' }}>
          <h2>Session Details</h2>
          <p><strong>Type:</strong> {selectedSession.type}</p>
          <p><strong>Created:</strong> {new Date(selectedSession.created_at).toLocaleString()}</p>
          
          {selectedSession.transcript && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Transcript</h3>
              <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
                {selectedSession.transcript}
              </p>
            </div>
          )}

          {selectedSession.analysis_json ? (
            <div style={{ marginTop: '1rem' }}>
              <h3>Analysis</h3>
              <div style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
                <p><strong>Summary:</strong> {selectedSession.analysis_json.summary || 'N/A'}</p>
                {selectedSession.analysis_json.strengths && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Strengths:</strong>
                    <ul>
                      {selectedSession.analysis_json.strengths.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedSession.analysis_json.improvements && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Improvements:</strong>
                    <ul>
                      {selectedSession.analysis_json.improvements.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedSession.analysis_json.suggestions && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Suggestions:</strong>
                    <ul>
                      {selectedSession.analysis_json.suggestions.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : selectedSession.transcript ? (
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={() => handleAnalyze(selectedSession.id)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Analyze with AI
              </button>
            </div>
          ) : (
            <p style={{ marginTop: '1rem', color: '#666' }}>Transcript not available yet</p>
          )}
        </div>
      )}
    </div>
  )
}

