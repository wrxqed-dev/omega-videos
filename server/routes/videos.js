const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Video upload config
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/videos'),
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp4', '.webm', '.mov'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат видео'));
    }
  }
});

// Get feed videos with smart recommendations
router.get('/feed', optionalAuth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  let videos;
  if (req.userId) {
    // Personalized feed for logged in users
    videos = db.prepare(`
      SELECT v.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
        (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments,
        (SELECT 1 FROM likes WHERE video_id = v.id AND user_id = ?) as isLiked,
        (SELECT 1 FROM bookmarks WHERE video_id = v.id AND user_id = ?) as isBookmarked,
        (
          (SELECT COUNT(*) FROM likes WHERE video_id = v.id) * 3 +
          (SELECT COUNT(*) FROM comments WHERE video_id = v.id) * 5 +
          v.views * 0.1 +
          CASE WHEN v.created_at > datetime('now', 'localtime', '-1 day') THEN 50 ELSE 0 END +
          CASE WHEN EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = v.user_id) THEN 30 ELSE 0 END
        ) as score
      FROM videos v
      JOIN users u ON v.user_id = u.id
      ORDER BY score DESC, v.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.userId, req.userId, req.userId, limit, offset);
  } else {
    // Default feed for guests
    videos = db.prepare(`
      SELECT v.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
        (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments,
        0 as isLiked,
        0 as isBookmarked,
        (
          (SELECT COUNT(*) FROM likes WHERE video_id = v.id) * 3 +
          (SELECT COUNT(*) FROM comments WHERE video_id = v.id) * 5 +
          v.views * 0.1 +
          CASE WHEN v.created_at > datetime('now', 'localtime', '-1 day') THEN 50 ELSE 0 END
        ) as score
      FROM videos v
      JOIN users u ON v.user_id = u.id
      ORDER BY score DESC, v.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  }

  res.json(videos);
});

// Get trending videos
router.get('/trending', optionalAuth, (req, res) => {
  const videos = db.prepare(`
    SELECT v.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
      (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments,
      ${req.userId ? `(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = ${req.userId}) as isLiked` : '0 as isLiked'},
      ${req.userId ? `(SELECT 1 FROM bookmarks WHERE video_id = v.id AND user_id = ${req.userId}) as isBookmarked` : '0 as isBookmarked'},
      (
        (SELECT COUNT(*) FROM likes WHERE video_id = v.id) * 3 +
        (SELECT COUNT(*) FROM comments WHERE video_id = v.id) * 5 +
        v.views
      ) as engagement
    FROM videos v
    JOIN users u ON v.user_id = u.id
    WHERE v.created_at > datetime('now', 'localtime', '-7 days')
    ORDER BY engagement DESC, v.views DESC
    LIMIT 20
  `).all();

  res.json(videos);
});

// Upload video
router.post('/', authMiddleware, upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Видео не загружено' });
  }

  const { title, description } = req.body;

  if (!title || !title.trim()) {
    // Delete uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Название обязательно' });
  }

  if (title.length > 100) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Название слишком длинное' });
  }

  const filename = `/uploads/videos/${req.file.filename}`;

  const result = db.prepare(`
    INSERT INTO videos (user_id, filename, title, description) VALUES (?, ?, ?, ?)
  `).run(req.userId, filename, title.trim(), (description || '').trim().slice(0, 500));

  const video = db.prepare(`
    SELECT v.*, u.username, u.avatar FROM videos v
    JOIN users u ON v.user_id = u.id WHERE v.id = ?
  `).get(result.lastInsertRowid);

  // Notify followers
  const followers = db.prepare('SELECT follower_id FROM follows WHERE following_id = ?').all(req.userId);
  const notifyStmt = db.prepare(`
    INSERT INTO notifications (user_id, from_user_id, type, video_id)
    VALUES (?, ?, 'new_video', ?)
  `);

  for (const follower of followers) {
    notifyStmt.run(follower.follower_id, req.userId, result.lastInsertRowid);
  }

  res.json({ ...video, likes: 0, comments: 0, isLiked: 0, isBookmarked: 0 });
});

