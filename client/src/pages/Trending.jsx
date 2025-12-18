import { useState, useEffect } from 'react'
import { Flame, TrendingUp } from 'lucide-react'
import { api } from '../api'
import VideoCard, { VideoCardSkeleton } from '../components/VideoCard'

export default function Trending() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async () => {
    try {
      const data = await api.getTrending()
      setVideos(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="feed">
        <div className="feed-header">
          <h1 className="feed-title">
            <Flame size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: 'var(--accent)' }} />
            Тренды
          </h1>
          <p className="feed-subtitle">Самые популярные видео</p>
        </div>
        <VideoCardSkeleton />
        <VideoCardSkeleton />
      </div>
    )
  }

  return (
    <div className="feed">
      <div className="feed-header">
        <h1 className="feed-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flame size={28} style={{ color: 'var(--accent)' }} />
          Тренды
        </h1>
        <p className="feed-subtitle">Самые популярные видео</p>
      </div>

      {videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <TrendingUp size={32} />
          </div>
          <h3 className="empty-title">Пока нет трендов</h3>
          <p className="empty-text">Загрузи видео и попади в тренды!</p>
        </div>
      ) : (
        videos.map((video, index) => (
          <div key={video.id} style={{ position: 'relative' }}>
            {index < 3 && (
              <div style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                background: index === 0 ? 'linear-gradient(135deg, #ffd700, #ffaa00)' : 
                           index === 1 ? 'linear-gradient(135deg, #c0c0c0, #a0a0a0)' :
                           'linear-gradient(135deg, #cd7f32, #a0522d)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {index + 1}
              </div>
            )}
            <VideoCard video={video} />
          </div>
        ))
      )}
    </div>
  )
}
