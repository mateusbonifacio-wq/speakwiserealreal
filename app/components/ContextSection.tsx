'use client'

import { useState, useRef } from 'react'

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
  transcription_language: string
}

interface ContextSectionProps {
  contextFields: ContextFields
  onContextChange: (fields: Partial<ContextFields>) => void
  onTranscribe: (audioFile: File) => Promise<string>
  isTranscribing: boolean
  onSave: () => Promise<void>
  isSaving?: boolean
}

export default function ContextSection({
  contextFields,
  onContextChange,
  onTranscribe,
  isTranscribing,
  onSave,
  isSaving = false,
}: ContextSectionProps) {
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `context-${Date.now()}.webm`, { type: 'audio/webm' })
        const transcript = await onTranscribe(file)
        onContextChange({ context_transcript: transcript })
        stream.getTracks().forEach(track => track.stop())
        // Auto-save after transcribing
        await onSave()
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const transcript = await onTranscribe(file)
      onContextChange({ context_transcript: transcript })
      // Auto-save after transcribing
      await onSave()
    }
  }

  return (
    <div className="space-y-4 bg-gray-50 p-6 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Project Context</h2>
          <p className="text-sm text-gray-600">Set context once for this project. It will be used for all pitch attempts.</p>
        </div>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isSaving ? 'Saving...' : 'Save Context'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          {recording ? (
            <button
              onClick={stopRecording}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
              Stop Recording
            </button>
          ) : (
            <>
              <button
                onClick={startRecording}
                disabled={isTranscribing}
                className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                🎤 Record Context
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isTranscribing}
                className="flex-1 px-4 py-2 border-2 border-purple-300 hover:border-purple-400 text-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                📁 Upload Context Audio
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Record or upload audio describing your pitch context (audience, goal, duration, scenario, etc.).
        </p>
      </div>

      {contextFields.context_transcript && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs font-medium text-purple-900 mb-1">Context Transcript:</p>
          <p className="text-sm text-purple-800">{contextFields.context_transcript}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Idioma da Transcrição</label>
          <select
            value={contextFields.transcription_language || 'por'}
            onChange={(e) => onContextChange({ transcription_language: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="por">Português</option>
            <option value="eng">English</option>
            <option value="spa">Español</option>
            <option value="fra">Français</option>
            <option value="deu">Deutsch</option>
            <option value="ita">Italiano</option>
            <option value="">Auto-detect (Recomendado)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Selecione o idioma que você vai falar no pitch</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
          <input
            type="text"
            value={contextFields.audience}
            onChange={(e) => onContextChange({ audience: e.target.value })}
            placeholder="e.g., Investors, Customers, Team"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
          <input
            type="text"
            value={contextFields.goal}
            onChange={(e) => onContextChange({ goal: e.target.value })}
            placeholder="e.g., Secure funding, Sell product"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <input
            type="text"
            value={contextFields.duration}
            onChange={(e) => onContextChange({ duration: e.target.value })}
            placeholder="e.g., 5 minutes, 30 seconds"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scenario</label>
          <input
            type="text"
            value={contextFields.scenario}
            onChange={(e) => onContextChange({ scenario: e.target.value })}
            placeholder="e.g., Demo day, Sales call"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">English Level</label>
          <select
            value={contextFields.english_level}
            onChange={(e) => onContextChange({ english_level: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Fluent">Fluent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tone/Style</label>
          <select
            value={contextFields.tone_style}
            onChange={(e) => onContextChange({ tone_style: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select tone</option>
            <option value="Confident">Confident</option>
            <option value="Friendly">Friendly</option>
            <option value="Inspiring">Inspiring</option>
            <option value="Professional">Professional</option>
            <option value="Casual">Casual</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Constraints</label>
        <input
          type="text"
          value={contextFields.constraints}
          onChange={(e) => onContextChange({ constraints: e.target.value })}
          placeholder="e.g., No slides, Time limit, Language barrier"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
        <textarea
          value={contextFields.additional_notes}
          onChange={(e) => onContextChange({ additional_notes: e.target.value })}
          placeholder="Any additional context or notes..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-y"
        />
      </div>
    </div>
  )
}

