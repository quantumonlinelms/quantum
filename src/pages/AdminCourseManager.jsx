import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import CoursePdfManager from '../components/CoursePdfManager'
import ErrorDisplay from '../components/ErrorBoundary'
import DashboardLayout from '../components/DashboardLayout'
import { FaArrowLeft, FaSpinner, FaPlus, FaEdit, FaTrash, FaGraduationCap, FaBookOpen, FaFilePdf } from 'react-icons/fa'

const AdminCourseManager = () => {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [titles, setTitles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    published: false,
    ordering: 0,
    title_id: '',
  })
  const [selectedCourse, setSelectedCourse] = useState(null)

  useEffect(() => {
    fetchCourses()
    fetchTitles()
  }, [])

  const fetchTitles = async () => {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setTitles(data || [])
    } catch (err) {
      console.error('Error fetching titles:', err)
    }
  }

  const fetchCourses = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: queryError } = await supabase
        .from('courses')
        .select(`
          *,
          titles (
            id,
            name
          )
        `)
        .order('ordering', { ascending: true })

      if (queryError) throw queryError
      setCourses(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError({
        message: err.message || 'Failed to load courses. Please try again.',
        code: err.code,
      })
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    let value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value
    
    // Parse number fields
    if (e.target.type === 'number') {
      value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(formData)
          .eq('id', editingCourse.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('courses').insert([formData])

        if (error) throw error
      }

      setShowForm(false)
      setEditingCourse(null)
      setFormData({ title: '', description: '', published: false, ordering: 0, title_id: '' })
      fetchCourses()
    } catch (error) {
      console.error('Error saving course:', error)
      alert('Failed to save course')
    }
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      description: course.description || '',
      published: course.published,
      ordering: course.ordering,
      title_id: course.title_id || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (courseId) => {
    // Check if any users have this course selected
    const { data: usersWithCourse, error: checkError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('selected_course_id', courseId)
      .limit(5)

    if (checkError) {
      console.error('Error checking course references:', checkError)
    }

    let confirmMessage = 'Are you sure you want to delete this course?'
    if (usersWithCourse && usersWithCourse.length > 0) {
      const userCount = usersWithCourse.length
      const moreText = userCount === 5 ? ' (and possibly more)' : ''
      confirmMessage = `This course is selected by ${userCount} user(s)${moreText}. Their selected course will be cleared. Are you sure you want to delete this course?`
    }

    if (!confirm(confirmMessage)) return

    try {
      // Delete the course (foreign key will automatically set selected_course_id to NULL)
      const { error } = await supabase.from('courses').delete().eq('id', courseId)

      if (error) {
        // Check if it's a foreign key constraint error
        if (error.code === '23503') {
          // Try to clear selected_course_id first, then delete
          const { error: updateError } = await supabase
            .from('users')
            .update({ selected_course_id: null })
            .eq('selected_course_id', courseId)

          if (updateError) {
            throw new Error('Failed to clear course references: ' + updateError.message)
          }

          // Try deleting again
          const { error: deleteError } = await supabase.from('courses').delete().eq('id', courseId)
          if (deleteError) throw deleteError
        } else {
          throw error
        }
      }
      
      fetchCourses()
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Failed to delete course: ' + (error.message || 'Unknown error'))
    }
  }

  if (loading && courses.length === 0 && !error) {
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
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Loading courses...</p>
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

        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              color: 'white',
              fontSize: '2rem',
              fontWeight: '800',
              marginBottom: '0.5rem',
              margin: 0,
            }}>
              Course Management
            </h1>
            {error && (
              <div style={{ marginTop: '1rem' }}>
                <ErrorDisplay error={error} onRetry={fetchCourses} loading={loading} />
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setShowForm(true)
              setEditingCourse(null)
              setFormData({ title: '', description: '', published: false, ordering: 0, title_id: '' })
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
            <span>Add Course</span>
          </button>
        </header>

        {showForm && (
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          >
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', margin: 0 }}>
              {editingCourse ? 'Edit Course' : 'New Course'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '600' }}>
                  Title (Category) *
                </label>
                <select
                  name="title_id"
                  value={formData.title_id}
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
                >
                  <option value="" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Select a title</option>
                  {titles.map((title) => (
                    <option key={title.id} value={title.id} style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
                      {title.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '600' }}>
                  Course Title *
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
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    resize: 'vertical',
                    fontFamily: 'inherit',
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="published"
                    checked={formData.published}
                    onChange={handleInputChange}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: '#ff3366',
                    }}
                  />
                  Published
                </label>
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
                    setEditingCourse(null)
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

        <div style={{ display: 'grid', gap: '1rem', width: '100%', maxWidth: '100%' }}>
          {courses.map((course) => (
            <div
              key={course.id}
              className="course-card-responsive"
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
                .course-card-responsive {
                  word-wrap: break-word;
                  overflow-wrap: break-word;
                }
                @media (max-width: 768px) {
                  .course-card-responsive {
                    padding: 1rem;
                  }
                }
              `}</style>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
                <div style={{ flex: 1, minWidth: '200px', maxWidth: '100%', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
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
                      <FaGraduationCap style={{ fontSize: '1.1rem', color: '#ff3366' }} />
                    </div>
                    <h3 
                      className="course-title-responsive"
                      title={course.title}
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
                      {course.title}
                    </h3>
                    <style>{`
                      .course-title-responsive {
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                      }
                      @media (max-width: 768px) {
                        .course-title-responsive {
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
                  {course.description && (
                    <p 
                      className="course-description-responsive"
                      title={course.description}
                      style={{ 
                        marginTop: '0.5rem', 
                        color: 'rgba(255,255,255,0.6)', 
                        fontSize: '0.95rem', 
                        lineHeight: '1.6',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                      }}
                    >
                      {course.description}
                    </p>
                  )}
                  <style>{`
                    .course-description-responsive {
                      word-wrap: break-word;
                      overflow-wrap: break-word;
                    }
                    @media (max-width: 768px) {
                      .course-description-responsive {
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        font-size: 0.875rem;
                      }
                    }
                    @media (min-width: 769px) {
                      .course-description-responsive {
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        text-overflow: ellipsis;
                      }
                    }
                  `}</style>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        backgroundColor: course.published ? 'rgba(40, 167, 69, 0.2)' : 'rgba(255, 193, 7, 0.2)',
                        color: course.published ? '#28a745' : '#ffc107',
                        border: `1px solid ${course.published ? 'rgba(40, 167, 69, 0.3)' : 'rgba(255, 193, 7, 0.3)'}`,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {course.published ? 'Published' : 'Draft'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Order: {course.ordering}</span>
                    {course.titles && (
                      <span 
                        className="course-category-responsive"
                        style={{ 
                          color: 'rgba(255,255,255,0.5)', 
                          fontSize: '0.875rem',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        Category: {course.titles.name}
                      </span>
                    )}
                    <style>{`
                      .course-category-responsive {
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                      }
                      @media (max-width: 768px) {
                        .course-category-responsive {
                          max-width: 100%;
                          overflow: hidden;
                          text-overflow: ellipsis;
                          white-space: nowrap;
                        }
                      }
                    `}</style>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
                  <button
                    onClick={() => handleEdit(course)}
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
                      justifyContent: 'center',
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
                    onClick={() => navigate(`/admin/lessons/${course.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.25rem',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      flex: '1 1 auto',
                      minWidth: '120px',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#138496'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#17a2b8'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <FaBookOpen />
                    <span>Lessons</span>
                  </button>
                  <button
                    onClick={() => setSelectedCourse(selectedCourse?.id === course.id ? null : course)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.25rem',
                      backgroundColor: selectedCourse?.id === course.id ? '#ffc107' : 'rgba(255, 193, 7, 0.2)',
                      color: selectedCourse?.id === course.id ? '#000' : '#ffc107',
                      border: `1px solid ${selectedCourse?.id === course.id ? '#ffc107' : 'rgba(255, 193, 7, 0.3)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      flex: '1 1 auto',
                      minWidth: '120px',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCourse?.id !== course.id) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.3)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCourse?.id !== course.id) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.2)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    <FaFilePdf />
                    <span>{selectedCourse?.id === course.id ? 'Hide PDFs' : 'PDFs'}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
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
                      justifyContent: 'center',
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
              {selectedCourse?.id === course.id && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                  <CoursePdfManager courseId={course.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminCourseManager

