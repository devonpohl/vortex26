// Home page functionality
document.addEventListener('DOMContentLoaded', async () => {
  // Load data
  const [events, households] = await Promise.all([
    fetch('/api/events').then(r => r.json()),
    fetch('/api/households').then(r => r.json())
  ]);

  // Initialize full calendar
  initCalendar(events, households);
  
  // Initialize map
  initMap(events, households);
  
  // Populate upcoming events list (includes arrivals/departures)
  populateUpcomingEvents(events, households);
});

function initCalendar(events, households) {
  const calendarEl = document.getElementById('full-calendar');
  
  // Build calendar events array
  const calendarEvents = [];
  
  // Add regular events
  events.forEach(e => {
    calendarEvents.push({
      id: e.id,
      title: e.title,
      start: e.start_time,
      end: e.end_time,
      url: `/events/${e.id}`,
      color: '#2563eb',
      extendedProps: {
        location: e.location_name,
        description: e.description
      }
    });
  });
  
  // Add household stays as all-day events (displayed in all-day section at top)
  households.forEach(h => {
    if (h.arrival_date && h.departure_date) {
      // Add one day to departure to include it (FullCalendar end is exclusive)
      const departureParts = h.departure_date.split('-');
      const endDate = new Date(
        parseInt(departureParts[0]),
        parseInt(departureParts[1]) - 1,
        parseInt(departureParts[2]) + 1
      );
      const endStr = endDate.getFullYear() + '-' + 
        String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(endDate.getDate()).padStart(2, '0');
      
      calendarEvents.push({
        title: '🏠 ' + h.name,
        start: h.arrival_date,
        end: endStr,
        allDay: true,
        color: '#16a34a'
      });
    }
  });
  
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'reunionWeek',
    initialDate: '2026-06-28',
    height: '100%',
    nowIndicator: true,
    views: {
      reunionWeek: {
        type: 'timeGrid',
        visibleRange: { start: '2026-06-28', end: '2026-07-03' }
      }
    },
    headerToolbar: false,
    allDaySlot: true,
    events: calendarEvents,
    eventClick: function(info) {
      info.jsEvent.preventDefault();
      if (info.event.url) {
        window.location.href = info.event.url;
      }
    },
    eventDidMount: function(info) {
      if (info.event.extendedProps.location) {
        info.el.title = info.event.extendedProps.location;
      }
    }
  });
  
  calendar.render();
}

function initMap(events, households) {
  // Default center (US center) - adjust based on your family's location
  const defaultCenter = [39.8283, -98.5795];
  const map = L.map('map').setView(defaultCenter, 4);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
  }).addTo(map);

  const bounds = [];

  // Add household markers
  households.forEach(h => {
    if (h.latitude && h.longitude) {
      const marker = L.marker([h.latitude, h.longitude], {
        icon: L.divIcon({
          className: 'household-marker',
          html: `<div style="display: flex; flex-direction: column; align-items: center; transform: translateX(-50%);">
            <span style="font-size: 32px;">🏠</span>
            <span style="background: white; padding: 1px 4px; border-radius: 3px; font-size: 10px; font-weight: bold; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.2);">${h.name}</span>
          </div>`,
          iconSize: [32, 50],
          iconAnchor: [16, 50]
        })
      }).addTo(map);
      
      let popup = `<strong>${h.name}</strong>`;
      if (h.address) {
        popup += `<br>${h.address}`;
      }
      marker.bindPopup(popup);
      
      bounds.push([h.latitude, h.longitude]);
    }
  });

  // Add event markers (red)
  events.forEach(e => {
    if (e.latitude && e.longitude) {
      const marker = L.marker([e.latitude, e.longitude], {
        icon: L.divIcon({
          className: 'event-marker',
          html: '📍',
          iconSize: [24, 24]
        })
      }).addTo(map);
      
      const date = new Date(e.start_time).toLocaleDateString();
      marker.bindPopup(`<strong>${e.title}</strong><br>${date}<br><a href="/events/${e.id}">View details</a>`);
      
    }
  });

  // Fit map to household markers only
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [20, 20] });
  }

  // Fullscreen toggle
  const mapEl = document.getElementById('map');
  const mapCard = document.querySelector('.map-card');
  const btn = document.createElement('button');
  btn.className = 'map-fullscreen-btn';
  btn.title = 'Toggle fullscreen';
  btn.textContent = '⛶';
  mapEl.appendChild(btn);

  btn.addEventListener('click', function () {
    if (!document.fullscreenElement) {
      mapCard.requestFullscreen().then(function () {
        map.invalidateSize();
      });
    } else {
      document.exitFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', function () {
    // Give the browser a frame to settle layout, then tell Leaflet to recalculate
    setTimeout(function () { map.invalidateSize(); }, 100);
  });
}

function populateUpcomingEvents(events, households) {
  const list = document.getElementById('upcoming-events');
  const now = new Date();
  
  // Build combined list of events + arrivals + departures
  const items = [];
  
  // Add events
  events.forEach(e => {
    const date = new Date(e.start_time);
    if (date >= now) {
      items.push({
        type: 'event',
        date: date,
        title: e.title,
        id: e.id
      });
    }
  });
  
  // Add household arrivals
  households.forEach(h => {
    if (h.arrival_date) {
      const date = new Date(h.arrival_date + 'T12:00:00');
      if (date >= now) {
        items.push({
          type: 'arrival',
          date: date,
          title: `${h.name} arrives`,
          household: h
        });
      }
    }
    
    if (h.departure_date) {
      const date = new Date(h.departure_date + 'T12:00:00');
      if (date >= now) {
        items.push({
          type: 'departure',
          date: date,
          title: `${h.name} departs`,
          household: h
        });
      }
    }
  });
  
  // Sort by date
  items.sort((a, b) => a.date - b.date);
  
  // Take first 15
  const upcoming = items.slice(0, 15);
  
  if (upcoming.length === 0) {
    list.innerHTML = '<li>No upcoming events. <a href="/events/new">Create one!</a></li>';
    return;
  }
  
  list.innerHTML = upcoming.map(item => {
    const formatted = item.date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      ...(item.type === 'event' ? { hour: 'numeric', minute: '2-digit' } : {})
    });
    
    let icon = '';
    let link = '';
    
    if (item.type === 'event') {
      icon = '📅';
      link = `<a href="/events/${item.id}">${item.title}</a>`;
    } else if (item.type === 'arrival') {
      icon = '✈️';
      link = `<span class="arrival">${item.title}</span>`;
    } else {
      icon = '👋';
      link = `<span class="departure">${item.title}</span>`;
    }
    
    return `
      <li class="event-item">
        <span class="event-icon">${icon}</span>
        ${link}
        <span class="event-time">${formatted}</span>
      </li>
    `;
  }).join('');
}
