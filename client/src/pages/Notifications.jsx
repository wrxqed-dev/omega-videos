import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Video, Trash2, Bell } from 'lucide-react'
import { api } from '../api'
import { useStore } from '../store/useStore'
import { formatTimeAgo } from '../utils/time'
import { t } from '../utils/i18n'

export default function Notifications() {
  const { user, language } = useStore()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    loadNotifications()
  }, [user])

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications()
      setNotifications(data)
      // Mark all as read
      const unreadIds = data.filter(n => !n.is_read).map(n => n.id)
      if (unreadIds.length > 0) {
        await api.markNotificationsRead(unreadIds)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteNotification(id)
      setNotifications(notifications.filter(n => n.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleClearAll = async () => {
    try {
      await api.clearNotifications()
      setNotifications([])
    } catch (err) {
      console.error(err)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={18} className="notif-icon notif-icon-like" />
      case 'comment': return <MessageCircle size={18} className="notif-icon notif-icon-comment" />
      case 'follow': return <UserPlus size={18} className="notif-icon notif-icon-follow" />
      case 'new_video': return <Video size={18} className="notif-icon notif-icon-video" />
      default: return <Bell size={18} className="notif-icon" />
    }
  }

  const getMessage = (n) => {
    switch (n.type) {
      case 'like': return <><strong>@{n.from_username}</strong> {t('likedYourVideo', language)}</>
      case 'comment': return <><strong>@{n.from_username}</strong> {t('commentedOnVideo', language)}</>
      case 'follow': return <><strong>@{n.from_username}</strong> {t('followedYou', language)}</>
      case 'new_video': return <><strong>@{n.from_username}</strong> {t('postedNewVideo', language)}</>
      default: return <><strong>@{n.from_username}</strong></>
    }
  }

  const getAvatar = (username, avatar) => {
    return avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=fe2c55`
  }

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="loading"><div className="spinner" /></div>
      </div>
    )
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>{t('notificationsTitle', language)}</h1>
        {notifications.length > 0 && (
          <button className="btn btn-ghost" onClick={handleClearAll}>
            <Trash2 size={18} />
            {t('clearAll', language)}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Bell size={32} /></div>
          <h3 className="empty-title">{t('noNotifications', language)}</h3>
          <p className="empty-text">{t('notificationsWillAppear', language)}</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(n => (
            <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
              <Link to={`/user/${n.from_username}`} className="notification-avatar">
                <img src={getAvatar(n.from_username, n.from_avatar)} alt="" />
                <div className="notification-type-icon">{getIcon(n.type)}</div>
              </Link>
              
              <div className="notification-content">
                <p className="notification-text">{getMessage(n)}</p>
                {n.video_title && (
                  <p className="notification-video">"{n.video_title}"</p>
                )}
                <span className="notification-time">{formatTimeAgo(n.created_at, language)}</span>
              </div>

              {n.video_filename && (
                <Link to={`/video/${n.video_id}`} className="notification-thumb">
                  <video src={n.video_filename} muted />
                </Link>
              )}

              <button className="notification-delete" onClick={() => handleDelete(n.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
