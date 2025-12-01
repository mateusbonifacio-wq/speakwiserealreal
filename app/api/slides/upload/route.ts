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

    // 3. Validate file type
    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    const mimeType = file.type

    if (fileExtension !== 'pdf' && fileExtension !== 'pptx') {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and PPTX files are supported.' },
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

    // 6. Upload to Supabase Storage
    const uploadResult = await uploadSlideDeckToSupabase(
      user.id,
      projectId,
      fileBuffer,
      fileName
    )

    // 7. Update project with slide deck URL
    const { error: updateError } = await supabase
      .from('projects')
      .update({ slide_deck_original_url: uploadResult.path })
      .eq('id', projectId)

    if (updateError) {
      console.error('Failed to update project with slide deck URL:', updateError)
      // Continue anyway - the file is uploaded
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

