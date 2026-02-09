import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/reunion.db');

// Ensure database directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS households (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    address TEXT,
    arrival_date TEXT,
    departure_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    latitude REAL,
    longitude REAL,
    location_name TEXT,
    address TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT,
    google_calendar_event_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    household_id INTEGER,
    name TEXT,
    attending TEXT CHECK(attending IN ('yes', 'no', 'maybe')) NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS suggested_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    latitude REAL,
    longitude REAL,
    location_name TEXT,
    address TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    website_url TEXT,
    reviews_url TEXT,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_time);
  CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps(event_id);
  CREATE INDEX IF NOT EXISTS idx_households_dates ON households(arrival_date, departure_date);
`);

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
