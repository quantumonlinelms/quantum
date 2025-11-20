import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaExclamationTriangle, FaArrowLeft, FaSpinner, FaClock, FaTimesCircle } from 'react-icons/fa'

const LoginPage = () => {
  const { signIn, signOut, userProfile, user, loading } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [declinedEnrolment, setDeclinedEnrolment] = useState(null)

  // Check for declined enrolment when user logs in
  useEffect(() => {
    const checkDeclinedEnrolment = async () => {
      if (user && userProfile && !loading && !submitting && userProfile.role !== 'admin') {
        try {
          // Check if user has any declined enrolment with a comment
          const { data: enrolments, error: enrolError } = await supabase
            .from('enrolments')
            .select('id, status, admin_comment, reviewed_at, courses(title)')
            .eq('user_id', user.id)
            .eq('status', 'declined')
            .order('reviewed_at', { ascending: false })
            .limit(1)

          if (!enrolError && enrolments && enrolments.length > 0) {
            const declined = enrolments[0]
            if (declined.admin_comment) {
              setDeclinedEnrolment(declined)
            }
          }
        } catch (err) {
          console.error('Error checking declined enrolment:', err)
        }
      }
    }

    checkDeclinedEnrolment()
  }, [user, userProfile, loading, submitting])

  // Redirect after login based on approval status
  useEffect(() => {
    if (user && userProfile && !loading && !submitting) {
      // Admins are always approved, or if user is approved
      if (userProfile.role === 'admin' || userProfile.approved === true) {
        // Redirect to portal
        const redirectPath = userProfile.role === 'admin' ? '/admin' : '/dashboard'
        navigate(redirectPath, { replace: true })
      }
      // If not approved and not admin, stay on login page and show pending/declined message
    }
  }, [user, userProfile, loading, submitting, navigate])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('') // Clear error when user types
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const result = await signIn(formData.emailOrPhone, formData.password)

      if (result?.error) {
        setError(result.error.message || 'Login failed')
        setSubmitting(false)
        return
      }

      // Profile will be fetched by signIn, then useEffect will handle redirect
      setSubmitting(false)
    } catch (err) {
      setError(err.message || 'Login failed')
      setSubmitting(false)
    }
  }

  // Show declined message if user has declined enrolment with comment
  if (user && userProfile && !loading && declinedEnrolment && declinedEnrolment.admin_comment) {
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
            fontSize: '4rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'center',
            color: '#dc3545',
          }}>
            <FaTimesCircle />
          </div>
          <h2 style={{
            color: 'white',
            marginBottom: '1rem',
            fontSize: '1.75rem',
            fontWeight: '700',
          }}>Enrolment Declined</h2>
          <div style={{
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            border: '2px solid #dc3545',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <p style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#dc3545',
              marginBottom: '0.75rem',
            }}>
              STATUS: DECLINED
            </p>
            {declinedEnrolment.courses && (
              <p style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.9rem',
                marginBottom: '1rem',
              }}>
                Course: {declinedEnrolment.courses.title}
              </p>
            )}
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem',
            }}>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                textAlign: 'left',
              }}>
                Administrator Comment:
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.9)',
                lineHeight: '1.6',
                fontSize: '0.95rem',
                textAlign: 'left',
                fontStyle: 'italic',
              }}>
                "{declinedEnrolment.admin_comment}"
              </p>
            </div>
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}>
            Your enrolment has been declined. Please review the administrator's comment above and contact support if you have any questions.
          </p>
          <button
            onClick={signOut}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
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
            {t('navigation.logout', language)}
          </button>
        </div>
      </div>
    )
  }

  // Show pending message if logged in but not approved
  // Don't show if still loading (wait for real profile to load)
  // Admins are always considered approved
  if (user && userProfile && !loading && !userProfile.approved && userProfile.role !== 'admin') {
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
            fontSize: '4rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'center',
            color: '#ff3366',
          }}>
            <FaClock />
          </div>
          <h2 style={{
            color: 'white',
            marginBottom: '1rem',
            fontSize: '1.75rem',
            fontWeight: '700',
          }}>{t('auth.pendingApproval', language)}</h2>
          <div style={{
            backgroundColor: 'rgba(255,51,102,0.1)',
            border: '2px solid #ff3366',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <p style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#ff3366',
              marginBottom: '0.5rem',
            }}>
              {t('auth.pendingStatus', language)}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              lineHeight: '1.6',
              marginBottom: '0.75rem',
            }}>
              {t('auth.pendingMessage', language)}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              lineHeight: '1.6',
              fontSize: '0.9rem',
            }}>
              {t('auth.pendingDetails', language)}
            </p>
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.9rem',
            fontStyle: 'italic',
            marginBottom: '1.5rem',
          }}>
            {t('auth.checkBackLater', language)}
          </p>
          <button
            onClick={signOut}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#ff3366',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
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
            {t('navigation.logout', language)}
          </button>
        </div>
      </div>
    )
  }

  // Show loading only if we're actively submitting login OR if we have a user but no profile
  // Don't show loading if there's no user (just show login form)
  if ((submitting || (loading && user && !userProfile)) && !error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <FaSpinner style={{
            fontSize: '3rem',
            color: '#ff3366',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
            display: 'block',
          }} />
          <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>{t('auth.loggingIn', language)}</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Loading your profile...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
        maxWidth: '450px',
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

        {/* Login Card */}
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
              {t('auth.welcomeBack', language)}
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.95rem',
            }}>
              {t('auth.signIn', language)} to continue to your account
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email/Phone Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '0.5rem',
              }}>
                {t('auth.emailOrPhone', language)}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="emailOrPhone"
                  value={formData.emailOrPhone}
                  onChange={handleInputChange}
                  placeholder={t('auth.emailOrPhonePlaceholder', language)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    paddingLeft: '2.75rem',
                    fontSize: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: error ? '2px solid #ff3366' : '2px solid rgba(255,255,255,0.1)',
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
                    e.currentTarget.style.borderColor = error ? '#ff3366' : 'rgba(255,255,255,0.1)'
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
              <small style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.8rem',
                marginTop: '0.25rem',
                display: 'block',
              }}>
                {t('auth.emailOrPhoneHint', language)}
              </small>
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '0.5rem',
              }}>
                {t('auth.password', language)}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    paddingLeft: '2.75rem',
                    paddingRight: '3rem',
                    fontSize: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: error ? '2px solid #ff3366' : '2px solid rgba(255,255,255,0.1)',
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
                    e.currentTarget.style.borderColor = error ? '#ff3366' : 'rgba(255,255,255,0.1)'
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
              disabled={submitting}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: submitting ? 'rgba(255,255,255,0.1)' : '#ff3366',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: submitting ? 'none' : '0 4px 12px rgba(255,51,102,0.3)',
                marginBottom: '1.5rem',
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = '#ff1a52'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,51,102,0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = '#ff3366'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,51,102,0.3)'
                }
              }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <FaSpinner style={{
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  {t('auth.loggingIn', language)}
                </span>
              ) : (
                t('auth.signIn', language)
              )}
            </button>

            {/* Register Link */}
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
                {t('auth.noAccount', language)}{' '}
                <Link to="/register" style={{
                  color: '#ff3366',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ff1a52'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#ff3366'}
                >
                  {t('auth.register', language)}
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

export default LoginPage
