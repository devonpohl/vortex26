import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// Get top 20 scores
router.get('/', (req, res) => {
  const scores = db.prepare(
    'SELECT initials, score, created_at FROM high_scores ORDER BY score DESC, created_at ASC LIMIT 20'
  ).all();
  res.json(scores);
});

// Submit a score
router.post('/', (req, res) => {
  const { initials, score } = req.body;

  if (!initials || typeof initials !== 'string' || initials.trim().length === 0 || initials.trim().length > 3) {
    return res.status(400).json({ error: 'Initials must be 1-3 characters' });
  }

  if (!score || typeof score !== 'number' || score < 1) {
    return res.status(400).json({ error: 'Score must be a positive number' });
  }

  const clean = initials.trim().toUpperCase();

  // Check for existing score with same initials
  const existing = db.prepare(
    'SELECT id, score FROM high_scores WHERE initials = ?'
  ).get(clean) as { id: number; score: number } | undefined;

  if (existing) {
    if (score > existing.score) {
      // Beat their old score — update it
      db.prepare('UPDATE high_scores SET score = ?, created_at = datetime(\'now\') WHERE id = ?').run(score, existing.id);
      const entry = db.prepare('SELECT * FROM high_scores WHERE id = ?').get(existing.id);
      return res.json(entry);
    } else {
      // Didn't beat it — discard
      return res.json({ message: 'Score not high enough to beat your record', current_best: existing.score });
    }
  }

  // New initials — insert
  const result = db.prepare(
    'INSERT INTO high_scores (initials, score) VALUES (?, ?)'
  ).run(clean, score);

  const entry = db.prepare('SELECT * FROM high_scores WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(entry);
});

export default router;
