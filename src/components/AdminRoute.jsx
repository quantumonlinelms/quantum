import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading, userProfile } = useAuth()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Only show content after loading is complete
    if (!loading) {
      // Small delay to ensure state is stable
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [loading])

  // Show loading while checking auth
  if (loading || !showContent) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If loading is done but no profile, something went wrong - redirect to login
  if (!loading && !userProfile) {
    return <Navigate to="/login" replace />
  }

  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  // User is admin, allow access
  return children
}

export default AdminRoute

