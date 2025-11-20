import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../i18n'
import LanguageSwitcher from './LanguageSwitcher'
import { 
  FaHome, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes, 
  FaBook, 
  FaUsers, 
  FaGraduationCap,
  FaChartBar,
} from 'react-icons/fa'

const DashboardLayout = ({ children, isAdmin = false }) => {
  const { signOut, userProfile } = useAuth()
  const { language } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mobile sidebar removed - using bottom menu only

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const adminMenuItems = [
    { path: '/admin', icon: FaChartBar, label: 'Dashboard' },
    { path: '/admin/enrolments', icon: FaUsers, label: 'Enrolments' },
    { path: '/admin/titles', icon: FaBook, label: 'Titles' },
    { path: '/admin/courses', icon: FaGraduationCap, label: 'Courses' },
  ]

  const studentMenuItems = [
    { path: '/dashboard', icon: FaBook, label: t('dashboard.title', language) },
  ]

  const menuItems = isAdmin ? adminMenuItems : studentMenuItems

  const Sidebar = () => {
    const sidebarRef = useRef(null)
    
    // Ensure sidebar scrolls to top when opened
    useEffect(() => {
      if (sidebarOpen && sidebarRef.current) {
        sidebarRef.current.scrollTop = 0
      }
    }, [sidebarOpen])
    
    return (
    <aside
      ref={sidebarRef}
      className="dashboard-sidebar"
      style={{
        width: isMobile ? '220px' : '260px',
        height: isMobile ? '100vh' : 'calc(100vh - 80px)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        position: 'fixed',
        top: isMobile ? 0 : '80px',
        left: isMobile ? (sidebarOpen ? 0 : '-220px') : 0,
        zIndex: isMobile ? 1000 : 100,
        transition: 'left 0.3s ease',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 0,
        pointerEvents: isMobile && !sidebarOpen ? 'none' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Top Section - Logo and Menu */}
      <div style={{ 
        flex: '0 0 auto',
        paddingTop: '1.5rem',
        paddingBottom: '1rem',
      }}>
        {/* Logo */}
        <div style={{
          padding: '0 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.25rem',
          }}>
            Q
          </div>
          <div 
            className="sidebar-brand-text"
            style={{ 
              color: 'white', 
              fontSize: '1rem', 
              fontWeight: '600', 
              letterSpacing: '0.5px',
            }}
          >
            QUANTUM LMS
          </div>
        </div>

        {/* Menu Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem' }}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  if (isMobile) {
                    setSidebarOpen(false)
                  }
                  e.stopPropagation()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                  backgroundColor: isActive ? 'rgba(255,51,102,0.2)' : 'transparent',
                  borderLeft: isActive ? '3px solid #ff3366' : '3px solid transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 1001,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = 'white'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                  }
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = '2px solid #ff3366'
                  e.currentTarget.style.outlineOffset = '2px'
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = 'white'
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none'
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                  }
                }}
                aria-label={item.label}
                tabIndex={0}
              >
                <Icon style={{ fontSize: '1.25rem' }} aria-hidden="true" />
                <span style={{ fontWeight: isActive ? '600' : '500' }}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Spacer to push user info to bottom */}
      <div style={{ flex: '1 1 auto', minHeight: '1rem' }} />

      {/* Bottom Section - User Info (pushed to bottom) */}
      <div style={{
        padding: '1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        flex: '0 0 auto',
        backgroundColor: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
          }}>
            {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userProfile?.full_name || 'User'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
              {isAdmin ? t('dashboard.admin.role', language) || 'Admin' : t('dashboard.student.role', language) || 'Student'}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleLogout()
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(255,51,102,0.1)',
            border: '1px solid rgba(255,51,102,0.3)',
            borderRadius: '8px',
            color: '#ff3366',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: '500',
            position: 'relative',
            zIndex: 1001,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,51,102,0.2)'
            e.currentTarget.style.borderColor = '#ff3366'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,51,102,0.1)'
            e.currentTarget.style.borderColor = 'rgba(255,51,102,0.3)'
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid #ff3366'
            e.currentTarget.style.outlineOffset = '2px'
            e.currentTarget.style.backgroundColor = 'rgba(255,51,102,0.2)'
            e.currentTarget.style.borderColor = '#ff3366'
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none'
            e.currentTarget.style.backgroundColor = 'rgba(255,51,102,0.1)'
            e.currentTarget.style.borderColor = 'rgba(255,51,102,0.3)'
          }}
          aria-label={t('navigation.logout', language)}
        >
          <FaSignOutAlt aria-hidden="true" />
          <span>{t('navigation.logout', language)}</span>
        </button>
      </div>
    </aside>
    )
  }

  const BottomMenu = () => (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(26,26,26,0.95)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '0.75rem 0',
      zIndex: 999,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
    }}>
      {menuItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isActive ? '#ff3366' : 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s ease',
              minWidth: '60px',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
              }
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid #ff3366'
              e.currentTarget.style.outlineOffset = '2px'
              if (!isActive) {
                e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none'
              if (!isActive) {
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
              }
            }}
            aria-label={item.label}
            tabIndex={0}
          >
            <Icon style={{ fontSize: '1.25rem' }} aria-hidden="true" />
            <span style={{ fontSize: '0.7rem', fontWeight: isActive ? '600' : '400' }}>
              {item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label}
            </span>
          </Link>
        )
      })}
      <button
        onClick={handleLogout}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minWidth: '60px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ff3366'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = '2px solid #ff3366'
          e.currentTarget.style.outlineOffset = '2px'
          e.currentTarget.style.color = '#ff3366'
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = 'none'
          e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
        }}
        aria-label={t('navigation.logout', language)}
      >
        <FaSignOutAlt style={{ fontSize: '1.25rem' }} aria-hidden="true" />
        <span style={{ fontSize: '0.7rem' }}>{t('navigation.logout', language)}</span>
      </button>
    </nav>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', overflowX: 'hidden', width: '100%', maxWidth: '100vw', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 999,
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: 'white',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.25rem',
            }}>
              Q
            </div>
            <span 
              className="header-brand-text"
              style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                letterSpacing: '0.5px',
              }}
            >
              QUANTUM LMS
            </span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <LanguageSwitcher />
          {!isMobile && (
            <Link
              to="/"
              style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ff3366'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            >
              <FaHome style={{ fontSize: '1.1rem' }} />
            </Link>
          )}
        </div>
      </header>

      {/* Content Wrapper - Sidebar + Main */}
      <div style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        position: 'relative',
      }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div style={{
          paddingBottom: isMobile ? '80px' : '2rem',
          minHeight: isMobile ? 'calc(100vh - 80px)' : 'calc(100vh - 80px)',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          width: isMobile ? '100%' : 'auto',
          marginLeft: isMobile ? 0 : '260px',
          overflowX: 'hidden',
          boxSizing: 'border-box',
        }}>
        <main style={{
          padding: '2rem',
          maxWidth: '1400px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
          width: '100%',
          flex: '1 1 auto',
          overflowX: 'hidden',
          boxSizing: 'border-box',
        }}>
          {children}
        </main>
        </div>
      </div>

      {/* Bottom Menu (Mobile) */}
      {isMobile && <BottomMenu />}

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-brand-text,
          .header-brand-text {
            display: none !important;
          }
          
          .dashboard-sidebar {
            width: 220px !important;
          }
        }
        
        @media (max-width: 640px) {
          .sidebar-brand-text,
          .header-brand-text {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default DashboardLayout

