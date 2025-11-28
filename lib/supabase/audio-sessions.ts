import { createClient } from './server'
import { createServiceClient } from './service'

export interface AudioSession {
  id: string
  user_id: string
  project_id: string | null
  type: string
  audio_path: string
  transcript: string | null
  analysis_json: any | null
  created_at: string
}

/**
 * Create a new audio session record
 */
export async function createAudioSession(
  userId: string,
  type: 'pitch' | 'context',
  audioPath: string,
  projectId?: string | null
): Promise<AudioSession> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('audio_sessions')
    .insert({
      user_id: userId,
      project_id: projectId ?? null,
      type,
      audio_path: audioPath,
      transcript: null,
      analysis_json: null,
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create audio session: ${error.message}`)
  }
  
  return data
}

/**
 * Get audio session by ID (for authenticated user)
 */
export async function getAudioSession(
  sessionId: string
): Promise<AudioSession | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('audio_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to get audio session: ${error.message}`)
  }
  
  return data
}

/**
 * Get all audio sessions for the current user
 */
export async function getUserAudioSessions(
  type?: 'pitch' | 'context',
  projectId?: string
): Promise<AudioSession[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('audio_sessions')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (type) {
    query = query.eq('type', type)
  }
  
  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to get audio sessions: ${error.message}`)
  }
  
  return data || []
}

/**
 * Update audio session transcript
 */
export async function updateAudioSessionTranscript(
  sessionId: string,
  transcript: string
): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('audio_sessions')
    .update({ transcript })
    .eq('id', sessionId)
  
  if (error) {
    throw new Error(`Failed to update transcript: ${error.message}`)
  }
}

/**
 * Update audio session analysis
 */
export async function updateAudioSessionAnalysis(
  sessionId: string,
  analysisJson: any
): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('audio_sessions')
    .update({ analysis_json: analysisJson })
    .eq('id', sessionId)
  
  if (error) {
    throw new Error(`Failed to update analysis: ${error.message}`)
  }
}

/**
 * Get previous analyzed pitch sessions for a project (excluding current session)
 * Returns up to 3 most recent analyzed sessions, ordered by created_at ascending
 */
export async function getPreviousAnalyzedPitchSessions(
  projectId: string,
  excludeSessionId?: string,
  limit: number = 3
): Promise<AudioSession[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('audio_sessions')
    .select('*')
    .eq('project_id', projectId)
    .eq('type', 'pitch')
    .not('analysis_json', 'is', null)
    .order('created_at', { ascending: true })
  
  if (excludeSessionId) {
    query = query.neq('id', excludeSessionId)
  }
  
  const { data, error } = await query.limit(limit)
  
  if (error) {
    throw new Error(`Failed to get previous analyzed sessions: ${error.message}`)
  }
  
  return data || []
}

