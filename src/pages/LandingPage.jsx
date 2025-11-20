import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../i18n'
import LanguageSwitcher from '../components/LanguageSwitcher'

const LandingPage = () => {
  const { user, isAdmin } = useAuth()
  const { language } = useLanguage()
  // YouTube video ID for introduction - you can change this
  const introVideoId = 'dQw4w9WgXcQ' // Replace with your actual intro video ID

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
      {/* Navigation Bar */}
      <nav
        style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem 3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              flexShrink: 0,
            }}
          >
            Q
          </div>
          <div 
            className="header-brand-text"
            style={{ 
              color: 'white', 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              letterSpacing: '0.5px',
            }}
          >
            QUANTUM LMS
          </div>
        </div>

        <div 
          className="header-actions"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.5rem', 
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          <LanguageSwitcher />
          {user ? (
            <Link
              to={isAdmin ? '/admin' : '/dashboard'}
              style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.95rem',
                transition: 'color 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ff3366'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            >
              {t('navigation.dashboard', language)}
            </Link>
          ) : (
            <Link
              to="/login"
              style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.95rem',
                transition: 'color 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ff3366'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            >
              {t('navigation.login', language).toUpperCase()}
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          backgroundColor: '#1a1a1a',
          padding: '6rem 3rem',
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}>
          {/* Left Side - Text Content */}
          <div>
            {/* Tagline */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              <div style={{
                width: '60px',
                height: '2px',
                backgroundColor: 'white',
              }}></div>
              <span style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.9rem',
                fontWeight: '500',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}>
                Online Learning Platform
              </span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: '4.5rem',
                fontWeight: '800',
                color: 'white',
                lineHeight: '1.1',
                marginBottom: '2rem',
                letterSpacing: '-1px',
              }}
            >
              {language === 'en' ? (
                <>
                  Transform Your{' '}
                  <span style={{ color: '#ff3366' }}>
                    Future
                  </span>
                  {' '}with Quantum Learning
                </>
              ) : (
                <>
                  የወደፊት ህይወትዎን ሊቀይሩ{' '}
                  <span style={{ color: '#ff3366' }}>
                    የሚችሉ
                  </span>
                  {' '}ትምህርቶችን ይውሰዱ
                </>
              )}
            </h1>

            {/* Body Text */}
            <p
              style={{
                fontSize: '1.1rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: '1.8',
                marginBottom: '3rem',
                maxWidth: '500px',
              }}
            >
              {t('hero.subtitle', language)}
            </p>

            {/* CTA Button */}
            <Link
              to="/register"
              style={{
                backgroundColor: '#ff3366',
                color: 'white',
                padding: '1.25rem 3rem',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                display: 'inline-block',
                transition: 'all 0.3s ease',
                marginBottom: '3rem',
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
              {t('hero.talkToExpert', language)}
            </Link>

          </div>

          {/* Right Side - Video */}
          <div
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#000',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${introVideoId}`}
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
            <div
              style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                color: 'white',
                fontSize: '0.85rem',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: '500',
              }}
            >
              {t('hero.videoOverview', language)}
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 1200px) {
          section > div[style*="grid-template-columns"] {
            gap: 3rem !important;
          }
        }
        
        @media (max-width: 968px) {
          nav {
            padding: 1rem 1.5rem !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 1rem !important;
          }
          
          nav > div:first-child {
            width: auto;
            justify-content: flex-start;
          }
          
          .header-brand-text {
            display: none !important;
          }
          
          nav > div:last-child {
            width: auto;
            justify-content: flex-end;
            margin-left: auto;
          }
          
          section {
            padding: 3rem 1.5rem !important;
          }
          
          section > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
          
          h1 {
            font-size: 2.5rem !important;
            line-height: 1.2 !important;
          }
          
          section > div > div:first-child > div:first-child {
            margin-bottom: 1.5rem !important;
          }
          
          section > div > div:first-child > div:first-child > div {
            width: 40px !important;
          }
          
          section > div > div:first-child > p {
            font-size: 1rem !important;
            margin-bottom: 2rem !important;
            max-width: 100% !important;
          }
          
          section > div > div:first-child > a {
            padding: 1rem 2rem !important;
            font-size: 0.95rem !important;
            margin-bottom: 2rem !important;
            width: 100%;
            text-align: center;
          }
          
          section > div > div:first-child > div:last-child {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          
        }
        
        @media (max-width: 640px) {
          nav {
            padding: 1rem !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
          }
          
          nav > div:first-child {
            gap: 0.5rem !important;
          }
          
          .header-brand-text {
            display: none !important;
          }
          
          .header-actions {
            gap: 0.75rem !important;
          }
          
          section {
            padding: 2rem 1rem !important;
            min-height: auto !important;
          }
          
          section > div {
            padding: 0 !important;
          }
          
          h1 {
            font-size: 2rem !important;
            margin-bottom: 1.5rem !important;
          }
          
          section > div > div:first-child > div:first-child {
            margin-bottom: 1rem !important;
          }
          
          section > div > div:first-child > div:first-child > div {
            width: 30px !important;
          }
          
          section > div > div:first-child > div:first-child > span {
            font-size: 0.75rem !important;
          }
          
          section > div > div:first-child > p {
            font-size: 0.95rem !important;
            margin-bottom: 1.5rem !important;
          }
          
          section > div > div:first-child > a {
            padding: 0.875rem 1.5rem !important;
            font-size: 0.9rem !important;
            margin-bottom: 1.5rem !important;
          }
        }
        
        @media (max-width: 480px) {
          nav {
            padding: 0.75rem 1rem !important;
          }
          
          nav > div:first-child > div:first-child {
            width: 40px !important;
            height: 40px !important;
            font-size: 1.25rem !important;
          }
          
          .header-brand-text {
            display: none !important;
          }
          
          .header-actions {
            gap: 0.5rem !important;
          }
          
          h1 {
            font-size: 1.75rem !important;
          }
          
          section > div > div:first-child > p {
            font-size: 0.9rem !important;
          }
        }
      `}</style>
    </div>
  )
}

export default LandingPage
