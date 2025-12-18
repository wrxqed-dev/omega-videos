import { useState, useRef } from 'react'
import { X, Camera, Check } from 'lucide-react'
import { api } from '../api'
import { useStore } from '../store/useStore'
import { t } from '../utils/i18n'

export default function EditProfileModal({ onClose, onUpdate }) {
  const { user, updateUser, language } = useStore()
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef()

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        setError('Изображение слишком большое. Максимум 5MB')
        return
      }
      setPreview(URL.createObjectURL(f))
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    if (fileRef.current?.files[0]) {
      formData.append('avatar', fileRef.current.files[0])
    }
    formData.append('bio', e.target.bio.value)

    try {
      const updated = await api.updateProfile(formData)
      updateUser(updated)
      setSuccess(true)
      setTimeout(() => {
        onUpdate()
        onClose()
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getAvatar = () => {
    if (preview) return preview
    return user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}&backgroundColor=fe2c55&size=100`
  }

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 70,
            height: 70,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            animation: 'fadeInUp 0.4s ease'
          }}>
            <Check size={32} />
          </div>
          <h3>{language === 'ru' ? 'Профиль обновлен!' : 'Profile updated!'}</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('editProfileTitle', language)}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                position: 'relative',
                width: 100,
                height: 100,
                margin: '0 auto',
                cursor: 'pointer'
              }}
              onClick={() => fileRef.current?.click()}
            >
              <img
                src={getAvatar()}
                alt=""
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--border)',
                  transition: 'all 0.2s'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 34,
                  height: 34,
                  background: 'var(--accent)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid var(--bg-secondary)',
                  transition: 'transform 0.2s'
                }}
              >
                <Camera size={16} />
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
              {language === 'ru' ? 'Нажми, чтобы изменить фото' : 'Click to change photo'}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('username', language)}</label>
            <input
              type="text"
              className="form-input"
              value={user?.username || ''}
              disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {language === 'ru' ? 'Имя пользователя нельзя изменить' : 'Username cannot be changed'}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">{t('bio', language)}</label>
            <textarea
              name="bio"
              className="form-input"
              placeholder={t('bioPlaceholder', language)}
              defaultValue={user?.bio || ''}
              rows={4}
              maxLength={200}
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
              {language === 'ru' ? 'Максимум 200 символов' : 'Max 200 characters'}
            </p>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              style={{ flex: 1 }}
              disabled={loading}
            >
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? (language === 'ru' ? 'Сохранение...' : 'Saving...') : t('save', language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
