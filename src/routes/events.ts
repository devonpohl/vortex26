import { Router } from 'express';
import db, { Event } from '../db/index.js';

const router = Router();

// Get all events (for calendar)
router.get('/', (req, res) => {
  const events = db.prepare(`
    SELECT * FROM events ORDER BY start_time ASC
  `).all() as Event[];
  
  res.json(events);
});

// Get single event with RSVPs
router.get('/:id', (req, res) => {
  const event = db.prepare(`
    SELECT * FROM events WHERE id = ?
  `).get(req.params.id) as Event | undefined;
  
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  const rsvps = db.prepare(`
    SELECT r.*, h.name as household_name 
    FROM rsvps r
    LEFT JOIN households h ON r.household_id = h.id
    WHERE r.event_id = ?
    ORDER BY r.created_at ASC
  `).all(req.params.id);
  
  res.json({ event, rsvps });
});

// Create event
router.post('/', (req, res) => {
  const { title, description, latitude, longitude, location_name, address, start_time, end_time } = req.body;
  
  if (!title || !start_time) {
    return res.status(400).json({ error: 'Title and start_time are required' });
  }

  if (!address || !address.trim()) {
    return res.status(400).json({ error: 'Address is required' });
  }

  if (latitude == null || longitude == null) {
    return res.status(400).json({ error: 'Location coordinates are required. Enter a valid address or click the map.' });
  }
  
  const result = db.prepare(`
    INSERT INTO events (title, description, latitude, longitude, location_name, address, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description || null, latitude || null, longitude || null, location_name || null, address || null, start_time, end_time || null);
  
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid) as Event;
  
  res.status(201).json(event);
});

// Update event
router.put('/:id', (req, res) => {
  const { title, description, latitude, longitude, location_name, address, start_time, end_time } = req.body;
  
  const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  db.prepare(`
    UPDATE events 
    SET title = ?, description = ?, latitude = ?, longitude = ?, location_name = ?, address = ?, start_time = ?, end_time = ?
    WHERE id = ?
  `).run(title, description || null, latitude || null, longitude || null, location_name || null, address || null, start_time, end_time || null, req.params.id);
  
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id) as Event;
  
  res.json(event);
});

// Delete event
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  res.status(204).send();
});

// RSVP to event
router.post('/:id/rsvp', (req, res) => {
  const { household_id, name, attending } = req.body;
  
  if (!attending || !['yes', 'no', 'maybe'].includes(attending)) {
    return res.status(400).json({ error: 'Valid attending status required (yes/no/maybe)' });
  }
  
  if (!household_id && !name) {
    return res.status(400).json({ error: 'Either household_id or name is required' });
  }
  
  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  // Check for existing RSVP from same household or name
  const existingQuery = household_id 
    ? db.prepare('SELECT id FROM rsvps WHERE event_id = ? AND household_id = ?')
    : db.prepare('SELECT id FROM rsvps WHERE event_id = ? AND name = ? AND household_id IS NULL');
  
  const existing = household_id 
    ? existingQuery.get(req.params.id, household_id)
    : existingQuery.get(req.params.id, name);
  
  if (existing) {
    // Update existing RSVP
    db.prepare('UPDATE rsvps SET attending = ? WHERE id = ?').run(attending, (existing as any).id);
    const rsvp = db.prepare('SELECT * FROM rsvps WHERE id = ?').get((existing as any).id);
    return res.json(rsvp);
  }
  
  // Create new RSVP
  const result = db.prepare(`
    INSERT INTO rsvps (event_id, household_id, name, attending)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, household_id || null, name || null, attending);
  
  const rsvp = db.prepare('SELECT * FROM rsvps WHERE id = ?').get(result.lastInsertRowid);
  
  res.status(201).json(rsvp);
});

// Delete RSVP
router.delete('/:eventId/rsvp/:rsvpId', (req, res) => {
  const result = db.prepare('DELETE FROM rsvps WHERE id = ? AND event_id = ?').run(req.params.rsvpId, req.params.eventId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'RSVP not found' });
  }

  res.status(204).send();
});

export default router;
