import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../i18n'
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa'

const ErrorDisplay = ({ error, onRetry, loading = false }) => {
  const { language } = useLanguage()
  
  if (!error) return null

  return (
    <div
      style={{
        padding: '1.5rem',
        border: '1px solid rgba(255, 51, 102, 0.3)',
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 51, 102, 0.1)',
        color: 'white',
        margin: '1rem 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <FaExclamationTriangle style={{ fontSize: '1.5rem', color: '#ff3366', flexShrink: 0 }} />
        <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '600' }}>
          {t('dashboard.error', language) || 'Error'}
        </h3>
      </div>
      <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: '1.5' }}>
        {error.message || t('dashboard.errorMessage', language) || 'An error occurred while loading data.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: loading ? 'rgba(255, 51, 102, 0.3)' : '#ff3366',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            alignSelf: 'flex-start',
            transition: 'all 0.2s ease',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#ff4d7a'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#ff3366'
              e.currentTarget.style.transform = 'translateY(0)'
            }
          }}
          onFocus={(e) => {
            if (!loading) {
              e.currentTarget.style.outline = '2px solid #ff3366'
              e.currentTarget.style.outlineOffset = '2px'
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none'
          }}
        >
          <FaRedo style={{ fontSize: '0.875rem', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? (t('dashboard.retrying', language) || 'Retrying...') : (t('dashboard.retry', language) || 'Retry')}
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </button>
      )}
    </div>
  )
}

export default ErrorDisplay




