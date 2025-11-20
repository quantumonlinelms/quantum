import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { uploadToCloudflareR2, deleteFromCloudflareR2 } from '../lib/cloudflare'
import ErrorDisplay from './ErrorBoundary'

const CoursePdfManager = ({ courseId }) => {
  const [pdfs, setPdfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchPdfs()
  }, [courseId])

  const fetchPdfs = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: queryError } = await supabase
        .from('course_files')
        .select('*')
        .eq('course_id', courseId)
        .order('uploaded_at', { ascending: false })

      if (queryError) throw queryError
      setPdfs(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching PDFs:', err)
      setError({
        message: err.message || 'Failed to load PDFs. Please try again.',
        code: err.code,
      })
      setPdfs([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file')
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
      const cloudflareUrl = await uploadToCloudflareR2(file, `courses/${courseId}`)

      // Insert record into course_files table with Cloudflare URL
      const { error: insertError } = await supabase.from('course_files').insert({
        course_id: courseId,
        file_name: file.name,
        file_url: cloudflareUrl,
      })

      if (insertError) throw insertError

      fetchPdfs()
      e.target.value = '' // Reset file input
    } catch (error) {
      console.error('Error uploading PDF:', error)
      alert('Failed to upload PDF: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (pdfId, fileName) => {
    if (!confirm('Are you sure you want to delete this PDF?')) return

    try {
      // Find PDF to get Cloudflare URL
      const pdf = pdfs.find((p) => p.id === pdfId)
      
      if (pdf && pdf.file_url) {
        // Delete from Cloudflare R2
        try {
          await deleteFromCloudflareR2(pdf.file_url)
        } catch (cloudflareError) {
          console.warn('Failed to delete from Cloudflare R2 (may already be deleted):', cloudflareError)
          // Continue with database deletion even if Cloudflare delete fails
        }
      }

      // Delete record from database
      const { error } = await supabase.from('course_files').delete().eq('id', pdfId)

      if (error) throw error

      fetchPdfs()
    } catch (error) {
      console.error('Error deleting PDF:', error)
      alert('Failed to delete PDF')
    }
  }

  if (loading && pdfs.length === 0 && !error) {
    return <div>Loading PDFs...</div>
  }

  return (
    <div>
      <h3>Course PDFs</h3>
      
      {error && (
        <ErrorDisplay error={error} onRetry={fetchPdfs} loading={loading} />
      )}
      
      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <label>
          Upload PDF (Max 20MB)
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>
        {uploading && <span style={{ marginLeft: '1rem', color: '#666' }}>Uploading...</span>}
      </div>

      {pdfs.length === 0 && !error ? (
        <p>No PDFs uploaded for this course.</p>
      ) : pdfs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {pdfs.map((pdf) => (
            <div
              key={pdf.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
              }}
            >
              <div>
                <strong>{pdf.file_name}</strong>
                <small style={{ display: 'block', color: '#666', marginTop: '0.25rem' }}>
                  Uploaded: {new Date(pdf.uploaded_at).toLocaleString()}
                </small>
              </div>
              <button
                onClick={() => handleDelete(pdf.id, pdf.file_name)}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
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

export default CoursePdfManager

