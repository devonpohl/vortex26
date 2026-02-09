// Suggested events page functionality
document.addEventListener('DOMContentLoaded', async () => {
  const suggestions = await fetch('/api/suggested').then(r => r.json());
  renderSuggestions(suggestions);
});

function renderSuggestions(suggestions) {
  const grid = document.getElementById('suggestions-grid');
  
  if (suggestions.length === 0) {
    grid.innerHTML = '<p>No event ideas yet. Check back soon!</p>';
    return;
  }
  
  grid.innerHTML = suggestions.map(s => {
    const imageHtml = s.image_url 
      ? `<img src="${s.image_url}" alt="${s.title}" class="suggestion-image">`
      : `<div class="suggestion-image placeholder">📍</div>`;
    
    const linksHtml = [];
    if (s.website_url) {
      linksHtml.push(`<a href="${s.website_url}" target="_blank">🌐 Website</a>`);
    }
    if (s.reviews_url) {
      linksHtml.push(`<a href="${s.reviews_url}" target="_blank">⭐ Reviews</a>`);
    }
    
    const contactHtml = [];
    if (s.contact_phone) {
      contactHtml.push(`📞 ${s.contact_phone}`);
    }
    if (s.contact_email) {
      contactHtml.push(`✉️ ${s.contact_email}`);
    }
    
    // Build query params for pre-filling event form
    const params = new URLSearchParams();
    params.set('title', s.title);
    if (s.location_name) params.set('location_name', s.location_name);
    if (s.address) params.set('address', s.address);
    if (s.latitude) params.set('latitude', s.latitude);
    if (s.longitude) params.set('longitude', s.longitude);
    
    return `
      <div class="suggestion-card">
        ${imageHtml}
        <div class="suggestion-content">
          <h3>${s.title}</h3>
          ${s.location_name ? `<div class="suggestion-location">📍 ${s.location_name}</div>` : ''}
          ${s.address ? `<div class="suggestion-location">${s.address}</div>` : ''}
          ${s.description ? `<div class="suggestion-description">${s.description}</div>` : ''}
          ${contactHtml.length > 0 ? `<div class="suggestion-contact">${contactHtml.join(' &nbsp;|&nbsp; ')}</div>` : ''}
          ${linksHtml.length > 0 ? `<div class="suggestion-links">${linksHtml.join(' ')}</div>` : ''}
          <div class="suggestion-actions">
            <a href="/events/new?${params.toString()}" class="btn-primary btn-create-event">
              ➕ Create Event
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
