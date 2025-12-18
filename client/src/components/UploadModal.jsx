import { useState, useRef } from 'react'
import { X, Upload, Film, CheckCircle } from 'lucide-react'
import { useStore } from '../store/useStore'
import { api } from '../api'

export default function UploadModal() {
  const { setModal } = useStore()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef()

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) {
      // Check file size (100MB max)
      if (f.size > 100 * 1024 * 1024) {
        setError('Файл слишком большой. Максимум 100MB')
        return
      }
      setFile(f)
      setPreview(URL.createObjectURL(f))
      setError('')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('video/')) {
      if (f.size > 100 * 1024 * 1024) {
        setError('Файл слишком большой. Максимум 100MB')
        return
      }
      setFile(f)
      setPreview(URL.createObjectURL(f))
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Выберите видео')
      return
    }

    setError('')
    setLoading(true)
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + Math.random() * 15
      })
    }, 200)

    const formData = new FormData()
    formData.append('video', file)
    formData.append('title', e.target.title.value)
    formData.append('description', e.target.description.value)

    try {
      await api.uploadVideo(formData)
      clearInterval(progressInterval)
      setProgress(100)
      setSuccess(true)
      
      // Close and refresh after success animation
      setTimeout(() => {
        setModal(null)
        window.location.reload()
      }, 1500)
    } catch (err) {
      clearInterval(progressInterval)
      setError(err.message)
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB'
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (success) {
    return (
      <div className="modal-overlay" onClick={() => setModal(null)}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 80,
            height: 80,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'fadeInUp 0.5s ease'
          }}>
            <CheckCircle size={40} />
          </div>
          <h2 style={{ marginBottom: 8 }}>Видео загружено!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Перенаправляем...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={() => !loading && setModal(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2 className="modal-title">Загрузить видео</h2>
          <button className="modal-close" onClick={() => !loading && setModal(null)} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!preview ? (
            <div 
              className="file-upload"
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="file-upload-icon" size={56} />
              <p className="file-upload-text">
                <span>Нажмите для выбора</span> или перетащите видео
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                MP4, WebM или MOV • до 100MB • до 60 секунд
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="video-preview">
              <video
                src={preview}
                controls
                style={{ width: '100%', maxHeight: 280, borderRadius: 12, background: '#000' }}
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: 12,
                padding: '12px 16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Film size={20} style={{ color: 'var(--accent)' }} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>{file.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { setFile(null); setPreview(null) }}
                  disabled={loading}
                  style={{ padding: '8px 12px', fontSize: 13 }}
                >
                  Изменить
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Название *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="Дай название своему видео"
              required
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea
              name="description"
              className="form-input"
              placeholder="Расскажи о чем это видео..."
              rows={3}
              maxLength={500}
              disabled={loading}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          {loading && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 8,
                fontSize: 13,
                color: 'var(--text-secondary)'
              }}>
                <span>Загрузка...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div style={{ 
                height: 6, 
                background: 'var(--bg-tertiary)', 
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <div style={{ 
                  height: '100%', 
                  width: `${progress}%`, 
                  background: 'var(--gradient)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary form-submit"
            disabled={loading || !file}
          >
            {loading ? 'Загружаем...' : 'Опубликовать'}
          </button>
        </form>
      </div>
    </div>
  )
}
