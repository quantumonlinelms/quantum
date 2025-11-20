import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useEffect, useState, useRef, useCallback } from 'react'
import ErrorDisplay from '../components/ErrorBoundary'
import DashboardLayout from '../components/DashboardLayout'
import { FaArrowLeft, FaSpinner, FaCheckCircle, FaTimesCircle, FaFileImage } from 'react-icons/fa'

// Convert custom domain URL to R2.dev subdomain if needed
const convertToR2DevUrl = (url) => {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname
    
    // If URL already uses pub-xxxxx.r2.dev format, return as is
    if (url.includes('pub-') && url.includes('.r2.dev')) {
      return url
    }
    
    // If URL contains custom domain like quantum.r2.dev, try to convert
    if (url.includes('.r2.dev') && !url.includes('pub-')) {
      // Try to get R2.dev subdomain from environment variable
      const r2PublicUrl = import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_URL
      
      if (r2PublicUrl && r2PublicUrl.includes('pub-') && r2PublicUrl.includes('.r2.dev')) {
        // Extract subdomain from env variable
        const envUrl = new URL(r2PublicUrl)
        const subdomain = envUrl.hostname
        return `https://${subdomain}${path}`
      }
      
      // If env var not set or doesn't have pub-, try to extract from any existing receipt URL
      // This is a fallback - ideally the env var should be set correctly
      console.warn('R2.dev subdomain not found in environment. Please set VITE_CLOUDFLARE_R2_PUBLIC_URL to your pub-xxxxx.r2.dev URL')
    }
    
    return url
  } catch {
    return url
  }
}

// Component to handle receipt image loading with CORS workaround
const ReceiptImage = ({ src, onError, onLoad }) => {
  const [imageSrc, setImageSrc] = useState(src)
  const [loading, setLoading] = useState(true)
  const [triedR2Dev, setTriedR2Dev] = useState(false)

  useEffect(() => {
    // Try to fetch as blob first (sometimes works even with CORS issues)
    const loadImage = async () => {
      try {
        setLoading(true)
        let urlToTry = src
        
        // If first attempt fails and we haven't tried R2.dev URL yet, convert it
        if (!triedR2Dev) {
          const r2DevUrl = convertToR2DevUrl(src)
          if (r2DevUrl !== src) {
            urlToTry = r2DevUrl
            setTriedR2Dev(true)
          }
        }
        
        // Try fetching as blob - this sometimes bypasses CORS for images
        const response = await fetch(urlToTry, { 
          mode: 'cors',
          credentials: 'omit'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        setImageSrc(objectUrl)
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch as blob:', err)
        
        // If we haven't tried R2.dev URL yet, try it now
        if (!triedR2Dev) {
          const r2DevUrl = convertToR2DevUrl(src)
          if (r2DevUrl !== src) {
            setTriedR2Dev(true)
            setImageSrc(r2DevUrl) // Try direct image load with R2.dev URL
            setLoading(false)
            return
          }
        }
        
        // Fallback to direct image src
        setImageSrc(src)
        setLoading(false)
        
        // Check error type
        const errorMsg = err.message || err.toString() || ''
        if (errorMsg.includes('CORS') || 
            errorMsg.includes('cross-origin') || 
            errorMsg.includes('Access-Control-Allow-Origin') ||
            errorMsg.includes('blocked by CORS policy') ||
            errorMsg.includes('Failed to fetch')) {
          onError('cors')
        } else if (errorMsg.includes('404')) {
          onError('404')
        } else if (errorMsg.includes('403')) {
          onError('403')
        } else if (errorMsg.includes('500')) {
          onError('500')
        } else {
          onError('unknown')
        }
      }
    }
    
    loadImage()
    
    // Cleanup object URL on unmount
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc)
      }
    }
  }, [src, triedR2Dev])

  return (
    <img
      className="receipt-image"
      src={imageSrc}
      alt="Payment Receipt"
      style={{
        maxWidth: '100%',
        maxHeight: '80vh',
        objectFit: 'contain',
        display: loading ? 'none' : 'block',
      }}
      onError={(e) => {
        console.error('Receipt image load error:', e)
        // Try to determine error type
        const img = e.target
        if (img.complete && img.naturalWidth === 0) {
          // Image failed to load
          onError('cors') // Assume CORS if image fails to load from different origin
        }
      }}
      onLoad={() => {
        setLoading(false)
        onLoad()
      }}
    />
  )
}

