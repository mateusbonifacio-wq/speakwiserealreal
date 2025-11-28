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

interface ProgressPanelProps {
  pitchSessions: AudioSession[]
}

export default function ProgressPanel({ pitchSessions }: ProgressPanelProps) {
  // Filter to only analyzed pitch sessions, sorted by created_at ascending
  const analyzedSessions = pitchSessions
    .filter(session => session.analysis_json && session.type === 'pitch')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-5) // Last 5 attempts

  if (analyzedSessions.length === 0) {
    return (
      <div className="rounded-xl border bg-white/60 px-4 py-3 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 mb-1">Progress over attempts</h4>
        <p className="text-xs text-slate-500 mb-3">How your scores are evolving for this project.</p>
        <p className="text-sm text-gray-500 text-center py-4">
          No analyzed attempts yet. Complete your first pitch analysis to see progress!
        </p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  const extractScore = (scores: any, key: string): number | undefined => {
    if (!scores || !scores[key]) return undefined
    const value = scores[key]
    // Handle both new format (object with score) and old format (number)
    if (typeof value === 'object' && value !== null && 'score' in value) {
      return value.score
    } else if (typeof value === 'number') {
      return value
    }
    return undefined
  }

  const getScoreChange = (current: number | undefined, previous: number | undefined): 'up' | 'down' | 'same' | null => {
    if (current === undefined || previous === undefined) return null
    if (current > previous) return 'up'
    if (current < previous) return 'down'
    return 'same'
  }

  return (
    <div className="rounded-xl border bg-white/60 px-4 py-3 shadow-sm">
      <h4 className="text-lg font-semibold text-gray-900 mb-1">Progress over attempts</h4>
      <p className="text-xs text-slate-500 mb-4">How your scores are evolving for this project.</p>

      <div className="space-y-4">
        {analyzedSessions.map((session, index) => {
          const scores = session.analysis_json?.scores
          const previousScores = index > 0 ? analyzedSessions[index - 1].analysis_json?.scores : null

          const clarity = extractScore(scores, 'clarity')
          const structureFlow = extractScore(scores, 'structure_flow')
          const persuasiveness = extractScore(scores, 'persuasiveness')
          const storytelling = extractScore(scores, 'storytelling')
          const conciseness = extractScore(scores, 'conciseness')
          const fitForAudience = extractScore(scores, 'fit_for_audience')
          const deliveryEnergy = extractScore(scores, 'delivery_energy')

          const prevClarity = previousScores ? extractScore(previousScores, 'clarity') : undefined
          const prevStructureFlow = previousScores ? extractScore(previousScores, 'structure_flow') : undefined
          const prevPersuasiveness = previousScores ? extractScore(previousScores, 'persuasiveness') : undefined

          return (
            <div key={session.id} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">
                  Attempt {analyzedSessions.length - index} – {formatDate(session.created_at)}
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                {clarity !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Clarity:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{clarity}/10</span>
                      {prevClarity !== undefined && (
                        <span className="text-xs">
                          {getScoreChange(clarity, prevClarity) === 'up' && '↑'}
                          {getScoreChange(clarity, prevClarity) === 'down' && '↓'}
                          {getScoreChange(clarity, prevClarity) === 'same' && '→'}
                          {getScoreChange(clarity, prevClarity) !== null && ` from ${prevClarity}`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {structureFlow !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Structure:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{structureFlow}/10</span>
                      {prevStructureFlow !== undefined && (
                        <span className="text-xs">
                          {getScoreChange(structureFlow, prevStructureFlow) === 'up' && '↑'}
                          {getScoreChange(structureFlow, prevStructureFlow) === 'down' && '↓'}
                          {getScoreChange(structureFlow, prevStructureFlow) === 'same' && '→'}
                          {getScoreChange(structureFlow, prevStructureFlow) !== null && ` from ${prevStructureFlow}`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {persuasiveness !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Persuasiveness:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{persuasiveness}/10</span>
                      {prevPersuasiveness !== undefined && (
                        <span className="text-xs">
                          {getScoreChange(persuasiveness, prevPersuasiveness) === 'up' && '↑'}
                          {getScoreChange(persuasiveness, prevPersuasiveness) === 'down' && '↓'}
                          {getScoreChange(persuasiveness, prevPersuasiveness) === 'same' && '→'}
                          {getScoreChange(persuasiveness, prevPersuasiveness) !== null && ` from ${prevPersuasiveness}`}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

