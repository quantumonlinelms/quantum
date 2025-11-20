import { createContext, useContext, useState, useEffect } from 'react'
import { getLanguage, setLanguage as setLangStorage } from '../i18n'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getLanguage())

  useEffect(() => {
    setLanguageState(getLanguage())
  }, [])

  const setLanguage = (lang) => {
    setLangStorage(lang)
    setLanguageState(lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}


