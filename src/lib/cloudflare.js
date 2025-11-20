/**
 * Cloudflare R2 Storage utility
 * 
 * Uploads files to Cloudflare R2 (S3-compatible object storage) and returns the URL.
 * R2 is better suited for PDFs and other files compared to Cloudflare Images.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const CLOUDFLARE_ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID
const CLOUDFLARE_R2_ACCESS_KEY_ID = import.meta.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = import.meta.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY
const CLOUDFLARE_R2_BUCKET_NAME = import.meta.env.VITE_CLOUDFLARE_R2_BUCKET_NAME
const CLOUDFLARE_R2_PUBLIC_URL = import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_URL // Custom domain or R2.dev subdomain

// Only warn if trying to use R2 functions without credentials
// Don't warn on module load - warn only when functions are called

// Initialize S3 client for R2 (S3-compatible)
// Only initialize if credentials are available
let s3Client = null

if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_R2_ACCESS_KEY_ID && CLOUDFLARE_R2_SECRET_ACCESS_KEY && CLOUDFLARE_R2_BUCKET_NAME) {
  const R2_ENDPOINT = `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
  
  s3Client = new S3Client({
    region: 'auto', // R2 uses 'auto' region
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // Required for R2
    requestChecksumMode: 'if-required', // Fix for readableStream.getReader error in browser
  })
}

/**
 * Upload a file to Cloudflare R2
 * @param {File} file - The file to upload
 * @param {string} folder - Optional folder/path prefix
 * @returns {Promise<string>} The R2 file URL
 */
export const uploadToCloudflareR2 = async (file, folder = '') => {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_SECRET_ACCESS_KEY || !CLOUDFLARE_R2_BUCKET_NAME) {
    console.warn('Cloudflare R2 credentials not configured. File uploads will fail.')
    throw new Error('Cloudflare R2 credentials not configured. Please add VITE_CLOUDFLARE_R2_BUCKET_NAME and VITE_CLOUDFLARE_R2_PUBLIC_URL to your .env file.')
  }

  if (!s3Client) {
    throw new Error('S3 client not initialized. Check your Cloudflare R2 credentials.')
  }

  // Generate unique file path
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop()
  const fileName = `${timestamp}_${randomId}.${fileExtension}`
  const filePath = folder ? `${folder}/${fileName}` : fileName

  try {
    // Convert File to Uint8Array for AWS SDK compatibility in browser
    // AWS SDK v3 requires Uint8Array or Blob in browser environments
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Upload to R2 using S3-compatible API
    const command = new PutObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Key: filePath,
      Body: uint8Array,
      ContentType: file.type || 'application/octet-stream',
    })

    await s3Client.send(command)

    // Return public URL
    if (CLOUDFLARE_R2_PUBLIC_URL) {
      // Custom domain or R2.dev subdomain
      const publicUrl = CLOUDFLARE_R2_PUBLIC_URL.endsWith('/') 
        ? CLOUDFLARE_R2_PUBLIC_URL + filePath
        : `${CLOUDFLARE_R2_PUBLIC_URL}/${filePath}`
      return publicUrl
    } else {
      // Fallback: construct URL (requires public bucket)
      // Format: https://pub-<hash>.r2.dev/<path>
      // Note: You need to enable public access and get the public URL from R2 dashboard
      return `https://${CLOUDFLARE_R2_BUCKET_NAME}.r2.dev/${filePath}`
    }
  } catch (error) {
    console.error('Cloudflare R2 upload error:', error)
    throw new Error(`Failed to upload to R2: ${error.message}`)
  }
}

/**
 * Delete a file from Cloudflare R2
 * @param {string} fileUrl - The R2 file URL
 * @returns {Promise<void>}
 */
export const deleteFromCloudflareR2 = async (fileUrl) => {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_SECRET_ACCESS_KEY || !CLOUDFLARE_R2_BUCKET_NAME) {
    throw new Error('Cloudflare R2 credentials not configured')
  }

  if (!s3Client) {
    throw new Error('S3 client not initialized. Check your Cloudflare R2 credentials.')
  }

  try {
    // Extract file path from URL
    let filePath = fileUrl
    if (fileUrl.includes('/')) {
      // Extract path after domain
      if (fileUrl.includes('r2.dev')) {
        const urlParts = fileUrl.split('r2.dev/')
        if (urlParts.length > 1) {
          filePath = urlParts[1]
        }
      } else if (fileUrl.includes('cloudflarestorage.com')) {
        const urlParts = fileUrl.split(`${CLOUDFLARE_R2_BUCKET_NAME}/`)
        if (urlParts.length > 1) {
          filePath = urlParts[1]
        }
      } else {
        // Custom domain - extract path
        const pathMatch = fileUrl.match(/https?:\/\/[^\/]+\/(.+)/)
        if (pathMatch) {
          filePath = pathMatch[1]
        }
      }
    }

    // Remove query parameters if any
    filePath = filePath.split('?')[0]

    const command = new DeleteObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Key: filePath,
    })

    await s3Client.send(command)
    return { success: true }
  } catch (error) {
    console.error('Cloudflare R2 delete error:', error)
    throw new Error(`Failed to delete from R2: ${error.message}`)
  }
}

// Legacy function names for backward compatibility
export const uploadToCloudflareImages = uploadToCloudflareR2
export const deleteFromCloudflareImages = deleteFromCloudflareR2
