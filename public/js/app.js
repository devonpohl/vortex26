// ============ SIMPLE CLIENT-SIDE ROUTER ============

class Router {
  constructor(routes) {
    this.routes = routes;
    window.addEventListener('popstate', () => this.handleRoute());
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href.startsWith(window.location.origin) && !link.hasAttribute('data-external')) {
        e.preventDefault();
        this.navigate(link.pathname);
      }
    });
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  handleRoute() {
    const path = window.location.pathname;
    
    for (const route of this.routes) {
      const match = path.match(route.pattern);
      if (match) {
        route.handler(match);
        this.updateActiveNav(path);
        return;
      }
    }
    
    // 404
    document.getElementById('app').innerHTML = '<h1>Page not found</h1>';
  }

  updateActiveNav(path) {
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.classList.toggle('active', link.pathname === path);
    });
  }
}

// ============ API HELPERS ============

async function api(endpoint, options = {}) {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  if (response.status === 204) return null;
  return response.json();
}

// ============ TEMPLATE HELPERS ============

function renderTemplate(templateId) {
  const template = document.getElementById(templateId);
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(template.content.cloneNode(true));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatDateShort(dateString) {
  const date = new Date(dateString);
  return {
    day: date.getDate(),
    month: date.toLocaleDateString('en-US', { month: 'short' })
  };
}

// ============ MAP HELPERS ============

let maps = {};

function initMap(elementId, options = {}) {
  const element = document.getElementById(elementId);
  if (!element) return null;
  
  // Default center (you can change this to your reunion location)
  const defaultCenter = [39.8283, -98.5795]; // Center of US
  const center = options.center || defaultCenter;
  const zoom = options.zoom || 4;
  
  const map = L.map(elementId).setView(center, zoom);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
  }).addTo(map);
  
  maps[elementId] = map;
  
  // Fix for map not rendering properly in hidden/dynamic containers
  setTimeout(() => map.invalidateSize(), 100);
  
  return map;
}

function addClickableMap(elementId, latInput, lngInput) {
  const map = initMap(elementId, { zoom: 4 });
  if (!map) return;
  
  let marker = null;
  
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng]).addTo(map);
    }
    
    document.getElementById(latInput).value = lat;
    document.getElementById(lngInput).value = lng;
  });
  
  return { map, setMarker: (lat, lng) => {
    if (lat && lng) {
      marker = L.marker([lat, lng]).addTo(map);
      map.setView([lat, lng], 10);
    }
  }};
}

// ============ PAGE HANDLERS ============

