import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Flame, Search, Plus, LogOut, Bell, Settings } from 'lucide-react'
import { useStore } from '../store/useStore'
import { api } from '../api'
import { t } from '../utils/i18n'

export default function Navbar() {
  const { user, logout, setModal, language } = useStore()
  const [query, setQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      loadUnreadCount()
      const interval = setInterval(loadUnreadCount, 30000) // Check every 30s
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    // Reset count when visiting notifications page
    if (location.pathname === '/notifications') {
      setUnreadCount(0)
    }
  }, [location.pathname])

  const loadUnreadCount = async () => {
    try {
      const data = await api.getUnreadCount()
      setUnreadCount(data.count)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search/${encodeURIComponent(query.trim())}`)
    }
  }

  const getAvatar = (u) => {
    return u?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u?.username}&backgroundColor=fe2c55`
  }

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <div className="logo-icon">Ω</div>
        <span className="logo-text">Omega</span>
      </Link>

      <div className="nav-center">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <Home size={20} />
          <span>{t('home', language)}</span>
        </Link>
        <Link to="/trending" className={`nav-link ${location.pathname === '/trending' ? 'active' : ''}`}>
          <Flame size={20} />
          <span>{t('trending', language)}</span>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder={t('search', language)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="search-btn">
          <Search size={18} />
        </button>
      </form>

      <div className="nav-actions">
        {user ? (
          <div className="user-menu">
            <button className="upload-btn" onClick={() => setModal('upload')}>
              <Plus size={18} />
              {t('upload', language)}
            </button>
            <Link to="/notifications" className="btn btn-ghost btn-icon notification-btn" title={t('notifications', language)}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </Link>
            <Link to="/settings" className="btn btn-ghost btn-icon" title={t('settings', language)}>
              <Settings size={20} />
            </Link>
            <Link to={`/user/${user.username}`} className="profile-btn">
              <img src={getAvatar(user)} alt="" className="avatar" />
              <span>{user.username}</span>
            </Link>
            <button className="btn btn-ghost btn-icon" onClick={logout} title={t('logout', language)}>
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={() => setModal('auth')}>
              {t('login', language)}
            </button>
            <button className="btn btn-primary" onClick={() => setModal('auth')}>
              {t('register', language)}
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
