import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// Validation helpers
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stripPhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

function formatPhone(digits: string): string {
  return digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6, 10);
}

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

  if (email && email.trim() && !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  let cleanPhone: string | null = null;
  if (phone && phone.trim()) {
    const digits = stripPhone(phone);
    if (digits.length !== 10) {
      return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }
    cleanPhone = formatPhone(digits);
  }

  const result = db.prepare(
    'INSERT INTO directory (name, email, phone) VALUES (?, ?, ?)'
  ).run(name.trim(), email?.trim() || null, cleanPhone);

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

  if (email && email.trim() && !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  let cleanPhone: string | null = null;
  if (phone && phone.trim()) {
    const digits = stripPhone(phone);
    if (digits.length !== 10) {
      return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }
    cleanPhone = formatPhone(digits);
  }

  db.prepare(
    'UPDATE directory SET name = ?, email = ?, phone = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(name.trim(), email?.trim() || null, cleanPhone, req.params.id);

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