async function renderHome() {
  renderTemplate('home-template');
  
  // Load upcoming events
  try {
    const events = await api('/events/upcoming?limit=5');
    const list = document.getElementById('upcoming-events-list');
    
    if (events.length === 0) {
      list.innerHTML = '<p>No upcoming events yet. Create one!</p>';
    } else {
      list.innerHTML = events.map(event => {
        const { day, month } = formatDateShort(event.start_time);
        return `
          <a href="/events/${event.id}" class="event-item">
            <div class="event-date">
              <div class="day">${day}</div>
              <div class="month">${month}</div>
            </div>
            <div class="event-info">
              <h3>${escapeHtml(event.title)}</h3>
              <p>${event.location_name ? escapeHtml(event.location_name) : 'Location TBD'}</p>
            </div>
          </a>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Failed to load events:', err);
  }
  
  // Initialize mini calendar
  const calendarEl = document.getElementById('home-calendar');
  if (calendarEl) {
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 300,
      headerToolbar: {
        left: 'prev,next',
        center: 'title',
        right: ''
      },
      events: '/api/events',
      eventClick: (info) => {
        router.navigate(`/events/${info.event.id}`);
      },
      eventDataTransform: (event) => ({
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
      })
    });
    calendar.render();
  }
  
  // Initialize map with households
  const map = initMap('home-map');
  if (map) {
    try {
      const households = await api('/households');
      households.forEach(h => {
        if (h.lat && h.lng) {
          L.marker([h.lat, h.lng])
            .bindPopup(`<strong>${escapeHtml(h.name)}</strong>`)
            .addTo(map);
        }
      });
      
      // Fit bounds if we have markers
      const markers = households.filter(h => h.lat && h.lng);
      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers.map(h => [h.lat, h.lng]));
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    } catch (err) {
      console.error('Failed to load households:', err);
    }
  }
}

async function renderCalendar() {
  renderTemplate('calendar-template');
  
  const calendarEl = document.getElementById('full-calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek'
    },
    events: '/api/events',
    eventClick: (info) => {
      router.navigate(`/events/${info.event.id}`);
    },
    eventDataTransform: (event) => ({
      id: event.id,
      title: event.title,
      start: event.start_time,
      end: event.end_time,
    })
  });
  calendar.render();
  
  // Subscribe button (placeholder - requires Google Calendar setup)
  document.getElementById('subscribe-btn').addEventListener('click', () => {
    alert('Calendar subscription will be available once Google Calendar is configured.');
  });
}

async function renderEventForm(match) {
  renderTemplate('event-form-template');
  
  const eventId = match[1]; // Will be undefined for new events
  const isEdit = !!eventId;
  
  if (isEdit) {
    document.getElementById('form-title').textContent = 'Edit Event';
  }
  
  const mapHelper = addClickableMap('event-map', 'lat', 'lng');
  
  // If editing, load existing event
  if (isEdit) {
    try {
      const event = await api(`/events/${eventId}`);
      document.getElementById('title').value = event.title || '';
      document.getElementById('description').value = event.description || '';
      document.getElementById('start_time').value = event.start_time?.slice(0, 16) || '';
      document.getElementById('end_time').value = event.end_time?.slice(0, 16) || '';
      document.getElementById('location_name').value = event.location_name || '';
      document.getElementById('address').value = event.address || '';
      document.getElementById('lat').value = event.lat || '';
      document.getElementById('lng').value = event.lng || '';
      
      if (event.lat && event.lng) {
        mapHelper.setMarker(event.lat, event.lng);
      }
    } catch (err) {
      console.error('Failed to load event:', err);
    }
  }
  
  // Form submission
  document.getElementById('event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      if (isEdit) {
        await api(`/events/${eventId}`, { method: 'PUT', body: data });
      } else {
        await api('/events', { method: 'POST', body: data });
      }
      router.navigate('/');
    } catch (err) {
      alert('Failed to save event: ' + err.message);
    }
  });
}

async function renderEventDetail(match) {
  const eventId = match[1];
  renderTemplate('event-detail-template');
  
  try {
    const event = await api(`/events/${eventId}`);
    
    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-description').textContent = event.description || 'No description';
    document.getElementById('event-when').textContent = formatDate(event.start_time) + 
      (event.end_time ? ` - ${formatDate(event.end_time)}` : '');
    document.getElementById('event-where').textContent = 
      [event.location_name, event.address].filter(Boolean).join(' • ') || 'Location TBD';
    
    // RSVP summary
    const summary = document.getElementById('rsvp-summary');
    summary.innerHTML = `
      <div class="rsvp-count yes">
        <div class="number">${event.rsvp_counts.yes}</div>
        <div class="label">Yes</div>
      </div>
      <div class="rsvp-count maybe">
        <div class="number">${event.rsvp_counts.maybe}</div>
        <div class="label">Maybe</div>
      </div>
      <div class="rsvp-count no">
        <div class="number">${event.rsvp_counts.no}</div>
        <div class="label">No</div>
      </div>
    `;
    
    // RSVP list
    const rsvpList = document.getElementById('rsvp-list');
    if (event.rsvps.length === 0) {
      rsvpList.innerHTML = '<p>No RSVPs yet</p>';
    } else {
      rsvpList.innerHTML = event.rsvps.map(rsvp => `
        <div class="rsvp-item">
          <span>${escapeHtml(rsvp.name)}</span>
          <span class="rsvp-status ${rsvp.attending}">${rsvp.attending}</span>
        </div>
      `).join('');
    }
    
    // Map
    if (event.lat && event.lng) {
      const map = initMap('event-map', { center: [event.lat, event.lng], zoom: 14 });
      L.marker([event.lat, event.lng]).addTo(map);
    }
    
    // Edit button
    document.getElementById('edit-event-btn').addEventListener('click', () => {
      router.navigate(`/events/${eventId}/edit`);
    });
    
    // Delete button
    document.getElementById('delete-event-btn').addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this event?')) {
        try {
          await api(`/events/${eventId}`, { method: 'DELETE' });
          router.navigate('/');
        } catch (err) {
          alert('Failed to delete event: ' + err.message);
        }
      }
    });
    
    // RSVP form
    document.getElementById('rsvp-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const names = document.getElementById('rsvp-names').value
        .split('\n')
        .map(n => n.trim())
        .filter(Boolean);
      const attending = document.getElementById('rsvp-attending').value;
      
      if (names.length === 0) {
        alert('Please enter at least one name');
        return;
      }
      
      try {
        await api(`/events/${eventId}/rsvp`, { 
          method: 'POST', 
          body: { names, attending } 
        });
        // Reload page to show new RSVPs
        router.handleRoute();
      } catch (err) {
        alert('Failed to add RSVP: ' + err.message);
      }
    });
    
  } catch (err) {
    document.getElementById('app').innerHTML = `
      <div class="error-message">Failed to load event: ${err.message}</div>
    `;
  }
}

async function renderHouseholds() {
  renderTemplate('households-template');
  
  try {
    const households = await api('/households');
    
    // Map
    const map = initMap('households-map');
    households.forEach(h => {
      if (h.lat && h.lng) {
        const popup = `
          <strong>${escapeHtml(h.name)}</strong><br>
          ${h.arrival_date ? `Arrives: ${h.arrival_date}` : ''}<br>
          ${h.departure_date ? `Departs: ${h.departure_date}` : ''}
        `;
        L.marker([h.lat, h.lng]).bindPopup(popup).addTo(map);
      }
    });
    
    if (households.some(h => h.lat && h.lng)) {
      const markers = households.filter(h => h.lat && h.lng);
      const bounds = L.latLngBounds(markers.map(h => [h.lat, h.lng]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
    
    // List
    const list = document.getElementById('households-list');
    if (households.length === 0) {
      list.innerHTML = '<p>No households registered yet.</p>';
    } else {
      list.innerHTML = households.map(h => `
        <div class="household-item">
          <h3>${escapeHtml(h.name)}</h3>
          <p>
            ${h.arrival_date ? `Arrives ${h.arrival_date}` : ''}
            ${h.arrival_date && h.departure_date ? ' • ' : ''}
            ${h.departure_date ? `Departs ${h.departure_date}` : ''}
          </p>
        </div>
      `).join('');
    }
    
  } catch (err) {
    console.error('Failed to load households:', err);
  }
}

async function renderHouseholdForm() {
  renderTemplate('household-form-template');
  
  const mapHelper = addClickableMap('household-map', 'h-lat', 'h-lng');
  
  document.getElementById('household-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      address: formData.get('address'),
      arrival_date: formData.get('arrival_date'),
      departure_date: formData.get('departure_date'),
      lat: formData.get('lat'),
      lng: formData.get('lng'),
    };
    
    try {
      await api('/households', { method: 'POST', body: data });
      router.navigate('/households');
    } catch (err) {
      alert('Failed to save household: ' + err.message);
    }
  });
}

function renderPhotos() {
  renderTemplate('photos-template');
}

// ============ UTILITIES ============

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============ INITIALIZE ROUTER ============

const router = new Router([
  { pattern: /^\/$/, handler: renderHome },
  { pattern: /^\/calendar$/, handler: renderCalendar },
  { pattern: /^\/events\/new$/, handler: renderEventForm },
  { pattern: /^\/events\/(\d+)\/edit$/, handler: renderEventForm },
  { pattern: /^\/events\/(\d+)$/, handler: renderEventDetail },
  { pattern: /^\/households$/, handler: renderHouseholds },
  { pattern: /^\/households\/new$/, handler: renderHouseholdForm },
  { pattern: /^\/photos$/, handler: renderPhotos },
]);

// Initial route
router.handleRoute();
