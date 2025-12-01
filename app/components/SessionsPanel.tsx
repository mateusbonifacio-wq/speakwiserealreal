'use client'

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

interface SessionsPanelProps {
  pitchSessions: AudioSession[]
  selectedSession: AudioSession | null
  onSelectSession: (session: AudioSession) => void
}

export default function SessionsPanel({
  pitchSessions,
  selectedSession,
  onSelectSession,
}: SessionsPanelProps) {
  // Calculate attempt numbers (oldest first = attempt 1, newest last = attempt N)
  const sessionsWithAttempts = pitchSessions
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((session, index) => ({
      ...session,
      attemptNumber: index + 1,
    }))
    .reverse() // Show newest first

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Past Sessions</h3>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {sessionsWithAttempts.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No pitch attempts yet</p>
        ) : (
          sessionsWithAttempts.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedSession?.id === session.id
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  🎤
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Attempt #{session.attemptNumber}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(session.created_at)}
                  </p>
                  {session.transcript && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                      {session.transcript.substring(0, 100)}...
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

