import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Settings, UserPlus, UserMinus, Video, Calendar } from 'lucide-react'
import { api } from '../api'
import { useStore } from '../store/useStore'
import { formatTimeAgo } from '../utils/time'
import VideoCard, { VideoCardSkeleton } from '../components/VideoCard'
import EditProfileModal from '../components/EditProfileModal'

export default function Profile() {
  const { username } = useParams()
  const { user: currentUser, setModal } = useStore()
  const [profile, setProfile] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const [profileData, videosData] = await Promise.all([
        api.getUser(username),
        api.getUserVideos(username)
      ])
      setProfile(profileData)
      setVideos(videosData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!currentUser) {
      setModal('auth')
      return
    }
    
    setFollowLoading(true)
    try {
      if (profile.isFollowing) {
        await api.unfollow(profile.id)
        setProfile({ ...profile, isFollowing: false, followers: profile.followers - 1 })
      } else {
        await api.follow(profile.id)
        setProfile({ ...profile, isFollowing: true, followers: profile.followers + 1 })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setFollowLoading(false)
    }
  }

  const getAvatar = (u) => {
    return u?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u?.username}&backgroundColor=fe2c55&size=120`
  }

  if (loading) {
    return (
      <div className="profile">
        <div className="profile-header" style={{ opacity: 0.5 }}>
          <div className="profile-avatar-section">
            <div className="skeleton avatar-lg" style={{ borderRadius: '50%' }} />
          </div>
          <div className="profile-info">
            <div className="skeleton" style={{ width: 150, height: 28, borderRadius: 6, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: 200, height: 16, borderRadius: 4, marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 32 }}>
              <div className="skeleton" style={{ width: 60, height: 40, borderRadius: 6 }} />
              <div className="skeleton" style={{ width: 60, height: 40, borderRadius: 6 }} />
              <div className="skeleton" style={{ width: 60, height: 40, borderRadius: 6 }} />
            </div>
          </div>
        </div>
        <VideoCardSkeleton />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile">
        <div className="empty-state">
          <h3 className="empty-title">Пользователь не найден</h3>
          <p className="empty-text">Возможно, аккаунт был удален</p>
        </div>
      </div>
    )
  }

  const isOwner = currentUser?.id === profile.id

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="profile-avatar-section">
          <img src={getAvatar(profile)} alt="" className="avatar avatar-lg" />
        </div>
        <div className="profile-info">
          <h1 className="profile-username">@{profile.username}</h1>
          <p className="profile-bio">{profile.bio || 'Пока нет описания'}</p>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            color: 'var(--text-muted)', 
            fontSize: 13,
            marginBottom: 16 
          }}>
            <Calendar size={14} />
            <span>На платформе {formatTimeAgo(profile.created_at)}</span>
          </div>
          
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-value">{profile.videos}</div>
              <div className="profile-stat-label">видео</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{profile.followers}</div>
              <div className="profile-stat-label">подписчиков</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{profile.following}</div>
              <div className="profile-stat-label">подписок</div>
            </div>
          </div>
          
          <div className="profile-actions">
            {isOwner ? (
              <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>
                <Settings size={18} />
                Редактировать
              </button>
            ) : (
              <button
                className={`btn ${profile.isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleFollow}
                disabled={followLoading}
                style={{ minWidth: 140 }}
              >
                {followLoading ? (
                  <span>...</span>
                ) : profile.isFollowing ? (
                  <>
                    <UserMinus size={18} />
                    Отписаться
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Подписаться
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: 20, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Video size={20} />
        Видео
      </h2>

      {videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Video size={32} />
          </div>
          <h3 className="empty-title">Пока нет видео</h3>
          {isOwner && <p className="empty-text">Загрузи своё первое видео!</p>}
        </div>
      ) : (
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}

      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} onUpdate={loadProfile} />}
    </div>
  )
}
