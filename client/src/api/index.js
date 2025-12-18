const BASE = '/api'

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

const request = async (url, options = {}) => {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: options.body instanceof FormData
      ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
      : getHeaders()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

export const api = {
  // Auth
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),

  // Videos
  getFeed: (page = 1) => request(`/videos/feed?page=${page}`),
  getTrending: () => request('/videos/trending'),
  getVideo: (id) => request(`/videos/${id}`),
  uploadVideo: (formData) => request('/videos', { method: 'POST', body: formData }),
  likeVideo: (id) => request(`/videos/${id}/like`, { method: 'POST' }),
  viewVideo: (id) => request(`/videos/${id}/view`, { method: 'POST' }),
  bookmarkVideo: (id) => request(`/videos/${id}/bookmark`, { method: 'POST' }),
  deleteVideo: (id) => request(`/videos/${id}`, { method: 'DELETE' }),
  searchVideos: (q) => request(`/videos/search/${encodeURIComponent(q)}`),
  getBookmarks: () => request('/videos/bookmarks/my'),

  // Users
  getUser: (username) => request(`/users/${username}`),
  getUserVideos: (username) => request(`/users/${username}/videos`),
  getUserLiked: (username) => request(`/users/${username}/liked`),
  getFollowers: (username) => request(`/users/${username}/followers`),
  getFollowing: (username) => request(`/users/${username}/following`),
  updateProfile: (formData) => request('/users/profile', { method: 'PUT', body: formData }),
  follow: (id) => request(`/users/${id}/follow`, { method: 'POST' }),
  unfollow: (id) => request(`/users/${id}/follow`, { method: 'DELETE' }),
  searchUsers: (q) => request(`/users/search/${encodeURIComponent(q)}`),

  // Comments
  getComments: (videoId) => request(`/comments/video/${videoId}`),
  getReplies: (commentId) => request(`/comments/${commentId}/replies`),
  addComment: (videoId, text, parentId = null) => request(`/comments/video/${videoId}`, { 
    method: 'POST', 
    body: JSON.stringify({ text, parentId }) 
  }),
  likeComment: (id) => request(`/comments/${id}/like`, { method: 'POST' }),
  deleteComment: (id) => request(`/comments/${id}`, { method: 'DELETE' }),

  // Settings
  updateSettings: (data) => request('/users/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  getUnreadCount: () => request('/notifications/unread'),
  markNotificationsRead: (ids = null) => request('/notifications/read', { 
    method: 'POST', 
    body: JSON.stringify({ ids }) 
  }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  clearNotifications: () => request('/notifications', { method: 'DELETE' })
}
