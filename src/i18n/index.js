import enTranslations from './locales/en.json'
import amTranslations from './locales/am.json'

const translations = {
  en: enTranslations,
  am: amTranslations,
}

// Get language from localStorage or default to English
export const getLanguage = () => {
  return localStorage.getItem('language') || 'en'
}

// Set language
export const setLanguage = (lang) => {
  localStorage.setItem('language', lang)
}

// Get translation
export const t = (key, lang = null) => {
  const currentLang = lang || getLanguage()
  const keys = key.split('.')
  let value = translations[currentLang] || translations.en
  
  for (const k of keys) {
    value = value?.[k]
    if (!value) {
      // Fallback to English if translation not found
      value = translations.en
      for (const k2 of keys) {
        value = value?.[k2]
        if (!value) return key
      }
      return key
    }
  }
  
  return value || key
}

export default { t, getLanguage, setLanguage }


