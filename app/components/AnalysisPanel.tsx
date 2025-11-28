'use client'

import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
      >
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  )
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
          {/* New format: Greeting */}
          {analysis.greeting && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-gray-800 leading-relaxed">{analysis.greeting}</p>
            </div>
          )}

          {/* Quick Summary (new format) or Summary (old format) */}
          {(analysis.quick_summary || analysis.summary) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Summary</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{analysis.quick_summary || analysis.summary}</p>
            </div>
          )}

          {/* Scores - handle both new format (object with score/explanation) and old format (simple value) */}
          {analysis.scores && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Scores</h4>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(analysis.scores).map(([key, value]: [string, any]) => {
                  // New format: value is {score, explanation}
                  // Old format: value is just a number
                  const scoreValue = typeof value === 'object' && value !== null && 'score' in value ? value.score : value
                  const explanation = typeof value === 'object' && value !== null && 'explanation' in value ? value.explanation : null
                  
                  return (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-bold text-indigo-600">{scoreValue}/10</p>
                      </div>
                      {explanation && (
                        <p className="text-xs text-gray-600 mt-1">{explanation}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Score Comparison (new format) */}
          {analysis.score_comparison && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-900 mb-1">Progress</h4>
              <p className="text-sm text-gray-700">{analysis.score_comparison}</p>
            </div>
          )}

          {/* Context Check (new format) */}
          {analysis.context_check && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-900 mb-1">Context Check</h4>
              <p className="text-sm text-gray-700">{analysis.context_check}</p>
            </div>
          )}

          {/* Emotional & Delivery Analysis (new format) */}
          {analysis.emotional_delivery_analysis && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-900 mb-1">Delivery Analysis</h4>
              <p className="text-sm text-gray-700">{analysis.emotional_delivery_analysis}</p>
            </div>
          )}

          {/* What You Did Well (new format) or Strengths (old format) */}
          {(analysis.what_you_did_well || analysis.strengths) && (analysis.what_you_did_well?.length > 0 || analysis.strengths?.length > 0) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">What You Did Well</h4>
              <ul className="space-y-1">
                {(analysis.what_you_did_well || analysis.strengths).map((item: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What to Improve (new format) or Improvements (old format) */}
          {(analysis.what_to_improve || analysis.improvements) && (analysis.what_to_improve?.length > 0 || analysis.improvements?.length > 0) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">What to Improve</h4>
              <ul className="space-y-1">
                {(analysis.what_to_improve || analysis.improvements).map((item: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-orange-500 mt-1">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions (old format only) */}
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

          {/* Improved Pitch - Collapsible */}
          {analysis.improved_pitch && (
            <CollapsibleSection title="Improved Pitch">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{analysis.improved_pitch}</p>
              </div>
            </CollapsibleSection>
          )}

          {/* Alternative Openings - Collapsible */}
          {(analysis.alternative_openings || analysis.opening_options) && (analysis.alternative_openings?.length > 0 || analysis.opening_options?.length > 0) && (
            <CollapsibleSection title="Alternative Openings">
              <ul className="space-y-2">
                {(analysis.alternative_openings || analysis.opening_options).map((option: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 p-2 bg-gray-50 rounded border border-gray-200">
                    {option}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Alternative Closings - Collapsible */}
          {(analysis.alternative_closings || analysis.closing_options) && (analysis.alternative_closings?.length > 0 || analysis.closing_options?.length > 0) && (
            <CollapsibleSection title="Alternative Closings">
              <ul className="space-y-2">
                {(analysis.alternative_closings || analysis.closing_options).map((option: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 p-2 bg-gray-50 rounded border border-gray-200">
                    {option}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Delivery Tips - Collapsible */}
          {analysis.delivery_tips && analysis.delivery_tips.length > 0 && (
            <CollapsibleSection title="Delivery Tips">
              <ul className="space-y-1">
                {analysis.delivery_tips.map((tip: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">🎯</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Next Practice Exercise (new format) or Exercise (old format) */}
          {(analysis.next_practice_exercise || analysis.exercise) && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Next Practice Exercise</h4>
              <p className="text-sm text-gray-800">{analysis.next_practice_exercise || analysis.exercise}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

