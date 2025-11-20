import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import LessonFileList from '../components/LessonFileList'
import DashboardLayout from '../components/DashboardLayout'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../i18n'
import { FaArrowLeft, FaCheckCircle, FaSpinner, FaPlayCircle, FaFileAlt } from 'react-icons/fa'

const LessonPage = () => {
  const { courseId, lessonId } = useParams()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [lesson, setLesson] = useState(null)
  const [course, setCourse] = useState(null)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [markingComplete, setMarkingComplete] = useState(false)

  useEffect(() => {
    fetchLessonData()
    fetchCourseData()
    checkProgress()
  }, [lessonId, user])

  const fetchLessonData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (error) throw error
      setLesson(data)
    } catch (error) {
      console.error('Error fetching lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourseData = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single()

      if (!error && data) {
        setCourse(data)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    }
  }

  const checkProgress = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('completed')
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .single()

      if (!error && data) {
        setCompleted(data.completed)
      }
    } catch (error) {
      // Progress doesn't exist yet, that's fine
    }
  }

  const markAsCompleted = async () => {
    if (!user) return

    setMarkingComplete(true)
    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          lesson_id: lessonId,
          user_id: user.id,
          completed: true,
          completed_at: new Date().toISOString(),
        })

      if (error) throw error
      setCompleted(true)
    } catch (error) {
      console.error('Error marking lesson as completed:', error)
      alert('Failed to mark lesson as completed')
    } finally {
      setMarkingComplete(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
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
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Loading lesson...</p>
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

  if (!lesson) {
    return (
      <DashboardLayout>
        <div style={{ width: '100%', maxWidth: '100%', minHeight: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
          <Link 
            to={`/course/${courseId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              marginBottom: '2rem',
            }}
          >
            <FaArrowLeft />
            <span>Back to Course</span>
          </Link>
          <p style={{ color: 'white' }}>Lesson not found</p>
        </div>
      </DashboardLayout>
    )
  }

  const youtubeEmbedUrl = `https://www.youtube.com/embed/${lesson.youtube_video_id}`

  return (
    <DashboardLayout>
      <div style={{ width: '100%', maxWidth: '100%', minHeight: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
        {/* Back Button */}
        <Link 
          to={`/course/${courseId}`}
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
          <span>Back to {course?.title || 'Course'}</span>
        </Link>

        {/* Lesson Header */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255,51,102,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FaPlayCircle style={{ fontSize: '1.5rem', color: '#ff3366' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 
                title={lesson.title}
                style={{
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: '800',
                  marginBottom: '0.5rem',
                  margin: 0,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  maxWidth: '100%',
                  lineHeight: '1.2',
                }}
              >
                {lesson.title}
              </h1>
              {course && (
                <p style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.95rem',
                  margin: 0,
                }}>
                  {course.title}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Video Section */}
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              position: 'relative',
              paddingBottom: '56.25%',
              height: 0,
              overflow: 'hidden',
              maxWidth: '100%',
              backgroundColor: '#000',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            }}
          >
            <iframe
              src={youtubeEmbedUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            />
          </div>
        </div>

        {/* Completion Section */}
        <div style={{ marginBottom: '2rem' }}>
          {completed ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                backgroundColor: 'rgba(40, 167, 69, 0.15)',
                border: '1px solid rgba(40, 167, 69, 0.3)',
                borderRadius: '12px',
                color: '#28a745',
              }}
            >
              <FaCheckCircle style={{ fontSize: '1.25rem' }} />
              <span style={{ fontWeight: '600', fontSize: '1rem' }}>Lesson completed</span>
            </div>
          ) : (
            <button
              onClick={markAsCompleted}
              disabled={markingComplete}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.25rem',
                backgroundColor: '#ff3366',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: markingComplete ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                opacity: markingComplete ? 0.7 : 1,
                width: 'auto',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!markingComplete) {
                  e.currentTarget.style.backgroundColor = '#ff1a52'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!markingComplete) {
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
              {markingComplete ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Marking as complete...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  <span>Mark as Completed</span>
                </>
              )}
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </button>
          )}
        </div>

        {/* Lesson Files Section */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}>
            <FaFileAlt style={{ fontSize: '1.25rem', color: '#ff3366' }} />
            <h2 style={{
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: 0,
            }}>
              Lesson Materials
            </h2>
          </div>
          <LessonFileList lessonId={lessonId} />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default LessonPage
