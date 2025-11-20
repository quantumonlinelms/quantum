import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'
import CoursePage from './pages/CoursePage'
import LessonPage from './pages/LessonPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminEnrolments from './pages/AdminEnrolments'
import AdminCourseManager from './pages/AdminCourseManager'
import AdminTitlesManager from './pages/AdminTitlesManager'
import AdminLessonManager from './pages/AdminLessonManager'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/course/:courseId"
            element={
              <ProtectedRoute>
                <CoursePage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/course/:courseId/lesson/:lessonId"
            element={
              <ProtectedRoute>
                <LessonPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          
          <Route
            path="/admin/enrolments"
            element={
              <AdminRoute>
                <AdminEnrolments />
              </AdminRoute>
            }
          />
          
          <Route
            path="/admin/titles"
            element={
              <AdminRoute>
                <AdminTitlesManager />
              </AdminRoute>
            }
          />
          
          <Route
            path="/admin/courses"
            element={
              <AdminRoute>
                <AdminCourseManager />
              </AdminRoute>
            }
          />
          
          <Route
            path="/admin/lessons/:courseId"
            element={
              <AdminRoute>
                <AdminLessonManager />
              </AdminRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App

