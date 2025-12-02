import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/supabase/server'
import { uploadSlideDeckToSupabase } from '@/lib/supabase/slide-storage'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('project_id') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // 3. Validate file type - PDF only
    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    const mimeType = file.type

    if (fileExtension !== 'pdf' || mimeType !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are supported.' },
        { status: 400 }
      )
    }

    // 4. Verify project ownership
    const supabase = await createClient()
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project || project.user_id !== user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 5. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // 6. Upload to Supabase Storage (always save as deck.pdf)
    let uploadResult
    try {
      uploadResult = await uploadSlideDeckToSupabase(
        user.id,
        projectId,
        fileBuffer,
        'deck.pdf' // Always use same filename for consistency
      )
    } catch (uploadError: any) {
      if (uploadError.message?.includes('Bucket not found')) {
        return NextResponse.json(
          { 
            error: 'Storage bucket not configured. Please create the "project-decks" bucket in Supabase Storage. See SETUP-SLIDE-DECK.md for instructions.',
            setup_required: true
          },
          { status: 500 }
        )
      }
      throw uploadError
    }

    // 7. Update project with slide deck URL (if column exists)
    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ slide_deck_original_url: uploadResult.path })
        .eq('id', projectId)

      if (updateError) {
        // If column doesn't exist, log but don't fail - user needs to run migration
        if (updateError.code === 'PGRST204' || updateError.message?.includes('column') || updateError.message?.includes('schema cache')) {
          console.warn('[Upload] Column slide_deck_original_url not found. Please run supabase/add-slides-support.sql migration.')
        } else {
          console.error('Failed to update project with slide deck URL:', updateError)
        }
        // Continue anyway - the file is uploaded successfully
      }
    } catch (updateErr: any) {
      // Silently continue - file upload was successful
      console.warn('[Upload] Could not update project URL (migration may be needed):', updateErr.message)
    }

    // 8. Return response with file info
    return NextResponse.json({
      success: true,
      file_path: uploadResult.path,
      file_name: fileName,
      file_size: fileBuffer.length,
      project_id: projectId,
    })
  } catch (error: any) {
    console.error('Slide deck upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

