const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Avatar upload config
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/avatars'),
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат изображения'));
    }
  }
});

// Get user profile
router.get('/:username', optionalAuth, (req, res) => {
  const user = db.prepare(`
    SELECT id, username, avatar, bio, created_at FROM users WHERE username = ?
  `).get(req.params.username);

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM videos WHERE user_id = ?) as videos,
      (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers,
      (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following,
      (SELECT SUM(likes_count) FROM (SELECT COUNT(*) as likes_count FROM likes l JOIN videos v ON l.video_id = v.id WHERE v.user_id = ? GROUP BY v.id)) as totalLikes
  `).get(user.id, user.id, user.id, user.id);

  const isFollowing = req.userId
    ? !!db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(req.userId, user.id)
    : false;

  res.json({
    ...user,
    ...stats,
    totalLikes: stats.totalLikes || 0,
    isFollowing,
    isOwner: req.userId === user.id
  });
});

// Update settings (language, etc)
router.put('/settings', authMiddleware, (req, res) => {
  const { language } = req.body;
  
  if (language && ['en', 'ru'].includes(language)) {
    db.prepare('UPDATE users SET language = ? WHERE id = ?').run(language, req.userId);
  }
  
  const user = db.prepare('SELECT id, username, email, avatar, bio, language FROM users WHERE id = ?').get(req.userId);
  res.json(user);
});

// Update profile
router.put('/profile', authMiddleware, upload.single('avatar'), (req, res) => {
  const { bio } = req.body;
  const user = db.prepare('SELECT avatar FROM users WHERE id = ?').get(req.userId);

  let avatar = user.avatar;

  if (req.file) {
    // Delete old avatar if exists
    if (user.avatar) {
      const oldPath = path.join(__dirname, '../../', user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    avatar = `/uploads/avatars/${req.file.filename}`;
  }

  db.prepare('UPDATE users SET avatar = ?, bio = ? WHERE id = ?')
    .run(avatar, (bio || '').trim().slice(0, 200), req.userId);

  const updatedUser = db.prepare('SELECT id, username, email, avatar, bio FROM users WHERE id = ?').get(req.userId);
  res.json(updatedUser);
});

// Follow user
router.post('/:id/follow', authMiddleware, (req, res) => {
  const targetId = parseInt(req.params.id);

  if (targetId === req.userId) {
    return res.status(400).json({ error: 'Нельзя подписаться на себя' });
  }

  const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  try {
    db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.userId, targetId);

    // Notify user
    db.prepare(`
      INSERT INTO notifications (user_id, from_user_id, type)
      VALUES (?, ?, 'follow')
    `).run(targetId, req.userId);

    res.json({ success: true, following: true });
  } catch (error) {
    res.status(400).json({ error: 'Уже подписаны' });
  }
});

// Unfollow user
router.delete('/:id/follow', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?')
    .run(req.userId, parseInt(req.params.id));
  res.json({ success: true, following: false });
});

// Get user videos
router.get('/:username/videos', optionalAuth, (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  const videos = db.prepare(`
    SELECT v.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
      (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments,
      ${req.userId ? `(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = ${req.userId}) as isLiked` : '0 as isLiked'}
    FROM videos v
    JOIN users u ON v.user_id = u.id
    WHERE v.user_id = ?
    ORDER BY v.created_at DESC
  `).all(user.id);

  res.json(videos);
});

// Get user's liked videos
router.get('/:username/liked', optionalAuth, (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  const videos = db.prepare(`
    SELECT v.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
      (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments,
      1 as isLiked
    FROM likes l
    JOIN videos v ON l.video_id = v.id
    JOIN users u ON v.user_id = u.id
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
  `).all(user.id);

  res.json(videos);
});

// Get followers
router.get('/:username/followers', (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  const followers = db.prepare(`
    SELECT u.id, u.username, u.avatar, u.bio
    FROM follows f
    JOIN users u ON f.follower_id = u.id
    WHERE f.following_id = ?
    ORDER BY f.created_at DESC
  `).all(user.id);

  res.json(followers);
});

// Get following
router.get('/:username/following', (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  const following = db.prepare(`
    SELECT u.id, u.username, u.avatar, u.bio
    FROM follows f
    JOIN users u ON f.following_id = u.id
    WHERE f.follower_id = ?
    ORDER BY f.created_at DESC
  `).all(user.id);

  res.json(following);
});

// Search users
router.get('/search/:query', (req, res) => {
  const query = `%${req.params.query}%`;
  const users = db.prepare(`
    SELECT id, username, avatar, bio,
      (SELECT COUNT(*) FROM follows WHERE following_id = users.id) as followers
    FROM users
    WHERE username LIKE ? OR bio LIKE ?
    ORDER BY followers DESC
    LIMIT 20
  `).all(query, query);

  res.json(users);
});

module.exports = router;
