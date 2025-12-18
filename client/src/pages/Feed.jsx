import { useState, useEffect } from 'react'
import { Video, RefreshCw } from 'lucide-react'
import { api } from '../api'
import { useStore } from '../store/useStore'
import { t } from '../utils/i18n'
import VideoCard, { VideoCardSkeleton } from '../components/VideoCard'

export default function Feed() {
  const { language } = useStore()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    }
    try {
      const data = await api.getFeed()
      setVideos(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadVideos(true)
  }

  if (loading) {
    return (
      <div className="feed">
        <div className="feed-header">
          <h1 className="feed-title">{t('forYou', language)}</h1>
          <p className="feed-subtitle">{t('discoverVideos', language)}</p>
        </div>
        <VideoCardSkeleton />
        <VideoCardSkeleton />
        <VideoCardSkeleton />
      </div>
    )
  }

  return (
    <div className="feed">
      <div className="feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="feed-title">{t('forYou', language)}</h1>
          <p className="feed-subtitle">{t('discoverVideos', language)}</p>
        </div>
        <button 
          className="btn btn-ghost btn-icon" 
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ marginTop: 4 }}
        >
          <RefreshCw size={20} className={refreshing ? 'spinning' : ''} style={{ 
            animation: refreshing ? 'spin 1s linear infinite' : 'none' 
          }} />
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Video size={32} />
          </div>
          <h3 className="empty-title">{t('noVideos', language)}</h3>
          <p className="empty-text">{t('beFirstToUpload', language)}</p>
        </div>
      ) : (
        videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))
      )}
    </div>
  )
}
