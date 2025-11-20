import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { uploadToCloudflareR2, deleteFromCloudflareR2 } from '../lib/cloudflare'
import ErrorDisplay from './ErrorBoundary'

const LessonFileManager = ({ lessonId }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    fetchFiles()
  }, [lessonId])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchFiles = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }
    setError(null)
    
    try {
      const { data, error: queryError } = await supabase
        .from('lesson_files')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('uploaded_at', { ascending: false })

      if (queryError) throw queryError
      setFiles(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching files:', err)
      setError({
        message: err.message || 'Failed to load files. Please try again.',
        code: err.code,
      })
      setFiles([])
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type - allow PDFs and other common file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ]

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, Word document, Excel file, image, or text file')
      return
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      alert('File size must be less than 20MB')
      return
    }

    setUploading(true)

    try {
      // Upload to Cloudflare R2
      const cloudflareUrl = await uploadToCloudflareR2(file, `lessons/${lessonId}`)

      // Insert record into lesson_files table with Cloudflare URL
      const { error: insertError } = await supabase.from('lesson_files').insert({
        lesson_id: lessonId,
        file_name: file.name,
        file_url: cloudflareUrl,
        file_type: file.type,
      })

      if (insertError) throw insertError

      fetchFiles(false) // Don't show loading spinner on refresh
      e.target.value = '' // Reset file input
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fileId, fileName) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      // Find file to get Cloudflare URL
      const file = files.find((f) => f.id === fileId)
      
      if (file && file.file_url) {
        // Delete from Cloudflare R2
        try {
          await deleteFromCloudflareR2(file.file_url)
        } catch (cloudflareError) {
          console.warn('Failed to delete from Cloudflare R2 (may already be deleted):', cloudflareError)
          // Continue with database deletion even if Cloudflare delete fails
        }
      }

      // Delete record from database
      const { error } = await supabase.from('lesson_files').delete().eq('id', fileId)

      if (error) throw error

      fetchFiles(false) // Don't show loading spinner on refresh
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Failed to delete file')
    }
  }

  if (loading && files.length === 0 && !error) {
    return null // Don't show loading for empty state
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <h3 style={{ 
        color: 'white', 
        fontSize: '1.25rem', 
        fontWeight: '700', 
        marginBottom: '1rem',
        margin: 0 
      }}>
        Lesson Files
      </h3>
      
      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <ErrorDisplay error={error} onRetry={fetchFiles} loading={loading} />
        </div>
      )}
      
      <div style={{ 
        marginTop: '1rem', 
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}>
        <label style={{ 
          display: 'block', 
          color: 'rgba(255,255,255,0.8)', 
          marginBottom: '0.75rem', 
          fontSize: '0.95rem',
          fontWeight: '600',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}>
          Upload File (PDF, Word, Excel, Image, or Text - Max 20MB)
        </label>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: '0.75rem',
          alignItems: isMobile ? 'stretch' : 'center',
          width: '100%',
          maxWidth: '100%',
        }}>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ 
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'white',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              cursor: uploading ? 'not-allowed' : 'pointer',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          />
          {uploading && (
            <span style={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: '0.9rem',
              whiteSpace: isMobile ? 'normal' : 'nowrap',
              textAlign: isMobile ? 'center' : 'left',
              wordBreak: 'break-word',
            }}>
              Uploading...
            </span>
          )}
        </div>
      </div>

      {files.length === 0 && !error ? (
        <p style={{ 
          color: 'rgba(255,255,255,0.6)', 
          fontSize: '0.95rem',
          margin: 0,
        }}>
          No files uploaded for this lesson.
        </p>
      ) : files.length > 0 ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem',
          width: '100%',
          maxWidth: '100%',
        }}>
          {files.map((file) => (
            <div
              key={file.id}
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: '1rem',
                padding: '1rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                transition: 'all 0.3s ease',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ 
                flex: 1, 
                minWidth: 0,
                overflow: 'hidden',
                wordBreak: 'break-word',
              }}>
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#ff3366',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    display: 'block',
                    marginBottom: '0.25rem',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ff1a52'
                    e.currentTarget.style.textDecoration = 'underline'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#ff3366'
                    e.currentTarget.style.textDecoration = 'none'
                  }}
                >
                  {file.file_name}
                </a>
                {file.file_type && (
                  <span style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    fontSize: '0.875rem',
                    wordBreak: 'break-word',
                  }}>
                    {file.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(file.id, file.file_name)}
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                  width: isMobile ? '100%' : 'auto',
                  minWidth: isMobile ? 'auto' : '100px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c82333'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc3545'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default LessonFileManager


