// Event form functionality
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initForm();
  prefillFromQueryParams();
});

let map, marker;

async function geocodeAddress(address) {
  if (!address) return null;
  
  try {
    const encoded = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
      { headers: { 'User-Agent': 'FamilyReunionSite' } }
    );
    const results = await response.json();
    
    if (results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon)
      };
    }
  } catch (err) {
    console.error('Geocoding failed:', err);
  }
  return null;
}

function initMap() {
  // Default center - adjust for your location
  const defaultCenter = [42.6548, -86.2017]; // Saugatuck, MI area
  map = L.map('location-map').setView(defaultCenter, 10);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
  }).addTo(map);

  // Click to place marker
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;

    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng]).addTo(map);
    }

    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;

    // Update geo status if it exists
    var gs = document.getElementById('geo-status');
    if (gs) {
      gs.textContent = '\u2705 Location confirmed';
      gs.style.color = 'var(--color-success)';
    }
  });
}

function initForm() {
  // Set default dates to June 2026
  const startDefault = '2026-06-29T12:00';
  document.getElementById('start_time').value = startDefault;
  
  const form = document.getElementById('event-form');
  const addressInput = document.getElementById('address');
  
  var geoStatus = document.createElement('span');
  geoStatus.id = 'geo-status';
  geoStatus.style.cssText = 'font-size:0.85rem;margin-top:0.25rem;display:block;';
  addressInput.parentNode.appendChild(geoStatus);

  function updateGeoStatus() {
    var lat = document.getElementById('latitude').value;
    var lng = document.getElementById('longitude').value;
    if (lat && lng) {
      geoStatus.textContent = '\u2705 Location confirmed';
      geoStatus.style.color = 'var(--color-success)';
    } else {
      geoStatus.textContent = '';
    }
  }

  // Geocode on address blur
  addressInput.addEventListener('blur', async () => {
    const address = addressInput.value.trim();
    if (!address) return;

    geoStatus.textContent = 'Looking up address\u2026';
    geoStatus.style.color = 'var(--color-text-muted)';

    const coords = await geocodeAddress(address);
    if (coords) {
      document.getElementById('latitude').value = coords.lat;
      document.getElementById('longitude').value = coords.lng;

      // Update map
      if (marker) {
        marker.setLatLng([coords.lat, coords.lng]);
      } else {
        marker = L.marker([coords.lat, coords.lng]).addTo(map);
      }
      map.setView([coords.lat, coords.lng], 13);
      updateGeoStatus();
    } else {
      geoStatus.textContent = '\u274C Could not find this address. Try a more specific address or click the map.';
      geoStatus.style.color = 'var(--color-danger)';
    }
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    // Normalize start_time — Safari may leave datetime-local value in
    // a non-ISO format or reject programmatic values silently
    let startTime = formData.get('start_time') || '';
    let endTime = formData.get('end_time') || '';

    // Fall back to reading the input value directly if FormData is empty
    if (!startTime) {
      startTime = document.getElementById('start_time').value;
    }
    if (!endTime) {
      endTime = document.getElementById('end_time').value;
    }

    if (!startTime) {
      alert('Please enter a start time.');
      return;
    }

    var address = (formData.get('address') || '').trim();
    var lat = formData.get('latitude');
    var lng = formData.get('longitude');

    if (!address) {
      alert('Please enter an address.');
      return;
    }

    if (!lat || !lng) {
      alert('Location could not be confirmed. Please enter a valid address or click the map to set a pin.');
      return;
    }

    const data = {
      title: formData.get('title'),
      description: formData.get('description') || null,
      start_time: startTime,
      end_time: endTime || null,
      location_name: formData.get('location_name') || null,
      address: address,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    };

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create event');
      }

      const event = await response.json();
      window.location.href = `/events/${event.id}`;

    } catch (err) {
      alert('Error creating event: ' + err.message);
    }
  });
}

function prefillFromQueryParams() {
  const params = new URLSearchParams(window.location.search);
  
  // Pre-fill form fields from query params
  if (params.get('title')) {
    document.getElementById('title').value = params.get('title');
  }
  if (params.get('location_name')) {
    document.getElementById('location_name').value = params.get('location_name');
  }
  if (params.get('address')) {
    document.getElementById('address').value = params.get('address');
  }
  
  // Set coordinates and marker if provided
  const lat = params.get('latitude');
  const lng = params.get('longitude');
  if (lat && lng) {
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
    
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    // Wait for map to be ready, then set marker
    setTimeout(() => {
      if (marker) {
        marker.setLatLng([latNum, lngNum]);
      } else {
        marker = L.marker([latNum, lngNum]).addTo(map);
      }
      map.setView([latNum, lngNum], 13);
    }, 100);
  }
}
