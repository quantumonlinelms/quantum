import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FaSpinner } from 'react-icons/fa'

const ProtectedRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth()

  // Show loading while checking auth - use proper loading UI
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      }}>
        <FaSpinner style={{
          fontSize: '3rem',
          color: '#ff3366',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Loading...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If loading is done but no profile, something went wrong - redirect to login
  if (!loading && !userProfile) {
    return <Navigate to="/login" replace />
  }

  // If not approved, show pending message
  if (!userProfile.approved) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <div style={{
          border: '2px solid #ffc107',
          borderRadius: '8px',
          padding: '2rem',
          backgroundColor: '#fff3cd',
        }}>
          <h2 style={{ color: '#856404', marginBottom: '1rem' }}>Enrolment Pending Approval</h2>
          <div style={{ color: '#856404' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Status: <span style={{ color: '#ff9800' }}>PENDING APPROVAL</span>
            </p>
            <p style={{ marginBottom: '1rem' }}>
              Your registration has been submitted and is currently pending administrator approval.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              An administrator will review your payment receipt and approve your enrolment. Once approved, you will be able to access the student portal and view your courses.
            </p>
            <p style={{ fontStyle: 'italic', marginTop: '1rem' }}>
              Please check back later or contact support if you have any questions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // User is approved, allow access
  return children
}

export default ProtectedRoute

