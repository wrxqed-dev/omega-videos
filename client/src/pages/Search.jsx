import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { SearchX, Search } from 'lucide-react'
import { api } from '../api'
import { useStore } from '../store/useStore'
import { t } from '../utils/i18n'
import VideoCard, { VideoCardSkeleton } from '../components/VideoCard'

export default function SearchPage() {
  const { query } = useParams()
  const { language } = useStore()
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
            {language === 'ru' ? 'Поиск' : 'Search'}
          </h1>
          <p className="feed-subtitle">{language === 'ru' ? 'Ищем' : 'Searching'} "{decodeURIComponent(query)}"...</p>
        </div>
        <VideoCardSkeleton />
        <VideoCardSkeleton />
      </div>
    )
  }

  return (
    <div className="feed">
      <div className="feed-header">
        <h1 className="feed-title">{t('searchResults', language)}</h1>
        <p className="feed-subtitle">
          {language === 'ru' 
            ? `По запросу "${decodeURIComponent(query)}" найдено ${videos.length} видео`
            : `Found ${videos.length} videos for "${decodeURIComponent(query)}"`
          }
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <SearchX size={32} />
          </div>
          <h3 className="empty-title">{t('noResults', language)}</h3>
          <p className="empty-text">{t('tryDifferentQuery', language)}</p>
        </div>
      ) : (
        videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))
      )}
    </div>
  )
}
