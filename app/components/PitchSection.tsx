'use client'

import { useState, useRef } from 'react'

interface PitchSectionProps {
  pitchTranscript: string
  onTranscriptChange: (transcript: string) => void
  onTranscribe: (audioFile: File) => Promise<string>
  isTranscribing: boolean
}

export default function PitchSection({
  pitchTranscript,
  onTranscriptChange,
  onTranscribe,
  isTranscribing,
}: PitchSectionProps) {
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
        const file = new File([blob], `pitch-${Date.now()}.webm`, { type: 'audio/webm' })
        try {
          const transcript = await onTranscribe(file)
          onTranscriptChange(transcript)
        } catch (error: any) {
          console.error('Transcription error:', error)
          // Error is already handled in handlePitchTranscribe, but ensure stream is stopped
        } finally {
          stream.getTracks().forEach(track => track.stop())
        }
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
      try {
        const transcript = await onTranscribe(file)
        onTranscriptChange(transcript)
      } catch (error: any) {
        console.error('Transcription error:', error)
        // Error is already handled in handlePitchTranscribe
      }
    }
    // Reset file input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-gray-900">Pitch Transcript</h2>
        <span className="text-red-500">*</span>
      </div>

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
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              🎤 Record Pitch
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isTranscribing}
              className="flex-1 px-4 py-2 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              📁 Upload Pitch Audio
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

      {isTranscribing && (
        <div className="flex items-center gap-2 text-indigo-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          <span className="text-sm">Transcribing pitch...</span>
        </div>
      )}

      <textarea
        value={pitchTranscript}
        onChange={(e) => onTranscriptChange(e.target.value)}
        placeholder="Paste, type, or record your pitch transcript here..."
        className="w-full min-h-[200px] p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y font-mono text-sm"
      />
    </div>
  )
}

