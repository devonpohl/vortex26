// Full calendar page functionality
document.addEventListener('DOMContentLoaded', async () => {
  const [events, households] = await Promise.all([
    fetch('/api/events').then(r => r.json()),
    fetch('/api/households').then(r => r.json())
  ]);
  initCalendar(events, households);
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
    initialView: 'timeGridWeek',
    initialDate: '2026-06-28',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listMonth'
    },
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
