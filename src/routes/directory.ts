import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// Get all entries, alphabetical by name
router.get('/', (req, res) => {
  const entries = db.prepare(
    'SELECT * FROM directory ORDER BY name COLLATE NOCASE ASC'
  ).all();
  res.json(entries);
});

// Add entry
router.post('/', (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const result = db.prepare(
    'INSERT INTO directory (name, email, phone) VALUES (?, ?, ?)'
  ).run(name.trim(), email?.trim() || null, phone?.trim() || null);

  const entry = db.prepare('SELECT * FROM directory WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(entry);
});

// Update entry
router.put('/:id', (req, res) => {
  const { name, email, phone } = req.body;

  const existing = db.prepare('SELECT id FROM directory WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  db.prepare(
    'UPDATE directory SET name = ?, email = ?, phone = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(name.trim(), email?.trim() || null, phone?.trim() || null, req.params.id);

  const entry = db.prepare('SELECT * FROM directory WHERE id = ?').get(req.params.id);
  res.json(entry);
});

// Delete entry
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM directory WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  res.status(204).send();
});

export default router;
