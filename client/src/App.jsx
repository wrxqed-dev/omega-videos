import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from './store/useStore'
import Navbar from './components/Navbar'
import Feed from './pages/Feed'
import Trending from './pages/Trending'
import Profile from './pages/Profile'
import Search from './pages/Search'
import Notifications from './pages/Notifications'
import AuthModal from './components/AuthModal'
import UploadModal from './components/UploadModal'

export default function App() {
  const { checkAuth, modal } = useStore()

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <div className="app">
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/user/:username" element={<Profile />} />
          <Route path="/search/:query" element={<Search />} />
        </Routes>
      </main>
      {modal === 'auth' && <AuthModal />}
      {modal === 'upload' && <UploadModal />}
    </div>
  )
}
