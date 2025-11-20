import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import ErrorDisplay from '../components/ErrorBoundary'
import LessonFileManager from '../components/LessonFileManager'
import DashboardLayout from '../components/DashboardLayout'
import { FaArrowLeft, FaSpinner, FaPlus, FaEdit, FaTrash, FaPlay, FaFileAlt } from 'react-icons/fa'

const AdminLessonManager = () => {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    youtube_video_id: '',
    ordering: 0,
  })

  useEffect(() => {
    fetchCourse()
    fetchLessons()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (queryError) throw queryError
      setCourse(data)
    } catch (err) {
      console.error('Error fetching course:', err)
      // Set course to null so component can handle error state
      setCourse(null)
      // Also set error if lessons haven't loaded yet
      if (loading) {
        setError({
          message: err.message || 'Failed to load course. Please try again.',
          code: err.code,
        })
      }
    }
  }

  const fetchLessons = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: queryError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('ordering', { ascending: true })

      if (queryError) throw queryError
      setLessons(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching lessons:', err)
      setError({
        message: err.message || 'Failed to load lessons. Please try again.',
        code: err.code,
      })
      setLessons([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Extract video ID if URL was provided
      const videoId = extractVideoId(formData.youtube_video_id)
      const lessonData = { ...formData, youtube_video_id: videoId }

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert([{ ...lessonData, course_id: courseId }])

        if (error) throw error
      }

      setShowForm(false)
      setEditingLesson(null)
      setFormData({ title: '', youtube_video_id: '', ordering: 0 })
      fetchLessons()
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('Failed to save lesson')
    }
  }

  const handleEdit = (lesson) => {
    setEditingLesson(lesson)
    setFormData({
      title: lesson.title,
      youtube_video_id: lesson.youtube_video_id,
      ordering: lesson.ordering,
    })
    setShowForm(true)
  }

  const handleDelete = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return

    try {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId)

      if (error) throw error
      fetchLessons()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('Failed to delete lesson')
    }
  }

  const extractVideoId = (url) => {
    // Extract YouTube video ID from URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : url
  }

  if (loading && lessons.length === 0 && !error) {
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
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Loading lessons...</p>
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

  if (!course && !loading) {
    return (
      <DashboardLayout isAdmin>
        <div style={{ width: '100%', maxWidth: '100%', minHeight: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
          <Link 
            to="/admin/courses"
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
            <span>Back to Courses</span>
          </Link>
          <ErrorDisplay 
            error={{ message: 'Course not found or failed to load.' }} 
            onRetry={() => {
              fetchCourse()
              fetchLessons()
            }} 
            loading={loading} 
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout isAdmin>
      <div style={{ width: '100%', maxWidth: '100%', minHeight: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
        <Link 
          to="/admin/courses"
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
          <span>Back to Courses</span>
        </Link>

        <header style={{ 
          marginBottom: '2rem', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}>
          <div style={{ width: '100%' }}>
            <h1 style={{
              color: 'white',
              fontSize: '1.75rem',
              fontWeight: '800',
              marginBottom: '0.5rem',
              margin: 0,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}>
              Manage Lessons
            </h1>
            <p style={{ 
              marginTop: '0.5rem', 
              color: 'rgba(255,255,255,0.6)', 
              fontSize: '0.95rem',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}>
              Course: {course?.title || 'Loading...'}
            </p>
            
            {error && (
              <div style={{ marginTop: '1rem' }}>
                <ErrorDisplay error={error} onRetry={fetchLessons} loading={loading} />
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setShowForm(true)
              setEditingLesson(null)
              setFormData({ title: '', youtube_video_id: '', ordering: 0 })
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ff3366',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              width: '100%',
              maxWidth: '100%',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ff1a52'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ff3366'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid #ff3366'
              e.currentTarget.style.outlineOffset = '2px'
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none'
            }}
          >
            <FaPlus />
            <span>Add Lesson</span>
          </button>
        </header>

        {showForm && (
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              backgroundColor: 'rgba(255,255,255,0.05)',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', margin: 0 }}>
              {editingLesson ? 'Edit Lesson' : 'New Lesson'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '600' }}>
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.borderColor = '#ff3366'
                    e.currentTarget.style.outline = 'none'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '600' }}>
                  YouTube Video ID or URL *
                </label>
                <input
                  type="text"
                  name="youtube_video_id"
                  value={formData.youtube_video_id}
                  onChange={handleInputChange}
                  required
                  placeholder="dQw4w9WgXcQ or https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.borderColor = '#ff3366'
                    e.currentTarget.style.outline = 'none'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                />
                <small style={{ display: 'block', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  Enter YouTube video ID or full URL (ID will be extracted automatically)
                </small>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '600' }}>
                  Ordering
                </label>
                <input
                  type="number"
                  name="ordering"
                  value={formData.ordering}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.borderColor = '#ff3366'
                    e.currentTarget.style.outline = 'none'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
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
                  <FaPlus />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingLesson(null)
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
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
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {lessons.length === 0 ? (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <FaPlay style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }} />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', margin: 0 }}>
              No lessons for this course yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '100%' }}>
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="lesson-card-responsive"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
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
                <style>{`
                  .lesson-card-responsive {
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                  }
                  @media (max-width: 768px) {
                    .lesson-card-responsive {
                      padding: 1rem;
                    }
                  }
                `}</style>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '1rem',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}>
                  <div style={{ 
                    width: '100%',
                    maxWidth: '100%', 
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem', 
                      marginBottom: '0.75rem', 
                      flexWrap: 'wrap',
                      width: '100%',
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        minWidth: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255,51,102,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <FaPlay style={{ fontSize: '1rem', color: '#ff3366' }} />
                      </div>
                      <h3 
                        className="lesson-title-responsive"
                        title={lesson.title}
                        style={{ 
                          color: 'white', 
                          fontSize: '1.25rem', 
                          fontWeight: '700', 
                          margin: 0,
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          maxWidth: '100%',
                        }}
                      >
                        {lesson.title}
                      </h3>
                      <style>{`
                        .lesson-title-responsive {
                          word-wrap: break-word;
                          overflow-wrap: break-word;
                        }
                        @media (max-width: 768px) {
                          .lesson-title-responsive {
                            font-size: 1.1rem;
                            -webkit-line-clamp: 2;
                            display: -webkit-box;
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                            text-overflow: ellipsis;
                          }
                        }
                      `}</style>
                    </div>
                    <div style={{ 
                      marginTop: '0.75rem', 
                      display: 'flex', 
                      gap: '0.75rem', 
                      flexWrap: 'wrap', 
                      alignItems: 'center',
                      width: '100%',
                    }}>
                      <span style={{ 
                        color: 'rgba(255,255,255,0.6)', 
                        fontSize: '0.875rem',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}>
                        <FaPlay style={{ marginRight: '0.25rem', fontSize: '0.75rem' }} />
                        Video ID: <span style={{ 
                          color: 'rgba(255,255,255,0.8)', 
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                        }}>{lesson.youtube_video_id}</span>
                      </span>
                      <span style={{ 
                        color: 'rgba(255,255,255,0.6)', 
                        fontSize: '0.875rem',
                      }}>
                        Order: {lesson.ordering}
                      </span>
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.75rem', 
                    flexWrap: 'wrap', 
                    width: '100%', 
                    maxWidth: '100%',
                  }}>
                    <button
                      onClick={() => handleEdit(lesson)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        backgroundColor: '#ff3366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        flex: '1 1 auto',
                        minWidth: '120px',
                        maxWidth: '100%',
                        justifyContent: 'center',
                        width: '100%',
                        boxSizing: 'border-box',
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
                      <FaEdit />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(lesson.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        flex: '1 1 auto',
                        minWidth: '120px',
                        maxWidth: '100%',
                        justifyContent: 'center',
                        width: '100%',
                        boxSizing: 'border-box',
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
                      <FaTrash />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
                
                {/* Lesson Files Manager */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <LessonFileManager lessonId={lesson.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminLessonManager

