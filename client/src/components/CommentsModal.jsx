import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X, Send, Heart, MessageCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../api'
import { useStore } from '../store/useStore'
import { formatCommentTime } from '../utils/time'
import { t } from '../utils/i18n'

export default function CommentsModal({ videoId, onClose }) {
  const { user, setModal, language } = useStore()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    loadComments()
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [videoId])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const loadComments = async () => {
    try {
      const data = await api.getComments(videoId)
      setComments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return

    setSending(true)
    try {
      const comment = await api.addComment(videoId, text.trim(), replyTo?.id || null)
      if (replyTo) {
        // Add reply to parent comment
        setComments(comments.map(c => 
          c.id === replyTo.id 
            ? { ...c, replies: (c.replies || 0) + 1, showReplies: true, repliesList: [...(c.repliesList || []), comment] }
            : c
        ))
      } else {
        setComments([comment, ...comments])
      }
      setText('')
      setReplyTo(null)
      inputRef.current?.focus()
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleLike = async (commentId) => {
    if (!user) {
      setModal('auth')
      return
    }
    try {
      const res = await api.likeComment(commentId)
      setComments(comments.map(c => {
        if (c.id === commentId) {
          return { ...c, likes: res.count, isLiked: res.liked ? 1 : 0 }
        }
        if (c.repliesList) {
          return {
            ...c,
            repliesList: c.repliesList.map(r => 
              r.id === commentId ? { ...r, likes: res.count, isLiked: res.liked ? 1 : 0 } : r
            )
          }
        }
        return c
      }))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (commentId) => {
    if (!confirm('Удалить комментарий?')) return
    try {
      await api.deleteComment(commentId)
      setComments(comments.filter(c => c.id !== commentId).map(c => ({
        ...c,
        repliesList: c.repliesList?.filter(r => r.id !== commentId)
      })))
    } catch (err) {
      console.error(err)
    }
  }

  const loadReplies = async (comment) => {
    if (comment.showReplies) {
      setComments(comments.map(c => c.id === comment.id ? { ...c, showReplies: false } : c))
      return
    }
    try {
      const replies = await api.getReplies(comment.id)
      setComments(comments.map(c => 
        c.id === comment.id ? { ...c, showReplies: true, repliesList: replies } : c
      ))
    } catch (err) {
      console.error(err)
    }
  }

  const getAvatar = (username, avatar) => {
    return avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=fe2c55`
  }

  const renderComment = (comment, isReply = false) => (
    <div 
      key={comment.id} 
      className="comment"
      style={{ 
        paddingLeft: isReply ? 52 : 0,
        animationDelay: `${comments.indexOf(comment) * 0.05}s` 
      }}
    >
      <Link to={`/user/${comment.username}`}>
        <img 
          src={getAvatar(comment.username, comment.avatar)} 
          alt="" 
          className="comment-avatar"
          style={{ width: isReply ? 32 : 40, height: isReply ? 32 : 40 }}
        />
      </Link>
      <div className="comment-content">
        <div className="comment-header">
          <Link to={`/user/${comment.username}`} className="comment-username">
            @{comment.username}
          </Link>
          <span className="comment-time">{formatCommentTime(comment.created_at, language)}</span>
        </div>
        <p className="comment-text">{comment.text}</p>
        <div className="comment-actions">
          <button 
            className={`comment-action ${comment.isLiked ? 'liked' : ''}`}
            onClick={() => handleLike(comment.id)}
            style={{ color: comment.isLiked ? 'var(--accent)' : undefined }}
          >
            <Heart size={14} fill={comment.isLiked ? 'currentColor' : 'none'} />
            <span>{comment.likes || 0}</span>
          </button>
          {!isReply && (
            <button 
              className="comment-action"
              onClick={() => {
                setReplyTo(comment)
                inputRef.current?.focus()
              }}
            >
              <span>{t('reply', language)}</span>
            </button>
          )}
          {user?.id === comment.user_id && (
            <button 
              className="comment-action"
              onClick={() => handleDelete(comment.id)}
              style={{ marginLeft: 'auto' }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        
        {/* Replies */}
        {!isReply && comment.replies > 0 && (
          <button 
            className="comment-action"
            onClick={() => loadReplies(comment)}
            style={{ marginTop: 8, color: 'var(--accent)' }}
          >
            {comment.showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{comment.showReplies ? (language === 'ru' ? 'Скрыть' : 'Hide') : (language === 'ru' ? `Показать ${comment.replies} ответов` : `Show ${comment.replies} replies`)}</span>
          </button>
        )}
        {comment.showReplies && comment.repliesList?.map(reply => renderComment(reply, true))}
      </div>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal comments-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comments-header">
          <div>
            <h2 className="modal-title">{t('commentsTitle', language)}</h2>
            <span className="comments-count">{comments.length} {t('comments', language)}</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="comments-list">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : comments.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-icon" style={{ width: 60, height: 60 }}>
                <MessageCircle size={24} />
              </div>
              <h3 className="empty-title" style={{ fontSize: 16 }}>{t('noComments', language)}</h3>
              <p className="empty-text" style={{ fontSize: 14 }}>{t('beFirstToComment', language)}</p>
            </div>
          ) : (
            comments.map(comment => renderComment(comment))
          )}
        </div>

        {user ? (
          <form className="comment-form" onSubmit={handleSubmit}>
            {replyTo && (
              <div style={{
                position: 'absolute',
                top: -32,
                left: 0,
                right: 0,
                padding: '8px 12px',
                background: 'var(--bg-tertiary)',
                borderRadius: 8,
                fontSize: 13,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Ответ для @{replyTo.username}</span>
                <button 
                  type="button" 
                  onClick={() => setReplyTo(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <img 
              src={getAvatar(user.username, user.avatar)} 
              alt="" 
              className="avatar" 
              style={{ width: 40, height: 40 }}
            />
            <div className="comment-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                className="comment-input"
                placeholder={replyTo ? `${t('reply', language)} @${replyTo.username}...` : t('addComment', language)}
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={500}
              />
            </div>
            <button
              type="submit"
              className="comment-submit"
              disabled={!text.trim() || sending}
            >
              <Send size={18} />
            </button>
          </form>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            borderTop: '1px solid var(--border)',
            marginTop: '16px'
          }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 14 }}>
              {language === 'ru' ? 'Войдите, чтобы оставить комментарий' : 'Log in to leave a comment'}
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => { onClose(); setModal('auth') }}
            >
              {t('loginBtn', language)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
