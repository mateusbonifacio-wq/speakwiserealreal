import { createClient } from './server'
import { Database } from './database.types'

export type ProjectSlide = Database['public']['Tables']['project_slides']['Row']

/**
 * Get all slides for a project
 */
export async function getProjectSlides(projectId: string): Promise<ProjectSlide[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('project_slides')
    .select('*')
    .eq('project_id', projectId)
    .order('index', { ascending: true })

  if (error) {
    throw new Error(`Failed to load project slides: ${error.message}`)
  }

  return data || []
}

/**
 * Create or update slides for a project
 * Deletes existing slides and creates new ones
 */
export async function upsertProjectSlides(
  projectId: string,
  slides: Array<{
    index: number
    title?: string | null
    content?: string | null
    thumbnail_url?: string | null
  }>
): Promise<void> {
  const supabase = await createClient()

  // Delete existing slides for this project
  const { error: deleteError } = await supabase
    .from('project_slides')
    .delete()
    .eq('project_id', projectId)

  if (deleteError) {
    throw new Error(`Failed to delete existing slides: ${deleteError.message}`)
  }

  // Insert new slides
  if (slides.length > 0) {
    const { error: insertError } = await supabase
      .from('project_slides')
      .insert(
        slides.map(slide => ({
          project_id: projectId,
          index: slide.index,
          title: slide.title || null,
          content: slide.content || null,
          thumbnail_url: slide.thumbnail_url || null,
        }))
      )

    if (insertError) {
      throw new Error(`Failed to insert slides: ${insertError.message}`)
    }
  }
}

/**
 * Delete all slides for a project
 */
export async function deleteProjectSlides(projectId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('project_slides')
    .delete()
    .eq('project_id', projectId)

  if (error) {
    throw new Error(`Failed to delete project slides: ${error.message}`)
  }
}

