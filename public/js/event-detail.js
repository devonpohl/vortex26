// Event detail page functionality
let eventData = null;
let map = null;

document.addEventListener('DOMContentLoaded', async () => {
  const eventId = window.location.pathname.split('/').pop();

  await loadEvent(eventId);
  initEventActions(eventId);
  initRSVPForm(eventId);
  initEditModal(eventId);
});

async function loadEvent(eventId) {
  try {
    const response = await fetch(`/api/events/${eventId}`);
    if (!response.ok) {
      if (response.status === 404) {
        document.querySelector('main').innerHTML = '<p>Event not found.</p>';
        return;
      }
      throw new Error('Failed to load event');
    }

    const data = await response.json();
    eventData = data.event;

    // Populate event details
    document.getElementById('event-title').textContent = eventData.title;
    document.title = `${eventData.title} - Pohler Vortex 2026`;

    // Format time
    const start = new Date(eventData.start_time);
    let timeStr = start.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    if (eventData.end_time) {
      const end = new Date(eventData.end_time);
      timeStr += ` - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    document.getElementById('event-time').textContent = timeStr;

    // Location
    if (eventData.location_name) {
      document.getElementById('event-location').textContent = `📍 ${eventData.location_name}`;
    }
    if (eventData.address) {
      document.getElementById('event-address').textContent = eventData.address;
    }

    // Description
    if (eventData.description) {
      document.getElementById('event-description').textContent = eventData.description;
    }

    // Map (only init once)
    if (eventData.latitude && eventData.longitude && !map) {
      initMap(eventData.latitude, eventData.longitude, eventData.title);
    } else if (!eventData.latitude || !eventData.longitude) {
      document.getElementById('event-map').style.display = 'none';
    }

    // RSVPs
    populateRSVPs(eventId, data.rsvps);

  } catch (err) {
    console.error('Error loading event:', err);
    alert('Error loading event');
  }
}

function initMap(lat, lng, title) {
  const mapEl = document.getElementById('event-map');
  map = L.map(mapEl).setView([lat, lng], 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
  }).addTo(map);

  L.marker([lat, lng]).addTo(map).bindPopup(title).openPopup();
}

function populateRSVPs(eventId, rsvps) {
  const list = document.getElementById('rsvp-attendees');
  list.innerHTML = '';

  if (rsvps.length === 0) {
    list.innerHTML = '<li class="empty">No one yet — be the first!</li>';
    return;
  }

  rsvps.forEach(function (rsvp) {
    var name = rsvp.household_name || rsvp.name || 'Anonymous';
    var li = document.createElement('li');
    li.className = 'rsvp-item';

    var nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    li.appendChild(nameSpan);

    var removeBtn = document.createElement('button');
    removeBtn.className = 'rsvp-remove';
    removeBtn.textContent = '✕';
    removeBtn.title = 'Remove';
    removeBtn.addEventListener('click', async function () {
      try {
        var resp = await fetch(`/api/events/${eventId}/rsvp/${rsvp.id}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error('Failed to remove');
        await loadEvent(eventId);
      } catch (err) {
        alert('Error removing RSVP');
      }
    });
    li.appendChild(removeBtn);

    list.appendChild(li);
  });
}

function initEventActions(eventId) {
  document.getElementById('edit-btn').addEventListener('click', function () {
    openEditModal();
  });

  document.getElementById('delete-btn').addEventListener('click', async function () {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) {
      return;
    }

    try {
      var response = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      window.location.href = '/';
    } catch (err) {
      alert('Error deleting event');
    }
  });
}

function initRSVPForm(eventId) {
  var form = document.getElementById('rsvp-form');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var name = document.getElementById('rsvp-name').value.trim();
    if (!name) {
      alert('Please enter your name');
      return;
    }

    try {
      var response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, attending: 'yes' })
      });

      if (!response.ok) {
        var error = await response.json();
        throw new Error(error.error || 'Failed to RSVP');
      }

      await loadEvent(eventId);
      form.reset();

    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
}

function openEditModal() {
  var modal = document.getElementById('edit-modal');
  modal.classList.remove('hidden');

  document.getElementById('edit-title').value = eventData.title;
  document.getElementById('edit-description').value = eventData.description || '';
  document.getElementById('edit-location_name').value = eventData.location_name || '';
  document.getElementById('edit-address').value = eventData.address || '';

  if (eventData.start_time) {
    document.getElementById('edit-start_time').value = eventData.start_time.slice(0, 16);
  }
  if (eventData.end_time) {
    document.getElementById('edit-end_time').value = eventData.end_time.slice(0, 16);
  }
}

function initEditModal(eventId) {
  var modal = document.getElementById('edit-modal');
  var form = document.getElementById('edit-form');

  document.getElementById('cancel-edit').addEventListener('click', function () {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var formData = new FormData(form);
    var data = {
      title: formData.get('title'),
      description: formData.get('description') || null,
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time') || null,
      location_name: formData.get('location_name') || null,
      address: formData.get('address') || null,
      latitude: eventData.latitude,
      longitude: eventData.longitude
    };

    try {
      var response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        var error = await response.json();
        throw new Error(error.error || 'Failed to update event');
      }

      modal.classList.add('hidden');
      await loadEvent(eventId);

    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
}
