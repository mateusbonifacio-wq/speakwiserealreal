import { createClient } from './server'
import { Database } from './database.types'

export type Project = Database['public']['Tables']['projects']['Row']

/**
 * Fetch all projects for the authenticated user
 */
export async function getUserProjects(): Promise<Project[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load projects: ${error.message}`)
  }

  return data || []
}

/**
 * Fetch a single project by id for the authenticated user
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to load project: ${error.message}`)
  }

  return data
}

/**
 * Update project context fields
 */
export async function updateProjectContext(
  projectId: string,
  context: {
    default_audience?: string
    default_goal?: string
    default_duration?: string
    default_scenario?: string
    english_level?: string
    tone_style?: string
    constraints?: string
    additional_notes?: string
    context_transcript?: string
    transcription_language?: string
  }
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('projects')
    .update(context)
    .eq('id', projectId)

  if (error) {
    throw new Error(`Failed to update project context: ${error.message}`)
  }
}

