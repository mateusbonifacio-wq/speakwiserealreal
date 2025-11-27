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

