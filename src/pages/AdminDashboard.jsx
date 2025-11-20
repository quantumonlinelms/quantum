import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { t } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'
import { FaUsers, FaGraduationCap, FaUserGraduate, FaSpinner, FaArrowRight } from 'react-icons/fa'

const AdminDashboard = () => {
  const { signOut } = useAuth()
  const { language } = useLanguage()
  const [stats, setStats] = useState({
    pendingEnrolments: 0,
    totalCourses: 0,
    totalStudents: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [pendingResult, coursesResult, studentsResult] = await Promise.all([
        supabase.from('enrolments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      ])

      setStats({
        pendingEnrolments: pendingResult.count || 0,
        totalCourses: coursesResult.count || 0,
        totalStudents: studentsResult.count || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      icon: FaUsers,
      label: t('dashboard.admin.pendingEnrolments', language),
      value: stats.pendingEnrolments,
      color: '#ff3366',
      link: '/admin/enrolments',
    },
    {
      icon: FaGraduationCap,
      label: t('dashboard.admin.totalCourses', language),
      value: stats.totalCourses,
      color: '#667eea',
      link: '/admin/courses',
    },
    {
      icon: FaUserGraduate,
      label: t('dashboard.admin.totalStudents', language),
      value: stats.totalStudents,
      color: '#764ba2',
      link: null,
    },
  ]

  const quickLinks = [
    {
      title: t('dashboard.admin.reviewEnrolments.title', language),
      description: t('dashboard.admin.reviewEnrolments.description', language),
      link: '/admin/enrolments',
      icon: FaUsers,
    },
    {
      title: t('dashboard.admin.manageTitles.title', language),
      description: t('dashboard.admin.manageTitles.description', language),
      link: '/admin/titles',
      icon: FaGraduationCap,
    },
    {
      title: t('dashboard.admin.manageCourses.title', language),
      description: t('dashboard.admin.manageCourses.description', language),
      link: '/admin/courses',
      icon: FaGraduationCap,
    },
  ]

  return (
    <DashboardLayout isAdmin>
      <div>
        <h1 style={{
          color: 'white',
          fontSize: '2rem',
          fontWeight: '800',
          marginBottom: '0.5rem',
        }}>
          {t('dashboard.admin.title', language)}
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '2rem',
        }}>
          {t('dashboard.admin.subtitle', language)}
        </p>

        {loading ? (
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
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>{t('dashboard.admin.loadingStats', language)}</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
              width: '100%',
            }}>
              {statCards.map((stat, index) => {
                const Icon = stat.icon
                const CardContent = (
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    transition: 'all 0.3s ease',
                    cursor: stat.link ? 'pointer' : 'default',
                  }}
                  onMouseEnter={(e) => {
                    if (stat.link) {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.borderColor = stat.color
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (stat.link) {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                  onFocus={(e) => {
                    if (stat.link) {
                      e.currentTarget.style.outline = '2px solid #ff3366'
                      e.currentTarget.style.outlineOffset = '2px'
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.borderColor = stat.color
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }
                  }}
                  onBlur={(e) => {
                    if (stat.link) {
                      e.currentTarget.style.outline = 'none'
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                  tabIndex={stat.link ? 0 : -1}
                  aria-label={stat.label}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        backgroundColor: `${stat.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Icon style={{ fontSize: '1.5rem', color: stat.color }} />
                      </div>
                      {stat.link && (
                        <FaArrowRight style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }} />
                      )}
                    </div>
                    <h3 style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                    }}>
                      {stat.label}
                    </h3>
                    <p style={{
                      fontSize: '2.5rem',
                      fontWeight: '800',
                      color: 'white',
                      margin: 0,
                    }}>
                      {stat.value}
                    </p>
                  </div>
                )

                return stat.link ? (
                  <Link key={index} to={stat.link} style={{ textDecoration: 'none' }}>
                    {CardContent}
                  </Link>
                ) : (
                  <div key={index}>{CardContent}</div>
                )
              })}
            </div>

            {/* Quick Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
              }}>
                {t('dashboard.admin.quickActions', language)}
              </h2>
              {quickLinks.map((link, index) => {
                const Icon = link.icon
                return (
                  <Link
                    key={index}
                    to={link.link}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.borderColor = '#ff3366'
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
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.borderColor = '#ff3366'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none'
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                    aria-label={`${link.title}: ${link.description}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255,51,102,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Icon style={{ fontSize: '1.5rem', color: '#ff3366' }} />
                      </div>
                      <div>
                        <h3 style={{
                          color: 'white',
                          fontSize: '1.1rem',
                          fontWeight: '700',
                          margin: 0,
                          marginBottom: '0.25rem',
                        }}>
                          {link.title}
                        </h3>
                        <p style={{
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.9rem',
                          margin: 0,
                        }}>
                          {link.description}
                        </p>
                      </div>
                    </div>
                    <FaArrowRight style={{ color: '#ff3366', fontSize: '1.25rem' }} />
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
