import { useLanguage } from '../contexts/LanguageContext'

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage()

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <button
        onClick={() => handleLanguageChange('en')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: language === 'en' ? '#007bff' : 'transparent',
          color: language === 'en' ? 'white' : '#007bff',
          border: '1px solid #007bff',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: language === 'en' ? 'bold' : 'normal',
        }}
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageChange('am')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: language === 'am' ? '#007bff' : 'transparent',
          color: language === 'am' ? 'white' : '#007bff',
          border: '1px solid #007bff',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: language === 'am' ? 'bold' : 'normal',
        }}
      >
        አማ
      </button>
    </div>
  )
}

export default LanguageSwitcher