// Get single video
router.get('/:id', optionalAuth, (req, res) => {
  const video = db.prepare(`
    SELECT v.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
      (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments,
      ${req.userId ? `(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = ${req.userId}) as isLiked` : '0 as isLiked'},
      ${req.userId ? `(SELECT 1 FROM bookmarks WHERE video_id = v.id AND user_id = ${req.userId}) as isBookmarked` : '0 as isBookmarked'}
    FROM videos v
    JOIN users u ON v.user_id = u.id
    WHERE v.id = ?
  `).get(req.params.id);

  if (!video) {
    return res.status(404).json({ error: 'Видео не найдено' });
  }

  // Increment views
  db.prepare('UPDATE videos SET views = views + 1 WHERE id = ?').run(req.params.id);

  res.json(video);
});

// Like/unlike video
router.post('/:id/like', authMiddleware, (req, res) => {
  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Видео не найдено' });
  }

  try {
    db.prepare('INSERT INTO likes (user_id, video_id) VALUES (?, ?)').run(req.userId, req.params.id);

    // Notify video owner
    if (video.user_id !== req.userId) {
      db.prepare(`
        INSERT INTO notifications (user_id, from_user_id, type, video_id)
        VALUES (?, ?, 'like', ?)
      `).run(video.user_id, req.userId, req.params.id);
    }

    const count = db.prepare('SELECT COUNT(*) as count FROM likes WHERE video_id = ?').get(req.params.id);
    res.json({ liked: true, count: count.count });
  } catch (error) {
    // Already liked, so unlike
    db.prepare('DELETE FROM likes WHERE user_id = ? AND video_id = ?').run(req.userId, req.params.id);
    const count = db.prepare('SELECT COUNT(*) as count FROM likes WHERE video_id = ?').get(req.params.id);
    res.json({ liked: false, count: count.count });
  }
});

// Bookmark/unbookmark video
router.post('/:id/bookmark', authMiddleware, (req, res) => {
  const video = db.prepare('SELECT id FROM videos WHERE id = ?').get(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Видео не найдено' });
  }

  try {
    db.prepare('INSERT INTO bookmarks (user_id, video_id) VALUES (?, ?)').run(req.userId, req.params.id);
    res.json({ bookmarked: true });
  } catch (error) {
    db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND video_id = ?').run(req.userId, req.params.id);
    res.json({ bookmarked: false });
  }
});

// Get user's bookmarked videos
router.get('/bookmarks/my', authMiddleware, (req, res) => {
  const videos = db.prepare(`
    SELECT v.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
      (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments,
      (SELECT 1 FROM likes WHERE video_id = v.id AND user_id = ?) as isLiked,
      1 as isBookmarked
    FROM bookmarks b
    JOIN videos v ON b.video_id = v.id
    JOIN users u ON v.user_id = u.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.userId, req.userId);

  res.json(videos);
});

// Delete video
router.delete('/:id', authMiddleware, (req, res) => {
  const video = db.prepare('SELECT * FROM videos WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!video) {
    return res.status(404).json({ error: 'Видео не найдено' });
  }

  // Delete file
  const filePath = path.join(__dirname, '../../', video.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete related data (cascades handle most, but notifications need manual)
  db.prepare('DELETE FROM notifications WHERE video_id = ?').run(req.params.id);
  db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});

// Search videos
router.get('/search/:query', optionalAuth, (req, res) => {
  const query = `%${req.params.query}%`;
  const videos = db.prepare(`
    SELECT v.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes,
      (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments,
      ${req.userId ? `(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = ${req.userId}) as isLiked` : '0 as isLiked'}
    FROM videos v
    JOIN users u ON v.user_id = u.id
    WHERE v.title LIKE ? OR v.description LIKE ? OR u.username LIKE ?
    ORDER BY v.created_at DESC
    LIMIT 50
  `).all(query, query, query);

  res.json(videos);
});

module.exports = router;
