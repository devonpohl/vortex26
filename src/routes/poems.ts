import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// Get all poems sorted by votes desc, then created_at asc
router.get('/', (req, res) => {
  const poems = db.prepare(
    'SELECT * FROM poems ORDER BY votes DESC, created_at ASC'
  ).all();
  res.json(poems);
});

// Get votes for a specific voter (so client can show which poems they already voted on)
router.get('/votes/:voter', (req, res) => {
  const voter = decodeURIComponent(req.params.voter).trim().toLowerCase();
  const votes = db.prepare(
    'SELECT poem_id FROM poem_votes WHERE voter = ?'
  ).all(voter) as { poem_id: number }[];
  res.json(votes.map(v => v.poem_id));
});

// Create a poem
router.post('/', (req, res) => {
  const { author, line_p, line_o, line_h, line_l } = req.body;

  if (!author || !author.trim()) {
    return res.status(400).json({ error: 'Author name is required' });
  }

  const lines = { P: line_p, O: line_o, H: line_h, L: line_l };
  for (const [letter, line] of Object.entries(lines)) {
    if (!line || !line.trim()) {
      return res.status(400).json({ error: `Line "${letter}" is required` });
    }
    if (line.trim()[0].toUpperCase() !== letter) {
      return res.status(400).json({ error: `Line "${letter}" must start with the letter ${letter}` });
    }
  }

  const result = db.prepare(
    'INSERT INTO poems (author, line_p, line_o, line_h, line_l) VALUES (?, ?, ?, ?, ?)'
  ).run(author.trim(), line_p.trim(), line_o.trim(), line_h.trim(), line_l.trim());

  const poem = db.prepare('SELECT * FROM poems WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(poem);
});

// Vote on a poem
router.post('/:id/vote', (req, res) => {
  const { voter } = req.body;

  if (!voter || !voter.trim()) {
    return res.status(400).json({ error: 'Voter name is required' });
  }

  const poemId = parseInt(req.params.id);
  const poem = db.prepare('SELECT id FROM poems WHERE id = ?').get(poemId);
  if (!poem) {
    return res.status(404).json({ error: 'Poem not found' });
  }

  const cleanVoter = voter.trim().toLowerCase();

  // Check if already voted
  const existing = db.prepare(
    'SELECT id FROM poem_votes WHERE poem_id = ? AND voter = ?'
  ).get(poemId, cleanVoter);

  if (existing) {
    return res.status(409).json({ error: 'You already voted for this poem' });
  }

  const voteAndIncrement = db.transaction(() => {
    db.prepare('INSERT INTO poem_votes (poem_id, voter) VALUES (?, ?)').run(poemId, cleanVoter);
    db.prepare('UPDATE poems SET votes = votes + 1 WHERE id = ?').run(poemId);
  });

  voteAndIncrement();

  const updated = db.prepare('SELECT * FROM poems WHERE id = ?').get(poemId);
  res.json(updated);
});

// Delete a poem
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM poems WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Poem not found' });
  }
  res.status(204).send();
});

export default router;
