import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/reunion.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

export default db;

// Type definitions for our models
export interface Household {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  arrival_date: string | null;
  departure_date: string | null;
  created_at: string;
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  address: string | null;
  start_time: string;
  end_time: string | null;
  google_calendar_event_id: string | null;
  created_at: string;
}

export interface RSVP {
  id: number;
  event_id: number;
  household_id: number | null;
  name: string | null;
  attending: 'yes' | 'no' | 'maybe';
  created_at: string;
}
