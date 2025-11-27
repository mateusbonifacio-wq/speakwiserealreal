import { createServiceClient } from './service'

const BUCKET_NAME = 'audio-recordings'

export interface UploadAudioResult {
  path: string
  publicUrl: string
}

/**
 * Upload audio file to Supabase Storage
 * @param userId - The authenticated user's ID
 * @param audioFile - The audio file as a Buffer or Blob
 * @param audioSessionId - The audio session ID for organizing files
 * @param fileExtension - File extension (e.g., 'mp3', 'wav')
 * @returns The storage path and public URL
 */
export async function uploadAudioToSupabase(
  userId: string,
  audioFile: Buffer | Blob,
  audioSessionId: string,
  fileExtension: string = 'mp3'
): Promise<UploadAudioResult> {
  const supabase = createServiceClient()
  
  // Generate unique path: userId/audioSessionId/original.{ext}
  const filePath = `${userId}/${audioSessionId}/original.${fileExtension}`
  
  // Convert Blob to Buffer if needed
  let buffer: Buffer
  if (audioFile instanceof Blob) {
    const arrayBuffer = await audioFile.arrayBuffer()
    buffer = Buffer.from(arrayBuffer)
  } else {
    buffer = audioFile
  }
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: `audio/${fileExtension === 'mp3' ? 'mpeg' : fileExtension}`,
      upsert: false,
    })
  
  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`)
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
 * Get a signed URL for private audio file access
 * @param filePath - The storage path
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL
 */
export async function getSignedAudioUrl(
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

