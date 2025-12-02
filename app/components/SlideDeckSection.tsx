'use client'

import { useState, useRef } from 'react'

interface SlideDeckSectionProps {
  projectId: string
  slideDeckUrl: string | null
  onUploadComplete: () => void
}

export default function SlideDeckSection({
  projectId,
  slideDeckUrl,
  onUploadComplete,
}: SlideDeckSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (fileExtension !== 'pdf' && fileExtension !== 'pptx') {
      alert('Por favor, selecione um arquivo PDF ou PPTX.')
      return
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Arquivo muito grande. Tamanho máximo: 50MB')
      return
    }

    setUploading(true)
    setUploadStatus('Enviando arquivo...')

    try {
      // 1. Upload file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('project_id', projectId)

      const uploadResponse = await fetch('/api/slides/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        const errorMessage = error.error || 'Upload failed'
        // Provide more helpful message for bucket not found
        if (errorMessage.includes('Bucket not found') || errorMessage.includes('not found') || errorMessage.includes('Bucket')) {
          throw new Error('Bucket not found - O bucket de storage não foi encontrado. Por favor, crie o bucket "project-decks" no Supabase Storage. Veja CRIAR-BUCKET-SLIDES.md para instruções.')
        }
        throw new Error(errorMessage)
      }

      const uploadData = await uploadResponse.json()
      setUploadStatus('Extraindo slides...')
      setExtracting(true)

      // 2. Extract slides
      const extractResponse = await fetch('/api/slides/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          file_path: uploadData.file_path,
          file_name: uploadData.file_name,
          mime_type: file.type,
        }),
      })

      if (!extractResponse.ok) {
        const error = await extractResponse.json()
        throw new Error(error.error || 'Extraction failed')
      }

      const extractData = await extractResponse.json()
      setUploadStatus(`✅ ${extractData.slide_count} slides extraídos com sucesso!`)
      
      // Notify parent to reload slides
      onUploadComplete()
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Erro: ${error.message}`)
      setUploadStatus(null)
    } finally {
      setUploading(false)
      setExtracting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-4 bg-gray-50 p-6 rounded-xl">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Pitch Deck (opcional)</h2>
        <p className="text-sm text-gray-600">
          Faça upload de um arquivo PDF ou PowerPoint para que o SpeakWise Real entenda melhor seu pitch deck.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || extracting}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading || extracting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              {extracting ? 'Extraindo...' : 'Enviando...'}
            </>
          ) : (
            <>
              📄 Upload Slide Deck
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {uploadStatus && (
        <div className={`p-3 rounded-lg text-sm ${
          uploadStatus.startsWith('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {uploadStatus}
        </div>
      )}

      {slideDeckUrl && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs font-medium text-purple-900 mb-1">Slide deck carregado</p>
          <p className="text-sm text-purple-800">
            Seu feedback de pitch considerará este deck.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Formatos suportados: PDF (.pdf) e PowerPoint (.pptx). Tamanho máximo: 50MB.
      </p>

      {/* Warning if bucket not configured */}
      {uploadStatus && uploadStatus.includes('Bucket not found') && (
        <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <h4 className="text-sm font-semibold text-red-900 mb-2">⚠️ Configuração Necessária</h4>
          <p className="text-sm text-red-800 mb-3">
            O bucket de storage não foi configurado ainda. Você precisa criar o bucket <code className="bg-red-100 px-1 rounded">project-decks</code> no Supabase Storage.
          </p>
          <div className="space-y-2 text-sm text-red-700">
            <p className="font-medium">Opção 1: Script Automático (Recomendado)</p>
            <code className="block bg-red-100 p-2 rounded text-xs">
              node create-slide-deck-bucket.js
            </code>
            <p className="font-medium mt-3">Opção 2: Manual</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Acesse: <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a> → Storage</li>
              <li>Clique em "New bucket"</li>
              <li>Nome: <code className="bg-red-100 px-1 rounded">project-decks</code></li>
              <li>Desmarque "Public bucket" (deixe privado)</li>
              <li>Clique em "Create bucket"</li>
            </ol>
            <p className="mt-3 text-xs">
              📖 Veja o guia completo: <code className="bg-red-100 px-1 rounded">CRIAR-BUCKET-SLIDES.md</code>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

