import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

interface SuggestedEvent {
  id: number;
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  website_url: string | null;
  reviews_url: string | null;
  image_url: string | null;
  created_at: string;
}

// Get all suggested events
router.get('/', (req, res) => {
  const suggestions = db.prepare(`
    SELECT * FROM suggested_events ORDER BY title ASC
  `).all() as SuggestedEvent[];
  
  res.json(suggestions);
});

// Get single suggested event
router.get('/:id', (req, res) => {
  const suggestion = db.prepare(`
    SELECT * FROM suggested_events WHERE id = ?
  `).get(req.params.id) as SuggestedEvent | undefined;
  
  if (!suggestion) {
    return res.status(404).json({ error: 'Suggested event not found' });
  }
  
  res.json(suggestion);
});

// Create suggested event
router.post('/', (req, res) => {
  const { 
    title, description, latitude, longitude, location_name, address,
    contact_phone, contact_email, website_url, reviews_url, image_url 
  } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const result = db.prepare(`
    INSERT INTO suggested_events (
      title, description, latitude, longitude, location_name, address,
      contact_phone, contact_email, website_url, reviews_url, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, description || null, latitude || null, longitude || null,
    location_name || null, address || null, contact_phone || null,
    contact_email || null, website_url || null, reviews_url || null, image_url || null
  );
  
  const suggestion = db.prepare('SELECT * FROM suggested_events WHERE id = ?').get(result.lastInsertRowid);
  
  res.status(201).json(suggestion);
});

// Update suggested event
router.put('/:id', (req, res) => {
  const { 
    title, description, latitude, longitude, location_name, address,
    contact_phone, contact_email, website_url, reviews_url, image_url 
  } = req.body;
  
  const existing = db.prepare('SELECT id FROM suggested_events WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Suggested event not found' });
  }
  
  db.prepare(`
    UPDATE suggested_events 
    SET title = ?, description = ?, latitude = ?, longitude = ?, location_name = ?,
        address = ?, contact_phone = ?, contact_email = ?, website_url = ?, reviews_url = ?, image_url = ?
    WHERE id = ?
  `).run(
    title, description || null, latitude || null, longitude || null,
    location_name || null, address || null, contact_phone || null,
    contact_email || null, website_url || null, reviews_url || null, image_url || null,
    req.params.id
  );
  
  const suggestion = db.prepare('SELECT * FROM suggested_events WHERE id = ?').get(req.params.id);
  
  res.json(suggestion);
});

// Delete suggested event
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM suggested_events WHERE id = ?').run(req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Suggested event not found' });
  }
  
  res.status(204).send();
});

export default router;
