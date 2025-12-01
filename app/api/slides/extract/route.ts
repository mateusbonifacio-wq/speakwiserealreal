import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/supabase/server'
import { extractSlides } from '@/lib/slides/extract'
import { upsertProjectSlides } from '@/lib/supabase/project-slides'
import { getSignedSlideDeckUrl } from '@/lib/supabase/slide-storage'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { project_id, file_path, file_name, mime_type } = body

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    if (!file_path) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // 3. Verify project ownership
    const supabase = await createClient()
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, slide_deck_original_url')
      .eq('id', project_id)
      .single()

    if (projectError || !project || project.user_id !== user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 4. Get signed URL to download the file
    const signedUrl = await getSignedSlideDeckUrl(file_path, 3600) // 1 hour expiry

    // 5. Download the file
    const fileResponse = await fetch(signedUrl)
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`)
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer())

    // 6. Extract slides
    const extractedSlides = await extractSlides(
      fileBuffer,
      mime_type || 'application/pdf',
      file_name || 'deck.pdf'
    )

    console.log(`[Slides] Extracted ${extractedSlides.length} slides from ${file_name}`)

    // 7. Save slides to database
    await upsertProjectSlides(project_id, extractedSlides)

    // 8. Return extracted slides
    return NextResponse.json({
      success: true,
      slides: extractedSlides,
      slide_count: extractedSlides.length,
    })
  } catch (error: any) {
    console.error('Slide extraction error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

