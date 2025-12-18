import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { SearchX, Search } from 'lucide-react'
import { api } from '../api'
import VideoCard, { VideoCardSkeleton } from '../components/VideoCard'

export default function SearchPage() {
  const { query } = useParams()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (query) {
      loadVideos()
    }
  }, [query])

  const loadVideos = async () => {
    setLoading(true)
    try {
      const data = await api.searchVideos(query)
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
          <h1 className="feed-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={24} />
            Поиск
          </h1>
          <p className="feed-subtitle">Ищем "{decodeURIComponent(query)}"...</p>
        </div>
        <VideoCardSkeleton />
        <VideoCardSkeleton />
      </div>
    )
  }

  return (
    <div className="feed">
      <div className="feed-header">
        <h1 className="feed-title">Результаты поиска</h1>
        <p className="feed-subtitle">
          По запросу "{decodeURIComponent(query)}" найдено {videos.length} видео
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <SearchX size={32} />
          </div>
          <h3 className="empty-title">Ничего не найдено</h3>
          <p className="empty-text">Попробуй другой запрос</p>
        </div>
      ) : (
        videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))
      )}
    </div>
  )
}
