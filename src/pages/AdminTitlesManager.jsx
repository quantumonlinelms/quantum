import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import ErrorDisplay from '../components/ErrorBoundary'
import DashboardLayout from '../components/DashboardLayout'
import { FaArrowLeft, FaSpinner, FaPlus, FaEdit, FaTrash, FaBook } from 'react-icons/fa'

const AdminTitlesManager = () => {
  const [titles, setTitles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTitle, setEditingTitle] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    deposit_amount_birr: 0,
  })

  useEffect(() => {
    fetchTitles()
  }, [])

  const fetchTitles = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: queryError } = await supabase
        .from('titles')
        .select('*')
        .order('name', { ascending: true })

      if (queryError) throw queryError
      setTitles(data || [])
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

  const handleInputChange = (e) => {
    let value = e.target.value
    
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
      if (editingTitle) {
        const { error } = await supabase
          .from('titles')
          .update(formData)
          .eq('id', editingTitle.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('titles').insert([formData])

        if (error) throw error
      }

      setShowForm(false)
      setEditingTitle(null)
      setFormData({ name: '', deposit_amount_birr: 0 })
      fetchTitles()
    } catch (error) {
      console.error('Error saving title:', error)
      alert('Failed to save title: ' + (error.message || 'Unknown error'))
    }
  }

  const handleEdit = (title) => {
    setEditingTitle(title)
    setFormData({
      name: title.name,
      deposit_amount_birr: title.deposit_amount_birr || 0,
    })
    setShowForm(true)
  }

  const handleDelete = async (titleId) => {
    // Check if any users have this title selected
    const { data: usersWithTitle, error: checkError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('selected_title_id', titleId)
      .limit(5)

    if (checkError) {
      console.error('Error checking title references:', checkError)
    }

    let confirmMessage = 'Are you sure you want to delete this title?'
    if (usersWithTitle && usersWithTitle.length > 0) {
      const userCount = usersWithTitle.length
      const moreText = userCount === 5 ? ' (and possibly more)' : ''
      confirmMessage = `This title is selected by ${userCount} user(s)${moreText}. Their selected title will be cleared. Are you sure you want to delete this title?`
    }

    if (!confirm(confirmMessage)) return

    try {
      const { error } = await supabase.from('titles').delete().eq('id', titleId)

      if (error) {
        if (error.code === '23503') {
          // Try to clear selected_title_id first, then delete
          const { error: updateError } = await supabase
            .from('users')
            .update({ selected_title_id: null })
            .eq('selected_title_id', titleId)

          if (updateError) {
            throw new Error('Failed to clear title references: ' + updateError.message)
          }

          // Try deleting again
          const { error: deleteError } = await supabase.from('titles').delete().eq('id', titleId)
          if (deleteError) throw deleteError
        } else {
          throw error
        }
      }
      
      fetchTitles()
    } catch (error) {
      console.error('Error deleting title:', error)
      alert('Failed to delete title: ' + (error.message || 'Unknown error'))
    }
  }

  if (loading && titles.length === 0 && !error) {
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
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Loading titles...</p>
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
              Title Management
            </h1>
            {error && (
              <div style={{ marginTop: '1rem' }}>
                <ErrorDisplay error={error} onRetry={fetchTitles} loading={loading} />
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setShowForm(true)
              setEditingTitle(null)
              setFormData({ name: '', deposit_amount_birr: 0 })
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
            <span>Add Title</span>
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
              {editingTitle ? 'Edit Title' : 'New Title'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '600' }}>
                  Title Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
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
                  Deposit Amount (Birr) *
                </label>
                <input
                  type="number"
                  name="deposit_amount_birr"
                  value={formData.deposit_amount_birr}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
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
                    setEditingTitle(null)
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

        <div style={{ display: 'grid', gap: '1rem' }}>
          {titles.map((title) => (
            <div
              key={title.id}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255,51,102,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <FaBook style={{ fontSize: '1.1rem', color: '#ff3366' }} />
                    </div>
                    <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                      {title.name}
                    </h3>
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
                      Deposit: <strong style={{ color: '#ff3366' }}>{(title.deposit_amount_birr || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr</strong>
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleEdit(title)}
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
                    onClick={() => handleDelete(title.id)}
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
            </div>
          ))}
        </div>

        {titles.length === 0 && !loading && (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}>
            <FaBook style={{
              fontSize: '3rem',
              color: 'rgba(255,255,255,0.2)',
              marginBottom: '1rem',
            }} />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
              No titles found. Create your first title above.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminTitlesManager


