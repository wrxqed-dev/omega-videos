const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get notifications
router.get('/', authMiddleware, (req, res) => {
  const notifications = db.prepare(`
    SELECT 
      n.*,
      u.username as from_username,
      u.avatar as from_avatar,
      v.title as video_title,
      v.filename as video_filename
    FROM notifications n
    JOIN users u ON n.from_user_id = u.id
    LEFT JOIN videos v ON n.video_id = v.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(req.userId);

  res.json(notifications);
});

// Get unread count
router.get('/unread', authMiddleware, (req, res) => {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
  `).get(req.userId);

  res.json({ count: result.count });
});

// Mark as read
router.post('/read', authMiddleware, (req, res) => {
  const { ids } = req.body;

  if (ids && Array.isArray(ids)) {
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`UPDATE notifications SET is_read = 1 WHERE id IN (${placeholders}) AND user_id = ?`)
      .run(...ids, req.userId);
  } else {
    // Mark all as read
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.userId);
  }

  res.json({ success: true });
});

// Delete notification
router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

// Clear all notifications
router.delete('/', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.userId);
  res.json({ success: true });
});

module.exports = router;