const AdminEnrolments = () => {
  const { user } = useAuth()
  const [enrolments, setEnrolments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('pending') // pending, approved, declined
  const [selectedReceipt, setSelectedReceipt] = useState(null) // URL of receipt to show in modal
  const [receiptError, setReceiptError] = useState(null) // Error loading receipt
  const [errorType, setErrorType] = useState(null) // 'cors', '500', '404', etc.
  const requestIdRef = useRef(0) // Track request ID to ignore stale responses

  const fetchEnrolments = useCallback(async () => {
    // Increment request ID for this request
    const currentRequestId = ++requestIdRef.current
    
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('enrolments')
        .select(`
          *,
          users!user_id (
            id,
            full_name,
            phone
          ),
          courses (
            id,
            title
          )
        `)
        .order('submitted_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error: queryError } = await query

      // Only update state if this is still the latest request
      if (currentRequestId !== requestIdRef.current) {
        return
      }

      if (queryError) throw queryError
      setEnrolments(data || [])
      setError(null)
    } catch (err) {
      // Only update state if this is still the latest request
      if (currentRequestId !== requestIdRef.current) {
        return
      }
      console.error('Error fetching enrolments:', err)
      setError({
        message: err.message || 'Failed to load enrolments. Please try again.',
        code: err.code,
      })
      setEnrolments([])
    } finally {
      // Only update loading if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [filter])

  useEffect(() => {
    fetchEnrolments()
  }, [fetchEnrolments])

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedReceipt) {
        setSelectedReceipt(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedReceipt])

  const updateEnrolmentStatus = async (enrolmentId, status, comment = '') => {
    try {
      const { error } = await supabase
        .from('enrolments')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_comment: comment,
        })
        .eq('id', enrolmentId)

      if (error) throw error

      // If approved, also approve the user
      if (status === 'approved') {
        const enrolment = enrolments.find((e) => e.id === enrolmentId)
        if (enrolment) {
          await supabase
            .from('users')
            .update({ approved: true })
            .eq('id', enrolment.user_id)
        }
      }

      fetchEnrolments()
    } catch (error) {
      console.error('Error updating enrolment:', error)
      alert('Failed to update enrolment status')
    }
  }

  if (loading && enrolments.length === 0 && !error) {
    return (
      <DashboardLayout isAdmin>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          color: 'white',
        }}>
          <FaSpinner style={{
            fontSize: '3rem',
            color: '#ff3366',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem',
          }} />
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Loading enrolments...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout isAdmin>
      <div style={{ width: '100%', maxWidth: '100%', minHeight: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
        <Link 
          to="/admin"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(255,255,255,0.7)',
            textDecoration: 'none',
            marginBottom: '2rem',
            transition: 'color 0.2s ease',
            fontSize: '0.95rem',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ff3366'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
        >
          <FaArrowLeft />
          <span>Back to Admin Dashboard</span>
        </Link>

        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{
            color: 'white',
            fontSize: '2rem',
            fontWeight: '800',
            marginBottom: '1rem',
            margin: 0,
          }}>
            Enrolment Management
          </h1>
          
          {error && (
            <div style={{ marginBottom: '1rem' }}>
              <ErrorDisplay error={error} onRetry={fetchEnrolments} loading={loading} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('pending')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: filter === 'pending' ? '#ff3366' : 'rgba(255,255,255,0.05)',
                color: filter === 'pending' ? 'white' : 'rgba(255,255,255,0.7)',
                border: filter === 'pending' ? '1px solid #ff3366' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (filter !== 'pending') {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== 'pending') {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('approved')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: filter === 'approved' ? '#28a745' : 'rgba(255,255,255,0.05)',
                color: filter === 'approved' ? 'white' : 'rgba(255,255,255,0.7)',
                border: filter === 'approved' ? '1px solid #28a745' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (filter !== 'approved') {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== 'approved') {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('declined')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: filter === 'declined' ? '#dc3545' : 'rgba(255,255,255,0.05)',
                color: filter === 'declined' ? 'white' : 'rgba(255,255,255,0.7)',
                border: filter === 'declined' ? '1px solid #dc3545' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (filter !== 'declined') {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== 'declined') {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Declined
            </button>
          </div>
        </header>

        {enrolments.length === 0 ? (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
              No {filter} enrolments found.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {enrolments.map((enrolment) => (
              <div
                key={enrolment.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  backgroundColor: 'rgba(255,255,255,0.05)',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', margin: 0 }}>
                      {enrolment.users?.full_name}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                      Phone: {enrolment.users?.phone}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      User ID: {enrolment.user_id}
                    </p>
                    <p style={{ marginTop: '0.5rem', color: 'white', marginBottom: '0.25rem' }}>
                      <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Course:</strong> {enrolment.courses?.title}
                    </p>
                    <p style={{ marginTop: '0.25rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                      Submitted: {new Date(enrolment.submitted_at).toLocaleString()}
                    </p>
                  {enrolment.receipt_url && (
                    <button
                      onClick={async () => {
                        // Convert to R2.dev URL if it's using custom domain
                        const receiptUrl = convertToR2DevUrl(enrolment.receipt_url)
                        setSelectedReceipt(receiptUrl)
                        setReceiptError(null)
                        setErrorType(null)
                        
                        // Test if URL is accessible and check error type
                        try {
                          const response = await fetch(receiptUrl, { method: 'HEAD', mode: 'cors' })
                          if (!response.ok) {
                            setErrorType(response.status === 500 ? '500' : response.status === 404 ? '404' : response.status === 403 ? '403' : 'other')
                            setReceiptError(true)
                          }
                        } catch (err) {
                          // Check if it's a CORS error - CORS errors typically show "Failed to fetch" or "blocked by CORS policy"
                          const errorMsg = err.message || err.toString() || ''
                          if (errorMsg.includes('CORS') || 
                              errorMsg.includes('cross-origin') || 
                              errorMsg.includes('Access-Control-Allow-Origin') ||
                              errorMsg.includes('blocked by CORS policy')) {
                            setErrorType('cors')
                            setReceiptError(true)
                          } else if (errorMsg.includes('Failed to fetch')) {
                            // Could be CORS or network - check console for CORS messages
                            // If browser console shows CORS error, it's CORS
                            setErrorType('cors') // Assume CORS for "Failed to fetch" from different origin
                            setReceiptError(true)
                          } else {
                            setErrorType('unknown')
                          }
                        }
                      }}
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem 1.25rem',
                        backgroundColor: '#ff3366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ff1a52'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ff3366'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <FaFileImage />
                      <span>View Receipt</span>
                    </button>
                  )}
                  {enrolment.admin_comment && (
                    <p style={{ marginTop: '0.75rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                      Admin Comment: {enrolment.admin_comment}
                    </p>
                  )}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        backgroundColor:
                          enrolment.status === 'approved'
                            ? 'rgba(40, 167, 69, 0.2)'
                            : enrolment.status === 'declined'
                            ? 'rgba(220, 53, 69, 0.2)'
                            : 'rgba(255, 193, 7, 0.2)',
                        color:
                          enrolment.status === 'approved'
                            ? '#28a745'
                            : enrolment.status === 'declined'
                            ? '#dc3545'
                            : '#ffc107',
                        border: `1px solid ${
                          enrolment.status === 'approved'
                            ? 'rgba(40, 167, 69, 0.3)'
                            : enrolment.status === 'declined'
                            ? 'rgba(220, 53, 69, 0.3)'
                            : 'rgba(255, 193, 7, 0.3)'
                        }`,
                      }}
                    >
                      {enrolment.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                {enrolment.status === 'pending' && (
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        const comment = prompt('Add a comment (optional):')
                        updateEnrolmentStatus(enrolment.id, 'approved', comment || '')
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#218838'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#28a745'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <FaCheckCircle />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => {
                        const comment = prompt('Add a comment (optional):')
                        updateEnrolmentStatus(enrolment.id, 'declined', comment || '')
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease',
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
                      <FaTimesCircle />
                      <span>Decline</span>
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
          }}
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: '700' }}>Payment Receipt</h2>
              <button
                onClick={() => setSelectedReceipt(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.7)',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.color = '#ff3366'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                }}
              >
                ×
              </button>
            </div>
              <div
                style={{
                  padding: '1.5rem',
                  overflow: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '400px',
                  flexDirection: 'column',
                  backgroundColor: '#1a1a1a',
                }}
              >
                {receiptError ? (
                  <div
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    <p style={{ color: '#dc3545', marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      Unable to load receipt
                    </p>
                  
                    {errorType === 'cors' ? (
                      <div style={{ marginBottom: '1rem', padding: '1.5rem', backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: '8px' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#ffc107', fontSize: '1rem' }}>⚠️ CORS Error Detected</p>
                        <p style={{ marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>The request is being blocked by CORS policy.</p>
                        <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.8)' }}>Step-by-step fix:</p>
                        <ol style={{ textAlign: 'left', fontSize: '0.875rem', marginLeft: '1.5rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                          <li>Go to <strong>Cloudflare Dashboard</strong> → <strong>R2</strong> → Select your bucket</li>
                          <li>Click on <strong>Settings</strong> tab</li>
                          <li>Scroll down to <strong>"CORS Policy"</strong> section</li>
                          <li>Click <strong>"Edit CORS Policy"</strong> or <strong>"Add CORS Policy"</strong></li>
                          <li>Paste this JSON configuration:</li>
                        </ol>
                        <pre style={{ 
                          textAlign: 'left', 
                          backgroundColor: 'rgba(0,0,0,0.3)', 
                          padding: '1rem', 
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          overflow: 'auto',
                          marginTop: '0.5rem',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.8)'
                        }}>
{`[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD",
      "OPTIONS",
      "POST",
      "PUT",
      "DELETE"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type",
      "Date",
      "Last-Modified"
    ],
    "MaxAgeSeconds": 3600
  }
]`}
                      </pre>
                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.75rem' }}>
                          <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: 'rgba(255,255,255,0.8)' }}>📋 Copy this EXACT code:</p>
                        <button
                          onClick={() => {
                            const corsCode = `[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD",
      "OPTIONS",
      "POST",
      "PUT",
      "DELETE"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type",
      "Date",
      "Last-Modified"
    ],
    "MaxAgeSeconds": 3600
  }
]`
                            navigator.clipboard.writeText(corsCode).then(() => {
                              alert('✅ CORS code copied to clipboard! Paste it in R2 Settings → CORS Policy')
                            }).catch(() => {
                              alert('Could not copy. Please manually copy the code above.')
                            })
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          📋 Copy CORS Code
                        </button>
                      </div>
                      <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e7f3ff', borderRadius: '4px', fontSize: '0.875rem' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Important Notes:</p>
                        <ul style={{ textAlign: 'left', marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                          <li>Make sure you click <strong>"Save"</strong> after pasting the configuration</li>
                          <li>Wait 1-2 minutes for changes to propagate</li>
                          <li>If using a custom domain (quantum.r2.dev), CORS must be configured on the bucket, not the domain</li>
                          <li>For production, replace <code>"*"</code> with <code>["http://localhost:5173", "https://yourdomain.com"]</code></li>
                        </ul>
                      </div>
                      <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff', borderRadius: '4px', fontSize: '0.875rem', border: '1px solid #ffc107' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Still not working? Try these:</p>
                        <ol style={{ textAlign: 'left', marginLeft: '1.5rem', marginBottom: '1rem' }}>
                          <li><strong>Verify Public Access:</strong> Go to Settings → Public Access → Make sure it's enabled</li>
                          <li><strong>Get R2.dev Subdomain:</strong> In Settings → Public Access, copy the R2.dev URL (format: <code>https://pub-xxxxx.r2.dev</code>)</li>
                          <li><strong>Update .env file:</strong> Change <code>VITE_CLOUDFLARE_R2_PUBLIC_URL</code> to use the R2.dev subdomain instead of custom domain</li>
                          <li><strong>Restart dev server:</strong> Stop and restart <code>npm run dev</code></li>
                          <li><strong>Test in new tab:</strong> Try opening the receipt URL directly in a new browser tab</li>
                        </ol>
                        <button
                          onClick={async () => {
                            try {
                              const testResponse = await fetch(selectedReceipt, { 
                                method: 'HEAD', 
                                mode: 'cors' 
                              })
                              if (testResponse.ok) {
                                alert('✅ CORS is working! The issue might be with image loading. Try refreshing.')
                              } else {
                                alert(`❌ Still getting error: HTTP ${testResponse.status}`)
                              }
                            } catch (err) {
                              if (err.message.includes('CORS') || err.message.includes('Failed to fetch')) {
                                alert('❌ CORS is still blocking. Make sure:\n1. CORS policy is saved in R2\n2. Public access is enabled\n3. Wait 2 minutes after saving')
                              } else {
                                alert(`❌ Error: ${err.message}`)
                              }
                            }
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Test CORS Configuration
                        </button>
                      </div>
                    </div>
                  ) : errorType === '500' ? (
                    <div style={{ marginBottom: '1rem', padding: '1.5rem', backgroundColor: 'rgba(220, 53, 69, 0.1)', border: '1px solid rgba(220, 53, 69, 0.3)', borderRadius: '8px' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#dc3545' }}>500 Internal Server Error</p>
                      <p style={{ marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>This is NOT a CORS issue. The server is returning an error.</p>
                      <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>Possible causes:</p>
                      <ul style={{ textAlign: 'left', fontSize: '0.875rem', marginLeft: '1.5rem', color: 'rgba(255,255,255,0.7)' }}>
                        <li>R2 bucket not configured for public access</li>
                        <li>Custom domain (quantum.r2.dev) not properly connected to the bucket</li>
                        <li>File path is incorrect</li>
                        <li>Bucket permissions issue</li>
                      </ul>
                    </div>
                  ) : errorType === '404' ? (
                    <div style={{ marginBottom: '1rem', padding: '1.5rem', backgroundColor: 'rgba(220, 53, 69, 0.1)', border: '1px solid rgba(220, 53, 69, 0.3)', borderRadius: '8px' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#dc3545' }}>404 Not Found</p>
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>The file does not exist at this URL. It may have been deleted or the path is incorrect.</p>
                    </div>
                  ) : errorType === '403' ? (
                    <div style={{ marginBottom: '1rem', padding: '1.5rem', backgroundColor: 'rgba(220, 53, 69, 0.1)', border: '1px solid rgba(220, 53, 69, 0.3)', borderRadius: '8px' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#dc3545' }}>403 Forbidden</p>
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Access denied. The bucket may not be configured for public access.</p>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '1rem', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                      <p style={{ marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>The receipt file could not be loaded. This may be due to:</p>
                      <ul style={{ textAlign: 'left', marginBottom: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                        <li>R2 bucket not configured for public access</li>
                        <li>Custom domain not properly configured</li>
                        <li>CORS settings blocking the request</li>
                        <li>File may have been deleted</li>
                      </ul>
                    </div>
                  )}
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <a
                      href={selectedReceipt}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#ff3366',
                        textDecoration: 'none',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'rgba(255,51,102,0.1)',
                        border: '1px solid rgba(255,51,102,0.3)',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,51,102,0.2)'
                        e.currentTarget.style.borderColor = '#ff3366'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,51,102,0.1)'
                        e.currentTarget.style.borderColor = 'rgba(255,51,102,0.3)'
                      }}
                    >
                      Try opening in new tab
                    </a>
                    <button
                      onClick={() => {
                        setReceiptError(null)
                        setErrorType(null)
                        // Force reload by changing src
                        const img = document.querySelector('.receipt-image')
                        if (img) {
                          img.src = selectedReceipt + '?t=' + Date.now()
                        }
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Retry
                    </button>
                  </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all' }}>
                      URL: {selectedReceipt}
                    </p>
                  </div>
                ) : selectedReceipt.match(/\.(pdf)$/i) ? (
                  <iframe
                    src={selectedReceipt}
                    style={{
                      width: '100%',
                      minHeight: '600px',
                      border: 'none',
                      backgroundColor: '#1a1a1a',
                    }}
                    title="Payment Receipt"
                    onError={() => setReceiptError(true)}
                  />
                ) : (
                  <ReceiptImage 
                    src={selectedReceipt}
                    onError={(errorType) => {
                      setErrorType(errorType)
                      setReceiptError(true)
                    }}
                    onLoad={() => {
                      setReceiptError(null)
                      setErrorType(null)
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminEnrolments

