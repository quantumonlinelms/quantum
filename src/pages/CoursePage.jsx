import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import PdfList from '../components/PdfList'
import ErrorDisplay from '../components/ErrorBoundary'
import DashboardLayout from '../components/DashboardLayout'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../i18n'
import { FaArrowLeft, FaPlayCircle, FaGraduationCap, FaBook, FaSpinner, FaFilePdf, FaChevronDown, FaChevronUp } from 'react-icons/fa'

const CoursePage = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('ordering', { ascending: true })

      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching course data:', err)
      setError({
        message: err.message || 'Failed to load course data. Please try again.',
        code: err.code,
      })
      setCourse(null)
      setLessons([])
    } finally {
      setLoading(false)
    }
  }

  if (loading && !course && !error) {
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
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Loading course...</p>
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

  if (error && !course) {
    return (
      <DashboardLayout>
        <div style={{ width: '100%', maxWidth: '100%', minHeight: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
          <Link 
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              marginBottom: '2rem',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ff3366'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >
            <FaArrowLeft />
            <span>Back to Dashboard</span>
          </Link>
          <ErrorDisplay error={error} onRetry={fetchCourseData} loading={loading} />
        </div>
      </DashboardLayout>
    )
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div style={{ width: '100%', maxWidth: '100%', minHeight: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
          <Link 
            to="/dashboard"
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
            <span>Back to Dashboard</span>
          </Link>
          <p style={{ color: 'white' }}>Course not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div style={{ width: '100%', maxWidth: '100%', minHeight: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
        {/* Back Button */}
        <Link 
          to="/dashboard"
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
          <span>Back to Dashboard</span>
        </Link>

        {/* Error Display */}
        {error && (
          <div style={{ marginBottom: '2rem' }}>
            <ErrorDisplay error={error} onRetry={fetchCourseData} loading={loading} />
          </div>
        )}

        {/* Course Header */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
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
              <FaGraduationCap style={{ fontSize: '1.5rem', color: '#ff3366' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 
                title={course.title}
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
                {course.title}
              </h1>
              {course.description && (
                <div>
                  <div
                    style={{
                      marginBottom: '0.75rem',
                    }}
                  >
                    <p 
                      title={course.description}
                      className={descriptionExpanded ? 'description-expanded' : 'description-collapsed'}
                      style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        margin: 0,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                      }}
                    >
                      {course.description}
                    </p>
                    <style>{`
                      .description-collapsed {
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        text-overflow: ellipsis;
                      }
                      .description-expanded {
                        display: block;
                        overflow: visible;
                      }
                    `}</style>
                  </div>
                  {course.description.length > 150 && (
                    <button
                      onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: '#ff3366',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        padding: '0.5rem 0',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ff1a52'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#ff3366'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.outline = '2px solid #ff3366'
                        e.currentTarget.style.outlineOffset = '2px'
                        e.currentTarget.style.color = '#ff1a52'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.outline = 'none'
                        e.currentTarget.style.color = '#ff3366'
                      }}
                    >
                      {descriptionExpanded ? (
                        <>
                          <FaChevronUp style={{ fontSize: '0.75rem' }} />
                          <span>Show Less</span>
                        </>
                      ) : (
                        <>
                          <FaChevronDown style={{ fontSize: '0.75rem' }} />
                          <span>Show More</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lessons Section */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}>
            <FaPlayCircle style={{ fontSize: '1.25rem', color: '#ff3366' }} />
            <h2 style={{
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: 0,
            }}>
              Lessons
            </h2>
            <span style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.9rem',
            }}>
              ({lessons.length})
            </span>
          </div>

          {lessons.length === 0 ? (
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '3rem 2rem',
              textAlign: 'center',
            }}>
              <FaPlayCircle style={{
                fontSize: '3rem',
                color: 'rgba(255,255,255,0.2)',
                marginBottom: '1rem',
              }} />
              <p style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '1rem',
              }}>
                No lessons available for this course yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {lessons.map((lesson, index) => (
                <Link
                  key={lesson.id}
                  to={`/course/${courseId}/lesson/${lesson.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem 1.5rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'rgba(255,255,255,0.8)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,51,102,0.15)'
                    e.currentTarget.style.borderColor = 'rgba(255,51,102,0.3)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = '2px solid #ff3366'
                    e.currentTarget.style.outlineOffset = '2px'
                    e.currentTarget.style.backgroundColor = 'rgba(255,51,102,0.15)'
                    e.currentTarget.style.borderColor = 'rgba(255,51,102,0.3)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none'
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,51,102,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 'bold',
                    color: '#ff3366',
                    fontSize: '1.1rem',
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 
                      title={lesson.title}
                      style={{
                        color: 'white',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        marginBottom: '0.25rem',
                        margin: 0,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                        lineHeight: '1.3',
                      }}
                    >
                      {lesson.title}
                    </h3>
                    <p style={{
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '0.875rem',
                      margin: 0,
                    }}>
                      Lesson {index + 1} of {lessons.length}
                    </p>
                  </div>
                  <FaPlayCircle style={{
                    fontSize: '1.25rem',
                    color: 'rgba(255,255,255,0.4)',
                    flexShrink: 0,
                  }} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Course Materials Section */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}>
            <FaFilePdf style={{ fontSize: '1.25rem', color: '#ff3366' }} />
            <h2 style={{
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: 0,
            }}>
              Course Materials
            </h2>
          </div>
          <PdfList courseId={courseId} />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CoursePage
