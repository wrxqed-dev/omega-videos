import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Eye, Play, Share2, Bookmark } from 'lucide-react'
import { api } from '../api'
import { useStore } from '../store/useStore'
import { formatTimeAgo, formatCount } from '../utils/time'
import CommentsModal from './CommentsModal'

export default function VideoCard({ video }) {
  const { user, setModal } = useStore()
  const [liked, setLiked] = useState(!!video.isLiked)
  const [likes, setLikes] = useState(video.likes || 0)
  const [playing, setPlaying] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [likeAnimating, setLikeAnimating] = useState(false)
  const videoRef = useRef(null)

  const getAvatar = (username, avatar) => {
    return avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=fe2c55`
  }

  const handleLike = async () => {
    if (!user) {
      setModal('auth')
      return
    }
    
    // Optimistic update with animation
    setLikeAnimating(true)
    setLiked(!liked)
    setLikes(liked ? likes - 1 : likes + 1)
    
    setTimeout(() => setLikeAnimating(false), 400)
    
    try {
      const res = await api.likeVideo(video.id)
      setLiked(res.liked)
      setLikes(res.count)
    } catch (err) {
      // Revert on error
      setLiked(liked)
      setLikes(likes)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handleDoubleClick = () => {
    if (!liked) {
      handleLike()
    }
  }

  return (
    <>
      <article className="video-card">
        <div className="video-header">
          <Link to={`/user/${video.username}`} className="video-user">
            <img src={getAvatar(video.username, video.avatar)} alt="" className="avatar" />
            <div className="video-user-info">
              <h4>@{video.username}</h4>
              <span>{formatTimeAgo(video.created_at)}</span>
            </div>
          </Link>
        </div>

        <div 
          className="video-player-container" 
          onClick={togglePlay}
          onDoubleClick={handleDoubleClick}
        >
          <video
            ref={videoRef}
            className="video-player"
            src={video.filename}
            loop
            playsInline
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          {!playing && (
            <div className="video-play-overlay">
              <div className="play-button">
                <Play size={32} fill="white" color="white" />
              </div>
            </div>
          )}
        </div>

        <div className="video-actions">
          <button 
            className={`action-btn ${liked ? 'liked' : ''}`} 
            onClick={handleLike}
          >
            <Heart 
              size={22} 
              fill={liked ? 'currentColor' : 'none'} 
              className={likeAnimating ? 'like-animation' : ''}
            />
            <span>{formatCount(likes)}</span>
          </button>
          <button className="action-btn" onClick={() => setShowComments(true)}>
            <MessageCircle size={22} />
            <span>{formatCount(video.comments || 0)}</span>
          </button>
          <button className="action-btn">
            <Eye size={22} />
            <span>{formatCount(video.views || 0)}</span>
          </button>
          <button className="action-btn">
            <Bookmark size={22} />
          </button>
          <button className="action-btn" style={{ marginLeft: 'auto' }}>
            <Share2 size={22} />
          </button>
        </div>

        <div className="video-info">
          <h3 className="video-title">{video.title}</h3>
          {video.description && <p className="video-description">{video.description}</p>}
        </div>
      </article>

      {showComments && (
        <CommentsModal 
          videoId={video.id} 
          onClose={() => setShowComments(false)} 
        />
      )}
    </>
  )
}

// Skeleton loader for video cards
export function VideoCardSkeleton() {
  return (
    <div className="video-skeleton">
      <div className="skeleton-header">
        <div className="skeleton skeleton-avatar" />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text skeleton-text-md" style={{ marginBottom: 8 }} />
          <div className="skeleton skeleton-text skeleton-text-sm" />
        </div>
      </div>
      <div className="skeleton skeleton-video" />
      <div className="skeleton-actions">
        <div className="skeleton skeleton-btn" />
        <div className="skeleton skeleton-btn" />
        <div className="skeleton skeleton-btn" />
      </div>
    </div>
  )
}
