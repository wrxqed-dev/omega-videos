const express = require('express');
const db = require('../database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get comments for video
router.get('/video/:videoId', optionalAuth, (req, res) => {
  const comments = db.prepare(`
    SELECT 
      c.*,
      u.username,
      u.avatar,
      (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes,
      ${req.userId ? `(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = ${req.userId}) as isLiked` : '0 as isLiked'},
      (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) as replies
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.video_id = ? AND c.parent_id IS NULL
    ORDER BY c.created_at DESC
  `).all(req.params.videoId);

  res.json(comments);
});

// Get replies for a comment
router.get('/:commentId/replies', optionalAuth, (req, res) => {
  const replies = db.prepare(`
    SELECT 
      c.*,
      u.username,
      u.avatar,
      (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes,
      ${req.userId ? `(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = ${req.userId}) as isLiked` : '0 as isLiked'}
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.parent_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.commentId);

  res.json(replies);
});

// Add comment
router.post('/video/:videoId', authMiddleware, (req, res) => {
  const { text, parentId } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Комментарий не может быть пустым' });
  }

  if (text.length > 500) {
    return res.status(400).json({ error: 'Комментарий слишком длинный' });
  }

  // Check if video exists
  const video = db.prepare('SELECT user_id FROM videos WHERE id = ?').get(req.params.videoId);
  if (!video) {
    return res.status(404).json({ error: 'Видео не найдено' });
  }

  // If replying, check parent comment exists
  if (parentId) {
    const parent = db.prepare('SELECT id FROM comments WHERE id = ? AND video_id = ?').get(parentId, req.params.videoId);
    if (!parent) {
      return res.status(404).json({ error: 'Комментарий не найден' });
    }
  }

  const result = db.prepare(`
    INSERT INTO comments (user_id, video_id, parent_id, text) VALUES (?, ?, ?, ?)
  `).run(req.userId, req.params.videoId, parentId || null, text.trim());

  // Create notification for video owner (if not self)
  if (video.user_id !== req.userId) {
    db.prepare(`
      INSERT INTO notifications (user_id, from_user_id, type, video_id, comment_id)
      VALUES (?, ?, 'comment', ?, ?)
    `).run(video.user_id, req.userId, req.params.videoId, result.lastInsertRowid);
  }

  // If reply, notify parent comment author
  if (parentId) {
    const parentComment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(parentId);
    if (parentComment && parentComment.user_id !== req.userId) {
      db.prepare(`
        INSERT INTO notifications (user_id, from_user_id, type, video_id, comment_id)
        VALUES (?, ?, 'reply', ?, ?)
      `).run(parentComment.user_id, req.userId, req.params.videoId, result.lastInsertRowid);
    }
  }

  const comment = db.prepare(`
    SELECT c.*, u.username, u.avatar, 0 as likes, 0 as isLiked, 0 as replies
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.json(comment);
});

// Like/unlike comment
router.post('/:id/like', authMiddleware, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
  if (!comment) {
    return res.status(404).json({ error: 'Комментарий не найден' });
  }

  try {
    db.prepare('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)').run(req.userId, req.params.id);

    // Notify comment author
    if (comment.user_id !== req.userId) {
      db.prepare(`
        INSERT INTO notifications (user_id, from_user_id, type, video_id, comment_id)
        VALUES (?, ?, 'comment_like', ?, ?)
      `).run(comment.user_id, req.userId, comment.video_id, comment.id);
    }

    const count = db.prepare('SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?').get(req.params.id);
    res.json({ liked: true, count: count.count });
  } catch (error) {
    // Already liked, so unlike
    db.prepare('DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?').run(req.userId, req.params.id);
    const count = db.prepare('SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?').get(req.params.id);
    res.json({ liked: false, count: count.count });
  }
});

// Delete comment
router.delete('/:id', authMiddleware, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);

  if (!comment) {
    return res.status(404).json({ error: 'Комментарий не найден' });
  }

  // Check ownership or video ownership
  const video = db.prepare('SELECT user_id FROM videos WHERE id = ?').get(comment.video_id);
  if (comment.user_id !== req.userId && video?.user_id !== req.userId) {
    return res.status(403).json({ error: 'Нет прав на удаление' });
  }

  // Delete replies first
  db.prepare('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE parent_id = ?)').run(req.params.id);
  db.prepare('DELETE FROM comments WHERE parent_id = ?').run(req.params.id);

  // Delete comment likes
  db.prepare('DELETE FROM comment_likes WHERE comment_id = ?').run(req.params.id);

  // Delete comment
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});

module.exports = router;
