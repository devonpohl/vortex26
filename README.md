# Family Reunion Website

A self-hosted family reunion coordination site with event management, RSVPs, household tracking, and calendar integration.

## Features

- 🔐 Simple password protection (shared family password)
- 📅 Event creation with RSVPs
- 🗺️ Interactive maps for events and households
- 📆 Full calendar view with FullCalendar
- 👨‍👩‍👧‍👦 Household registration with arrival/departure dates
- 📸 Google Photos album embedding
- 🔄 Google Calendar sync (optional)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `SITE_PASSWORD` - the password you'll share with family
- `SESSION_SECRET` - a random string (use `openssl rand -base64 32`)

### 3. Initialize the database

```bash
npm run db:init
```

### 4. Start development server

```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
reunion-site/
├── src/
│   ├── index.ts          # Express app entry point
│   ├── db/
│   │   ├── init.ts       # Database schema
│   │   └── queries.ts    # Database operations
│   ├── middleware/
│   │   └── auth.ts       # Password authentication
│   └── routes/
│       ├── events.ts     # Event API routes
│       └── households.ts # Household API routes
├── public/
│   ├── index.html        # Main SPA shell
│   ├── login.html        # Login page
│   ├── css/style.css     # Styles
│   └── js/app.js         # Client-side app
├── .env.example          # Environment template
├── package.json
└── tsconfig.json
```

## API Routes

### Events
- `GET /api/events` - List all events
- `GET /api/events/upcoming?limit=N` - List upcoming events
- `GET /api/events/:id` - Get event with RSVPs
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/rsvp` - Add RSVPs (accepts `names` array)
- `PUT /api/events/:eventId/rsvp/:rsvpId` - Update RSVP
- `DELETE /api/events/:eventId/rsvp/:rsvpId` - Delete RSVP

### Households
- `GET /api/households` - List all households
- `GET /api/households/:id` - Get household
- `POST /api/households` - Create household
- `PUT /api/households/:id` - Update household
- `DELETE /api/households/:id` - Delete household

## Production Deployment

### On a VPS (e.g., Hetzner, DigitalOcean)

1. **Install Node.js** (v20+):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. **Install Caddy** (reverse proxy with auto-HTTPS):
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update && sudo apt install caddy
   ```

3. **Clone and setup app**:
   ```bash
   git clone <your-repo> /opt/reunion-site
   cd /opt/reunion-site
   npm install --production
   npm run build
   cp .env.example .env
   # Edit .env with production values
   npm run db:init
   ```

4. **Create systemd service** (`/etc/systemd/system/reunion.service`):
   ```ini
   [Unit]
   Description=Family Reunion Site
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/opt/reunion-site
   ExecStart=/usr/bin/node dist/index.js
   Restart=on-failure
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

5. **Configure Caddy** (`/etc/caddy/Caddyfile`):
   ```
   reunion.yourdomain.com {
       reverse_proxy localhost:3000
   }
   ```

6. **Start services**:
   ```bash
   sudo systemctl enable --now reunion
   sudo systemctl reload caddy
   ```

## Google Calendar Integration (Optional)

To sync events to a subscribable Google Calendar:

1. Create a Google Cloud project at https://console.cloud.google.com
2. Enable the Google Calendar API
3. Create a service account and download the JSON key
4. Create a new Google Calendar for the reunion
5. Share that calendar with your service account email (give it "Make changes" permission)
6. Add to `.env`:
   ```
   GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
   GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials/service-account.json
   ```

The calendar sync code is stubbed in `src/routes/events.ts` - implementation left as an exercise.

## Customization

### Change the map default location

Edit `public/js/app.js`, find `defaultCenter` in `initMap()` and set your coordinates.

### Add Google Photos

Edit `public/index.html`, find the `photos-template` and replace the placeholder with your Google Photos embed code.

### Styling

Edit `public/css/style.css` - CSS custom properties at the top control colors.

## License

MIT - do whatever you want with it.
