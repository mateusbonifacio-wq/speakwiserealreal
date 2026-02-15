'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    document.title = 'Acesso por código — SpeakWise Pitch Coach'
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'Código inválido.')
      }

      router.push('/projects')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro.')
    } finally {
      setLoading(false)
    }
  }

  const digitsOnly = (v: string) => v.replace(/\D/g, '').slice(0, 6)

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1 style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.35rem' }}>
          SpeakWise Pitch Coach
        </h1>
        <p style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#666', fontSize: '0.95rem' }}>
          Acesso apenas por código — introduza os 6 dígitos
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="code" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Código (6 dígitos)
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(digitsOnly(e.target.value))}
              maxLength={6}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1.5rem',
                letterSpacing: '0.5em',
                textAlign: 'center',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '4px',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: code.length === 6 ? '#0070f3' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'A verificar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
