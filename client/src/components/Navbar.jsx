import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Flame, Search, Plus, LogOut } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function Navbar() {
  const { user, logout, setModal } = useStore()
  const [query, setQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

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
          <span>Главная</span>
        </Link>
        <Link to="/trending" className={`nav-link ${location.pathname === '/trending' ? 'active' : ''}`}>
          <Flame size={20} />
          <span>Тренды</span>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Поиск видео и авторов"
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
              Загрузить
            </button>
            <Link to={`/user/${user.username}`} className="profile-btn">
              <img src={getAvatar(user)} alt="" className="avatar" />
              <span>{user.username}</span>
            </Link>
            <button className="btn btn-ghost btn-icon" onClick={logout} title="Выйти">
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={() => setModal('auth')}>
              Войти
            </button>
            <button className="btn btn-primary" onClick={() => setModal('auth')}>
              Регистрация
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
