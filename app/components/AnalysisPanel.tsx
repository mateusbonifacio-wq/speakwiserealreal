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

interface AnalysisPanelProps {
  session: AudioSession | null
  onAnalyze: (sessionId?: string) => Promise<void>
  isAnalyzing: boolean
  pitchTranscript?: string
}

export default function AnalysisPanel({
  session,
  onAnalyze,
  isAnalyzing,
  pitchTranscript,
}: AnalysisPanelProps) {
  // Show current pitch analysis if no session but pitch transcript exists
  const displaySession = session || (pitchTranscript ? {
    id: 'current',
    user_id: '',
    type: 'pitch',
    audio_path: '',
    transcript: pitchTranscript,
    analysis_json: null,
    created_at: new Date().toISOString(),
  } as AudioSession : null)

  if (!displaySession) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Session Details</h3>
        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
          <p>Select a session or enter a pitch transcript to view details</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const analysis = displaySession.analysis_json

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Session Details</h3>

      <div className="space-y-3">
        {displaySession.id !== 'current' && (
          <>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{displaySession.type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
              <p className="text-sm text-gray-900">{formatDate(displaySession.created_at)}</p>
            </div>
          </>
        )}
      </div>

      {displaySession.transcript && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Transcript</p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-[200px] overflow-y-auto">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{displaySession.transcript}</p>
          </div>
        </div>
      )}

      {!displaySession.transcript && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">Transcript not available yet</p>
        </div>
      )}

      {displaySession.transcript && (
        <button
          onClick={() => onAnalyze(displaySession.id !== 'current' ? displaySession.id : undefined)}
          disabled={isAnalyzing}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Analyzing...
            </>
          ) : (
            '✨ Analyze with AI'
          )}
        </button>
      )}

      {analysis && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {analysis.summary && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Summary</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {analysis.scores && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Scores</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(analysis.scores).map(([key, value]: [string, any]) => (
                  <div key={key} className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-semibold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.strengths && analysis.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {analysis.strengths.map((strength: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.improvements && analysis.improvements.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Improvements</h4>
              <ul className="space-y-1">
                {analysis.improvements.map((improvement: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-orange-500 mt-1">→</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Suggestions</h4>
              <ul className="space-y-1">
                {analysis.suggestions.map((suggestion: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-indigo-500 mt-1">💡</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.improved_pitch && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Improved Pitch</h4>
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{analysis.improved_pitch}</p>
              </div>
            </div>
          )}

          {analysis.opening_options && analysis.opening_options.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Opening Options</h4>
              <ul className="space-y-1">
                {analysis.opening_options.map((option: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700">• {option}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.closing_options && analysis.closing_options.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Closing Options</h4>
              <ul className="space-y-1">
                {analysis.closing_options.map((option: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700">• {option}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.delivery_tips && analysis.delivery_tips.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Delivery Tips</h4>
              <ul className="space-y-1">
                {analysis.delivery_tips.map((tip: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">🎯</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.exercise && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Exercise</h4>
              <p className="text-sm text-gray-800">{analysis.exercise}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

