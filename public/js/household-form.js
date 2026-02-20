// Household form functionality
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initForm();
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
  const defaultCenter = [39.8283, -98.5795];
  map = L.map('location-map').setView(defaultCenter, 4);
  
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

    var gs = document.getElementById('geo-status');
    if (gs) {
      gs.textContent = '\u2705 Location confirmed';
      gs.style.color = 'var(--color-success)';
    }
  });
}

function initForm() {
  // Set default dates to June 2026
  document.getElementById('arrival_date').value = '2026-06-28';
  document.getElementById('departure_date').value = '2026-07-01';
  
  const form = document.getElementById('household-form');
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
      name: formData.get('name'),
      arrival_date: formData.get('arrival_date') || null,
      departure_date: formData.get('departure_date') || null,
      address: address,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    };
    
    try {
      const response = await fetch('/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add household');
      }
      
      window.location.href = '/';
      
    } catch (err) {
      alert('Error adding household: ' + err.message);
    }
  });
}
