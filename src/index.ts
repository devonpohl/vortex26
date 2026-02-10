import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

import { requireAuth, checkPassword } from './middleware/auth.js';
import eventsRouter from './routes/events.js';
import householdsRouter from './routes/households.js';
import suggestedRouter from './routes/suggested-events.js';
import scoresRouter from './routes/scores.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Railway's reverse proxy so secure cookies work
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
  }
}));

// Static assets only (CSS, JS, images) — HTML served through auth-protected routes
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/img', express.static(path.join(__dirname, '../public/img')));

// Login page (no auth required)
app.get('/login', (req, res) => {
  if (req.session.authenticated) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Login handler
app.post('/login', (req, res) => {
  const { password } = req.body;
  
  if (checkPassword(password)) {
    req.session.authenticated = true;
    return res.redirect('/');
  }
  
  res.redirect('/login?error=1');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Protected API routes
app.use('/api/events', requireAuth, eventsRouter);
app.use('/api/households', requireAuth, householdsRouter);
app.use('/api/suggested', requireAuth, suggestedRouter);
app.use('/api/scores', requireAuth, scoresRouter);

// Protected page routes
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/events/new', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/event-form.html'));
});

app.get('/events/:id', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/event-detail.html'));
});

app.get('/households/new', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/household-form.html'));
});

app.get('/suggested', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/suggested.html'));
});

app.get('/photos', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/photos.html'));
});

app.get('/snake', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/snake.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🎉 Reunion site running at http://localhost:${PORT}`);
});
