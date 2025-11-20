import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { t } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'
import ErrorDisplay from '../components/ErrorBoundary'
import { FaChevronDown, FaChevronRight, FaBook, FaGraduationCap, FaPlayCircle, FaSpinner, FaClock } from 'react-icons/fa'

const StudentDashboard = () => {
  const { user, userProfile } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [titles, setTitles] = useState([])
  const [expandedTitle, setExpandedTitle] = useState(null)
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id && userProfile?.approved) {
      fetchEnrolledTitles()
    } else if (!user) {
      setLoading(false)
    } else if (user && !userProfile) {
      setLoading(true)
    }
  }, [user, userProfile])

  const fetchEnrolledTitles = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: enrolments, error: queryError } = await supabase
        .from('enrolments')
        .select(`
          title_id,
          status,
          titles!inner (
            id,
            name,
            deposit_amount_birr,
            courses (
              id,
              title,
              description,
              ordering,
              lessons (
                id,
                title,
                ordering,
                youtube_video_id
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'approved')

      if (queryError) {
        console.error('Query error:', queryError)
        throw queryError
      }

      const enrolledTitles = enrolments
        ?.map((enrolment) => enrolment.titles)
        .filter(Boolean)
        .map(title => ({
          ...title,
          courses: (title.courses || []).sort((a, b) => (a.ordering || 0) - (b.ordering || 0)).map(course => ({
            ...course,
            lessons: (course.lessons || []).sort((a, b) => (a.ordering || 0) - (b.ordering || 0))
          }))
        })) || []

      setTitles(enrolledTitles)
      setError(null)
    } catch (err) {
      console.error('Error fetching titles:', err)
      setError({
        message: err.message || 'Failed to load titles. Please try again.',
        code: err.code,
      })
      setTitles([])
    } finally {
      setLoading(false)
    }
  }

  if ((loading && titles.length === 0 && !error) || (user && !userProfile)) {
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
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>{t('dashboard.loadingCourses', language)}</p>
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

  const toggleTitle = (titleId) => {
    setExpandedTitle(expandedTitle === titleId ? null : titleId)
    setExpandedCourse(null)
  }

  const toggleCourse = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId)
  }

  const getTotalLessons = (title) => {
    return title.courses?.reduce((total, course) => total + (course.lessons?.length || 0), 0) || 0
  }

  const getTotalCourses = (title) => {
    return title.courses?.length || 0
  }

  return (
    <DashboardLayout>
      <div style={{ width: '100%', maxWidth: '100%', minHeight: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            color: 'white',
            fontSize: '2rem',
            fontWeight: '800',
            marginBottom: '0.5rem',
          }}>
            {t('dashboard.welcome', language)}, {userProfile?.full_name || 'Student'}!
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '1rem',
          }}>
            {t('dashboard.title', language)}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ marginBottom: '2rem' }}>
            <ErrorDisplay error={error} onRetry={fetchEnrolledTitles} loading={loading} />
          </div>
        )}

        {/* Loading State */}
        {loading && titles.length === 0 ? (
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
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>{t('dashboard.loadingCourses', language)}</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : titles.length === 0 && !error ? (
          /* Empty State */
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '4rem 3rem',
            textAlign: 'center',
          }}>
            <FaBook style={{
              fontSize: '5rem',
              color: 'rgba(255,255,255,0.2)',
              marginBottom: '1.5rem',
            }} />
            <h2 style={{
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '0.5rem',
            }}>
              {t('dashboard.noCoursesTitle', language)}
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '1rem',
            }}>
              {t('dashboard.noCourses', language)}
            </p>
          </div>
        ) : (
          /* Titles List */
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem',
            width: '100%',
          }}>
            {titles.map((title) => {
              const totalCourses = getTotalCourses(title)
              const totalLessons = getTotalLessons(title)
              const isExpanded = expandedTitle === title.id
              
              return (
                <div
                  key={title.id}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    overflow: 'hidden',
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
                  {/* Title Header */}
                  <div
                    style={{
                      padding: '1.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                    onClick={() => toggleTitle(title.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleTitle(title.id)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title.name}`}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '2px solid #ff3366'
                      e.currentTarget.style.outlineOffset = '2px'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <FaBook style={{ fontSize: '1.5rem', color: 'white' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          margin: 0,
                          color: 'white',
                          fontSize: '1.25rem',
                          fontWeight: '700',
                          marginBottom: '0.25rem',
                        }}>
                          {title.name}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.875rem',
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FaGraduationCap style={{ fontSize: '0.875rem' }} />
                            {totalCourses} {totalCourses === 1 ? t('dashboard.course', language) : t('dashboard.courses', language)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FaPlayCircle style={{ fontSize: '0.875rem' }} />
                            {totalLessons} {totalLessons === 1 ? t('dashboard.lesson', language) : t('dashboard.lessons', language)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{
                      color: '#ff3366',
                      fontSize: '1.5rem',
                      flexShrink: 0,
                      transition: 'transform 0.3s ease',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>
                      <FaChevronDown />
                    </div>
                  </div>

                  {/* Courses List (when expanded) */}
                  {isExpanded && (
                    <div style={{
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      padding: '1rem',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                    }}>
                      {title.courses && title.courses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {title.courses.map((course, courseIndex) => {
                            const isCourseExpanded = expandedCourse === course.id
                            const lessonCount = course.lessons?.length || 0
                            
                            return (
                              <div
                                key={course.id}
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
                                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                                }}
                              >
                                {/* Course Header */}
                                <div
                                  style={{
                                    padding: '1rem 1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1rem',
                                  }}
                                >
                                  <div 
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '0.75rem', 
                                      flex: 1,
                                      cursor: 'pointer',
                                      borderRadius: '8px',
                                      padding: '0.25rem',
                                      transition: 'all 0.2s ease',
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigate(`/course/${course.id}`)
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        navigate(`/course/${course.id}`)
                                      }
                                    }}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`View ${course.title} course`}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(255,51,102,0.1)'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                    onFocus={(e) => {
                                      e.currentTarget.style.outline = '2px solid #ff3366'
                                      e.currentTarget.style.outlineOffset = '2px'
                                      e.currentTarget.style.backgroundColor = 'rgba(255,51,102,0.1)'
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.outline = 'none'
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    <div style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: '10px',
                                      backgroundColor: 'rgba(255,51,102,0.2)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}>
                                      <FaGraduationCap style={{ fontSize: '1.1rem', color: '#ff3366' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <h4 style={{
                                        margin: 0,
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        marginBottom: '0.125rem',
                                      }}>
                                        {course.title}
                                      </h4>
                                      <div style={{
                                        color: 'rgba(255,255,255,0.5)',
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                      }}>
                                        <FaPlayCircle style={{ fontSize: '0.75rem' }} />
                                        {lessonCount} {lessonCount === 1 ? t('dashboard.lesson', language) : t('dashboard.lessons', language)}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleCourse(course.id)
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        toggleCourse(course.id)
                                      }
                                    }}
                                    tabIndex={0}
                                    role="button"
                                    aria-expanded={isCourseExpanded}
                                    aria-label={`${isCourseExpanded ? 'Collapse' : 'Expand'} lessons for ${course.title}`}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ff3366',
                                      fontSize: '1.25rem',
                                      flexShrink: 0,
                                      transition: 'transform 0.2s ease',
                                      transform: isCourseExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                      cursor: 'pointer',
                                      padding: '0.25rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    onFocus={(e) => {
                                      e.currentTarget.style.outline = '2px solid #ff3366'
                                      e.currentTarget.style.outlineOffset = '2px'
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.outline = 'none'
                                    }}
                                  >
                                    <FaChevronDown />
                                  </button>
                                </div>

                                {/* Lessons List (when course expanded) */}
                                {isCourseExpanded && (
                                  <div style={{
                                    borderTop: '1px solid rgba(255,255,255,0.08)',
                                    padding: '0.75rem 1rem 1rem',
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                  }}>
                                    {course.lessons && course.lessons.length > 0 ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {course.lessons.map((lesson, lessonIndex) => (
                                          <Link
                                            key={lesson.id}
                                            to={`/course/${course.id}/lesson/${lesson.id}`}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '0.75rem',
                                              padding: '0.75rem 1rem',
                                              backgroundColor: 'rgba(255,255,255,0.05)',
                                              borderRadius: '8px',
                                              textDecoration: 'none',
                                              color: 'rgba(255,255,255,0.8)',
                                              transition: 'all 0.2s ease',
                                              border: '1px solid transparent',
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.backgroundColor = 'rgba(255,51,102,0.15)'
                                              e.currentTarget.style.borderColor = 'rgba(255,51,102,0.3)'
                                              e.currentTarget.style.color = 'white'
                                              e.currentTarget.style.transform = 'translateX(4px)'
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                                              e.currentTarget.style.borderColor = 'transparent'
                                              e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                                              e.currentTarget.style.transform = 'translateX(0)'
                                            }}
                                            onFocus={(e) => {
                                              e.currentTarget.style.outline = '2px solid #ff3366'
                                              e.currentTarget.style.outlineOffset = '2px'
                                              e.currentTarget.style.backgroundColor = 'rgba(255,51,102,0.15)'
                                              e.currentTarget.style.borderColor = 'rgba(255,51,102,0.3)'
                                              e.currentTarget.style.color = 'white'
                                            }}
                                            onBlur={(e) => {
                                              e.currentTarget.style.outline = 'none'
                                              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                                              e.currentTarget.style.borderColor = 'transparent'
                                              e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                                            }}
                                            aria-label={`${t('dashboard.lesson', language)} ${lessonIndex + 1}: ${lesson.title}`}
                                          >
                                            <div style={{
                                              width: '32px',
                                              height: '32px',
                                              borderRadius: '8px',
                                              backgroundColor: 'rgba(255,51,102,0.2)',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              flexShrink: 0,
                                            }}>
                                              <FaPlayCircle style={{ fontSize: '0.875rem', color: '#ff3366' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <div style={{
                                                color: 'white',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                              }}>
                                                {lesson.title}
                                              </div>
                                              <div style={{
                                                color: 'rgba(255,255,255,0.5)',
                                                fontSize: '0.75rem',
                                                marginTop: '0.125rem',
                                              }}>
                                                {t('dashboard.lesson', language)} {lessonIndex + 1}
                                              </div>
                                            </div>
                                            <FaChevronRight style={{
                                              fontSize: '0.875rem',
                                              color: 'rgba(255,255,255,0.4)',
                                              flexShrink: 0,
                                            }} />
                                          </Link>
                                        ))}
                                      </div>
                                    ) : (
                                      <div style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        color: 'rgba(255,255,255,0.5)',
                                        fontSize: '0.875rem',
                                      }}>
                                        {t('dashboard.noLessonsAvailable', language)}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div style={{
                          padding: '2rem',
                          textAlign: 'center',
                          color: 'rgba(255,255,255,0.5)',
                        }}>
                          {t('dashboard.noCoursesAvailable', language)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default StudentDashboard
