import { createServiceClient } from './service'

const BUCKET_NAME = 'project-decks'

export interface UploadSlideDeckResult {
  path: string
  publicUrl: string
}

/**
 * Upload slide deck file (PDF or PPTX) to Supabase Storage
 * @param userId - The authenticated user's ID
 * @param projectId - The project ID
 * @param fileBuffer - The file as a Buffer
 * @param fileName - Original file name
 * @returns The storage path and public URL
 */
export async function uploadSlideDeckToSupabase(
  userId: string,
  projectId: string,
  fileBuffer: Buffer,
  fileName: string
): Promise<UploadSlideDeckResult> {
  const supabase = createServiceClient()
  
  // Generate unique path: userId/projectId/filename
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${userId}/${projectId}/${sanitizedFileName}`
  
  // Determine content type
  const fileExtension = fileName.split('.').pop()?.toLowerCase()
  let contentType = 'application/octet-stream'
  if (fileExtension === 'pdf') {
    contentType = 'application/pdf'
  } else if (fileExtension === 'pptx') {
    contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: true, // Allow replacing existing file
    })
  
  if (error) {
    // Provide more helpful error message for bucket not found
    if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
      throw new Error(`Bucket '${BUCKET_NAME}' not found. Please create the bucket in Supabase Storage. See SETUP-SLIDE-DECK.md for instructions.`)
    }
    throw new Error(`Failed to upload slide deck: ${error.message}`)
  }
  
  // Get public URL (though files are private by default)
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)
  
  return {
    path: filePath,
    publicUrl: urlData.publicUrl,
  }
}

/**
 * Get a signed URL for private slide deck file access
 * @param filePath - The storage path
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL
 */
export async function getSignedSlideDeckUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn)
  
  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }
  
  return data.signedUrl
}

/**
 * Delete slide deck file from storage
 */
export async function deleteSlideDeckFromSupabase(filePath: string): Promise<void> {
  const supabase = createServiceClient()
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])
  
  if (error) {
    throw new Error(`Failed to delete slide deck: ${error.message}`)
  }
}

