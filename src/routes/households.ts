import { Router } from 'express';
import db, { Household } from '../db/index.js';

const router = Router();

// Get all households
router.get('/', (req, res) => {
  const households = db.prepare(`
    SELECT * FROM households ORDER BY name ASC
  `).all() as Household[];
  
  res.json(households);
});

// Get single household
router.get('/:id', (req, res) => {
  const household = db.prepare(`
    SELECT * FROM households WHERE id = ?
  `).get(req.params.id) as Household | undefined;
  
  if (!household) {
    return res.status(404).json({ error: 'Household not found' });
  }
  
  // Get their RSVPs
  const rsvps = db.prepare(`
    SELECT r.*, e.title as event_title, e.start_time
    FROM rsvps r
    JOIN events e ON r.event_id = e.id
    WHERE r.household_id = ?
    ORDER BY e.start_time ASC
  `).all(req.params.id);
  
  res.json({ household, rsvps });
});

// Create household
router.post('/', (req, res) => {
  const { name, latitude, longitude, address, arrival_date, departure_date } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!address || !address.trim()) {
    return res.status(400).json({ error: 'Address is required' });
  }

  if (latitude == null || longitude == null) {
    return res.status(400).json({ error: 'Location coordinates are required. Enter a valid address or click the map.' });
  }

  const result = db.prepare(`
    INSERT INTO households (name, latitude, longitude, address, arrival_date, departure_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, latitude, longitude, address.trim(), arrival_date || null, departure_date || null);
  
  const household = db.prepare('SELECT * FROM households WHERE id = ?').get(result.lastInsertRowid) as Household;
  
  res.status(201).json(household);
});

// Update household
router.put('/:id', (req, res) => {
  const { name, latitude, longitude, address, arrival_date, departure_date } = req.body;
  
  const existing = db.prepare('SELECT id FROM households WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Household not found' });
  }
  
  db.prepare(`
    UPDATE households 
    SET name = ?, latitude = ?, longitude = ?, address = ?, arrival_date = ?, departure_date = ?
    WHERE id = ?
  `).run(name, latitude || null, longitude || null, address || null, arrival_date || null, departure_date || null, req.params.id);
  
  const household = db.prepare('SELECT * FROM households WHERE id = ?').get(req.params.id) as Household;
  
  res.json(household);
});

// Delete household
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM households WHERE id = ?').run(req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Household not found' });
  }
  
  res.status(204).send();
});

// Get households present on a specific date
router.get('/present/:date', (req, res) => {
  const { date } = req.params;
  
  const households = db.prepare(`
    SELECT * FROM households 
    WHERE (arrival_date IS NULL OR arrival_date <= ?)
      AND (departure_date IS NULL OR departure_date >= ?)
    ORDER BY name ASC
  `).all(date, date) as Household[];
  
  res.json(households);
});

export default router;
