import { useState } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../store/useStore'
import { t } from '../utils/i18n'

export default function AuthModal() {
  const { setModal, authTab, setAuthTab, login, register, language } = useStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.target
    const data = {
      email: form.email.value,
      password: form.password.value,
      ...(authTab === 'register' && { username: form.username.value })
    }

    try {
      if (authTab === 'login') {
        await login(data)
      } else {
        await register(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={() => setModal(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {authTab === 'login' ? t('welcomeBack', language) : t('createAccount', language)}
          </h2>
          <button className="modal-close" onClick={() => setModal(null)}>
            <X size={20} />
          </button>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${authTab === 'login' ? 'active' : ''}`}
            onClick={() => { setAuthTab('login'); setError('') }}
          >
            {t('loginBtn', language)}
          </button>
          <button
            className={`auth-tab ${authTab === 'register' ? 'active' : ''}`}
            onClick={() => { setAuthTab('register'); setError('') }}
          >
            {t('registerBtn', language)}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {authTab === 'register' && (
            <div className="form-group">
              <label className="form-label">{t('username', language)}</label>
              <div style={{ position: 'relative' }}>
                <User 
                  size={18} 
                  style={{ 
                    position: 'absolute', 
                    left: 14, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }} 
                />
                <input
                  type="text"
                  name="username"
                  className="form-input"
                  placeholder="username"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  title="Только буквы, цифры и подчеркивание"
                  style={{ paddingLeft: 44 }}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t('email', language)}</label>
            <div style={{ position: 'relative' }}>
              <Mail 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: 14, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} 
              />
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="your@email.com"
                required
                style={{ paddingLeft: 44 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('password', language)}</label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: 14, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} 
              />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder={authTab === 'register' ? 'Минимум 6 символов' : '••••••••'}
                minLength={6}
                required
                style={{ paddingLeft: 44, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 10
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary form-submit" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              </span>
            ) : authTab === 'login' ? t('loginBtn', language) : t('registerBtn', language)}
          </button>
        </form>
      </div>
    </div>
  )
}
