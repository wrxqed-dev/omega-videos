# Omega Videos 🎬

A TikTok-style short video sharing platform built with React and Node.js.

![Omega Videos](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 📱 **Vertical Video Feed** - TikTok-style scrollable video feed
- 👤 **User Profiles** - Registration, login, customizable profiles with avatars
- ❤️ **Engagement** - Like videos and comments, leave comments with replies
- 🔥 **Trending** - Discover popular videos based on engagement score
- 🔍 **Search** - Find videos and users
- 🔔 **Notifications** - Get notified about likes, comments, and new followers
- 📌 **Bookmarks** - Save videos for later
- 👥 **Follow System** - Follow your favorite creators

## Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **SQLite** (better-sqlite3) - Lightweight database
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Zustand** - State management
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/omega-videos.git
cd omega-videos
```

2. Install server dependencies
```bash
npm install
```

3. Install client dependencies
```bash
cd client
npm install
cd ..
```

4. Start the development servers

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

5. Open http://localhost:5173 in your browser

## Project Structure

```
omega-videos/
├── server/
│   ├── index.js          # Express server entry
│   ├── database.js       # SQLite setup & schema
│   ├── middleware/
│   │   └── auth.js       # JWT authentication
│   └── routes/
│       ├── auth.js       # Login/register
│       ├── users.js      # User profiles
│       ├── videos.js     # Video CRUD
│       ├── comments.js   # Comments & replies
│       └── notifications.js
├── client/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Zustand store
│   │   ├── api/          # API client
│   │   ├── utils/        # Helpers
│   │   └── styles/       # CSS
│   └── index.html
├── uploads/              # User uploads
│   ├── videos/
│   └── avatars/
└── database.sqlite       # SQLite database
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Videos
- `GET /api/videos/feed` - Get personalized feed
- `GET /api/videos/trending` - Get trending videos
- `POST /api/videos` - Upload video
- `POST /api/videos/:id/like` - Like/unlike video
- `POST /api/videos/:id/bookmark` - Bookmark video
- `GET /api/videos/search/:query` - Search videos

### Users
- `GET /api/users/:username` - Get user profile
- `GET /api/users/:username/videos` - Get user's videos
- `PUT /api/users/profile` - Update profile
- `POST /api/users/:id/follow` - Follow user

### Comments
- `GET /api/comments/video/:id` - Get comments
- `POST /api/comments/video/:id` - Add comment
- `POST /api/comments/:id/like` - Like comment

## Recommendation Algorithm

The feed uses a scoring system:
- Likes × 3
- Comments × 5
- Views × 0.1
- +50 bonus for videos < 24h old
- +30 bonus for followed users

## License

MIT License - feel free to use this project for learning or as a starting point for your own app.

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

Made with ❤️ and lots of ☕
