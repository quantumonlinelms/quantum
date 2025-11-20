import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import ErrorDisplay from './ErrorBoundary'
import { FaDownload, FaFilePdf, FaSpinner } from 'react-icons/fa'

const PdfList = ({ courseId }) => {
  const [pdfs, setPdfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    fetchPdfs()
  }, [courseId])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  const downloadPdf = async (pdf) => {
    setDownloading(pdf.id)
    try {
      // Cloudflare Images URLs are directly accessible
      // Open in new tab for viewing/downloading
      window.open(pdf.file_url, '_blank')
      // Small delay to show loading state
      setTimeout(() => setDownloading(null), 500)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF')
      setDownloading(null)
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return 'Unknown date'
    }
  }

  if (loading && pdfs.length === 0 && !error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: 'rgba(255,255,255,0.7)',
        padding: '1rem',
      }}>
        <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading materials...</span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (pdfs.length === 0 && !error) {
    return (
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '3rem 2rem',
        textAlign: 'center',
      }}>
        <FaFilePdf style={{
          fontSize: '3rem',
          color: 'rgba(255,255,255,0.2)',
          marginBottom: '1rem',
        }} />
        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '1rem',
        }}>
          No course materials available yet.
        </p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <ErrorDisplay error={error} onRetry={fetchPdfs} loading={loading} />
        </div>
      )}
      
      {pdfs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pdfs.map((pdf) => (
            <div
              key={pdf.id}
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: '1rem',
                padding: '1.25rem 1.5rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
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
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                flex: 1, 
                minWidth: 0,
                width: '100%',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255,51,102,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FaFilePdf style={{ fontSize: '1.25rem', color: '#ff3366' }} />
                </div>
                <div style={{ 
                  flex: 1, 
                  minWidth: 0,
                  width: '100%',
                  overflow: 'hidden',
                }}>
                  <div 
                    title={pdf.file_name}
                    style={{
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '1rem',
                      marginBottom: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      wordBreak: 'break-word',
                      maxWidth: '100%',
                    }}
                  >
                    {pdf.file_name}
                  </div>
                  <div style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                  }}>
                    Uploaded: {formatDate(pdf.uploaded_at)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => downloadPdf(pdf)}
                disabled={downloading === pdf.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: downloading === pdf.id ? 'rgba(255,51,102,0.5)' : '#ff3366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: downloading === pdf.id ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                  width: isMobile ? '100%' : 'auto',
                  minWidth: isMobile ? 'auto' : '140px',
                }}
                onMouseEnter={(e) => {
                  if (downloading !== pdf.id) {
                    e.currentTarget.style.backgroundColor = '#ff1a52'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (downloading !== pdf.id) {
                    e.currentTarget.style.backgroundColor = '#ff3366'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = '2px solid #ff3366'
                  e.currentTarget.style.outlineOffset = '2px'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none'
                }}
              >
                {downloading === pdf.id ? (
                  <>
                    <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ whiteSpace: 'nowrap' }}>Downloading...</span>
                  </>
                ) : (
                  <>
                    <FaDownload />
                    <span style={{ whiteSpace: 'nowrap' }}>Download</span>
                  </>
                )}
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 640px) {
          /* On mobile, allow text to wrap for better readability */
          [data-pdf-name] {
            white-space: normal !important;
            word-break: break-word !important;
            overflow: visible !important;
            text-overflow: clip !important;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            line-height: 1.4;
          }
        }
        
        @media (min-width: 641px) and (max-width: 768px) {
          /* On tablets, limit width for very long names */
          [data-pdf-name] {
            max-width: 300px;
          }
        }
      `}</style>
    </div>
  )
}

export default PdfList
