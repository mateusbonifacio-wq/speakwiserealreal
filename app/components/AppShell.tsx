'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AppShellProps {
  userEmail?: string | null
  children: ReactNode
}

export default function AppShell({ userEmail, children }: AppShellProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-500 via-purple-500 to-sky-500 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-white">
          <div>
            <h1 className="text-3xl font-bold">SpeakWise Real</h1>
            <p className="text-indigo-100 text-sm mt-1">
              AI-Powered Pitch &amp; Communication Coach
            </p>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && <span className="text-sm">{userEmail}</span>}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}

