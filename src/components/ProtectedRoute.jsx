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

  // If not approved, redirect to login (LoginPage will show pending message)
  if (!userProfile.approved) {
    return <Navigate to="/login" replace />
  }

  // User is approved, allow access
  return children
}

export default ProtectedRoute

