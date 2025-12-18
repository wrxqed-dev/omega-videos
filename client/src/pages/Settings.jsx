import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, Check } from 'lucide-react'
import { useStore } from '../store/useStore'
import { t, languages } from '../utils/i18n'

export default function Settings() {
  const { user, language, setLanguage } = useStore()
  const navigate = useNavigate()
  const [selectedLang, setSelectedLang] = useState(language)
  const [saved, setSaved] = useState(false)

  if (!user) {
    navigate('/')
    return null
  }

  const handleSave = async () => {
    await setLanguage(selectedLang)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="settings-page">
      <h1>{t('settingsTitle', language)}</h1>

      <div className="settings-section">
        <div className="settings-label">
          <Globe size={20} />
          <span>{t('language', language)}</span>
        </div>

        <div className="language-options">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`language-option ${selectedLang === lang.code ? 'active' : ''}`}
              onClick={() => setSelectedLang(lang.code)}
            >
              <span className="lang-flag">{lang.code === 'en' ? '🇺🇸' : '🇷🇺'}</span>
              <span>{lang.name}</span>
              {selectedLang === lang.code && <Check size={18} className="check-icon" />}
            </button>
          ))}
        </div>
      </div>

      <button 
        className="btn btn-primary save-settings-btn" 
        onClick={handleSave}
        disabled={selectedLang === language}
      >
        {saved ? (
          <>
            <Check size={18} />
            {t('settingsSaved', selectedLang)}
          </>
        ) : (
          t('saveSettings', selectedLang)
        )}
      </button>
    </div>
  )
}
