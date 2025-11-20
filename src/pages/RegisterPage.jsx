import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { uploadToCloudflareR2 } from '../lib/cloudflare'
import { FaUser, FaEnvelope, FaPhone, FaLock, FaEye, FaEyeSlash, FaBook, FaFileUpload, FaCheckCircle, FaExclamationTriangle, FaArrowLeft, FaSpinner, FaMoneyBillWave, FaCopy, FaUniversity } from 'react-icons/fa'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    selectedTitleId: '',
  })
  const [titles, setTitles] = useState([])
  const [selectedTitle, setSelectedTitle] = useState(null)
  const [receiptFile, setReceiptFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const submittingRef = useRef(false)

  useEffect(() => {
    fetchTitles()
  }, [])

  useEffect(() => {
    if (formData.selectedTitleId) {
      const title = titles.find(t => t.id === formData.selectedTitleId)
      setSelectedTitle(title || null)
    } else {
      setSelectedTitle(null)
    }
  }, [formData.selectedTitleId, titles])

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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleFileChange = (e) => {
    setReceiptFile(e.target.files[0])
    setError('')
  }

  const uploadReceiptToCloudflare = async (file) => {
    try {
      const url = await uploadToCloudflareR2(file, 'receipts')
      return url
    } catch (error) {
      console.error('Error uploading receipt:', error)
      throw new Error('Failed to upload receipt: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (submittingRef.current || loading) {
      return
    }
    
    setError('')
    setLoading(true)
    submittingRef.current = true

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      submittingRef.current = false
      return
    }

    if (!receiptFile) {
      setError('Please upload a payment receipt')
      setLoading(false)
      submittingRef.current = false
      return
    }

    if (!formData.selectedTitleId) {
      setError('Please select a title')
      setLoading(false)
      submittingRef.current = false
      return
    }

    try {
      const { data: authData, error: authError } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone,
        formData.selectedTitleId
      )

      if (authError) {
        if (authError.message && authError.message.includes('Database error')) {
          throw new Error('Failed to create user profile. Please check that the database trigger is properly configured.')
        }
        throw authError
      }

      if (!authData?.user?.id) {
        throw new Error('User creation failed. Please try again.')
      }

      const receiptUrl = await uploadReceiptToCloudflare(receiptFile)
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (formData.selectedTitleId) {
        const { error: enrolmentError } = await supabase
          .from('enrolments')
          .insert({
            user_id: authData.user.id,
            title_id: formData.selectedTitleId,
            receipt_url: receiptUrl,
            status: 'pending',
          })

        if (enrolmentError) {
          console.error('Error creating enrolment:', enrolmentError)
        }
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          padding: '3rem',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '5rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'center',
            color: '#ff3366',
          }}>
            <FaCheckCircle />
          </div>
          <h2 style={{
            color: 'white',
            marginBottom: '1rem',
            fontSize: '1.75rem',
            fontWeight: '700',
          }}>{t('auth.registrationSubmitted', language)}</h2>
          <div style={{
            backgroundColor: 'rgba(255,51,102,0.1)',
            border: '2px solid #ff3366',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}>
            <p style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#ff3366',
              marginBottom: '0.75rem',
            }}>
              {t('auth.pendingStatus', language)}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              lineHeight: '1.6',
              marginBottom: '1rem',
            }}>
              {t('auth.pendingMessage', language)}
            </p>
            <p style={{
              fontWeight: '600',
              color: '#ff3366',
              marginBottom: '0.5rem',
            }}>
              {t('auth.whatHappensNext', language)}
            </p>
            <ul style={{
              color: 'rgba(255,255,255,0.8)',
              lineHeight: '1.8',
              marginLeft: '1.5rem',
              marginBottom: 0,
            }}>
              <li>{t('auth.pendingApprovalItem1', language)}</li>
              <li>{t('auth.pendingApprovalItem2', language)}</li>
              <li>{t('auth.pendingApprovalItem3', language)}</li>
            </ul>
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.9rem',
            fontStyle: 'italic',
          }}>
            {t('auth.redirectingToLogin', language)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo/Brand */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          <Link to="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: 'white',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem',
            }}>
              Q
            </div>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              letterSpacing: '0.5px',
            }}>QUANTUM LMS</span>
          </Link>
        </div>

        {/* Register Card */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          padding: '2.5rem',
        }}>
          <div style={{
            marginBottom: '2rem',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: 'white',
              marginBottom: '0.5rem',
            }}>
              {t('auth.createAccount', language)}
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.95rem',
            }}>
              {t('auth.getStarted', language)}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '0.5rem',
              }}>
                {t('auth.fullName', language)} *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    paddingLeft: '2.75rem',
                    fontSize: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: 'white',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ff3366'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,51,102,0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <FaUser style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.25rem',
                  color: 'rgba(255,255,255,0.6)',
                }} />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '0.5rem',
              }}>
                {t('auth.email', language)} *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    paddingLeft: '2.75rem',
                    fontSize: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: 'white',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ff3366'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,51,102,0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <FaEnvelope style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.25rem',
                  color: 'rgba(255,255,255,0.6)',
                }} />
              </div>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '0.5rem',
              }}>
                {t('auth.phone', language)} *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    paddingLeft: '2.75rem',
                    fontSize: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: 'white',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ff3366'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,51,102,0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <FaPhone style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.25rem',
                  color: 'rgba(255,255,255,0.6)',
                }} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '0.5rem',
              }}>
                {t('auth.password', language)} *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    paddingLeft: '2.75rem',
                    paddingRight: '3rem',
                    fontSize: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: 'white',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ff3366'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,51,102,0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <FaLock style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.25rem',
                  color: 'rgba(255,255,255,0.6)',
                }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    padding: '0.25rem',
                    color: 'rgba(255,255,255,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '0.5rem',
              }}>
                {t('auth.confirmPassword', language)} *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    paddingLeft: '2.75rem',
                    paddingRight: '3rem',
                    fontSize: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: formData.password && formData.password !== formData.confirmPassword ? '2px solid #ff3366' : '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: 'white',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ff3366'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,51,102,0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = formData.password && formData.password !== formData.confirmPassword ? '#ff3366' : 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <FaLock style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.25rem',
                  color: 'rgba(255,255,255,0.6)',
                }} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    padding: '0.25rem',
                    color: 'rgba(255,255,255,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <small style={{
                  color: '#ff3366',
                  fontSize: '0.8rem',
                  marginTop: '0.25rem',
                  display: 'block',
                }}>
                  Passwords do not match
                </small>
              )}
            </div>

            {/* Title Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '0.5rem',
              }}>
                {t('auth.title', language)} *
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  name="selectedTitleId"
                  value={formData.selectedTitleId}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    paddingLeft: '2.75rem',
                    fontSize: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    color: 'white',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ff3366'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,51,102,0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <option value="" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>{t('auth.selectTitle', language)}</option>
                  {titles.map((title) => (
                    <option key={title.id} value={title.id} style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
                      {title.name}
                    </option>
                  ))}
                </select>
                <FaBook style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.25rem',
                  color: 'rgba(255,255,255,0.6)',
                }} />
              </div>
            </div>

            {/* Deposit Info */}
            {selectedTitle && (
              <>
                <div style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(255,51,102,0.1)',
                  border: '2px solid #ff3366',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <FaMoneyBillWave style={{ fontSize: '1.5rem', color: '#ff3366' }} />
                  <div>
                    <strong style={{ color: '#ff3366', display: 'block', marginBottom: '0.25rem' }}>
                      {t('auth.depositRequired', language)}
                    </strong>
                    <span style={{ color: 'white', fontSize: '1.1rem', fontWeight: '600' }}>
                      {(selectedTitle.deposit_amount_birr || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr
                    </span>
                  </div>
                </div>
                
                {/* Bank Account */}
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: '0.5rem',
                  }}>
                    Bank Account Number
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                  }}>
                    <FaUniversity style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                    <span style={{
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      flex: 1,
                      userSelect: 'all',
                      cursor: 'text',
                    }}>
                      1234567890
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('1234567890')
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copied ? '#28a745' : 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                        borderRadius: '4px',
                      }}
                      onMouseEnter={(e) => {
                        if (!copied) {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                          e.currentTarget.style.color = '#ff3366'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!copied) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                        }
                      }}
                    >
                      {copied ? <FaCheckCircle /> : <FaCopy />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <small style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.8rem',
                    marginTop: '0.5rem',
                    display: 'block',
                  }}>
                    Please transfer the deposit amount to the bank account above
                  </small>
                </div>
              </>
            )}

            {/* File Upload */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '0.5rem',
              }}>
                {t('auth.paymentReceipt', language)} *
              </label>
              <div style={{
                border: '2px dashed rgba(255,255,255,0.2)',
                borderRadius: '10px',
                padding: '1.5rem',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                backgroundColor: receiptFile ? 'rgba(255,51,102,0.1)' : 'rgba(255,255,255,0.05)',
                cursor: 'pointer',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!receiptFile) {
                  e.currentTarget.style.borderColor = '#ff3366'
                  e.currentTarget.style.backgroundColor = 'rgba(255,51,102,0.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (!receiptFile) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                }
              }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    opacity: 0,
                    cursor: 'pointer',
                  }}
                />
                {receiptFile ? (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', color: '#ff3366' }}>
                      <FaCheckCircle />
                    </div>
                    <p style={{ color: 'white', fontWeight: '600', margin: 0 }}>
                      {receiptFile.name}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '0.25rem', margin: 0 }}>
                      Click to change file
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                      <FaFileUpload />
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '600', margin: 0 }}>
                      Click to upload receipt
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '0.25rem', margin: 0 }}>
                      PNG, JPG or PDF (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: 'rgba(255,51,102,0.1)',
                border: '2px solid #ff3366',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <FaExclamationTriangle style={{ fontSize: '1.25rem', color: '#ff3366', flexShrink: 0 }} />
                <span style={{
                  color: '#ff3366',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: loading ? 'rgba(255,255,255,0.1)' : '#ff3366',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(255,51,102,0.3)',
                marginBottom: '1.5rem',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#ff1a52'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,51,102,0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#ff3366'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,51,102,0.3)'
                }
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <FaSpinner style={{
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  {t('auth.registering', language)}
                </span>
              ) : (
                t('auth.signUp', language)
              )}
            </button>

            {/* Login Link */}
            <div style={{
              textAlign: 'center',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
                margin: 0,
              }}>
                {t('auth.hasAccount', language)}{' '}
                <Link to="/login" style={{
                  color: '#ff3366',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ff1a52'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#ff3366'}
                >
                  {t('auth.login', language)}
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Back to Home Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
        }}>
          <Link to="/" style={{
            color: 'rgba(255,255,255,0.7)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ff3366'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >
            <FaArrowLeft /> {t('auth.backToHome', language)}
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Fix autofill styling - use light background with dark text for readability */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #f5f5f5 inset !important;
          -webkit-text-fill-color: #1a1a1a !important;
          box-shadow: 0 0 0 30px #f5f5f5 inset !important;
          transition: background-color 5000s ease-in-out 0s;
          caret-color: #1a1a1a !important;
        }
        
        input:-webkit-autofill::first-line {
          -webkit-text-fill-color: #1a1a1a !important;
          color: #1a1a1a !important;
        }
        
        /* For Firefox autofill */
        input:-moz-autofill {
          background-color: #f5f5f5 !important;
          color: #1a1a1a !important;
        }
      `}</style>
    </div>
  )
}

export default RegisterPage
