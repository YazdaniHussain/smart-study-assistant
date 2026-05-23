// ── Auth Guard ────────────────────────────────────────
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');
if (!token) window.location.href = './index.html';

document.getElementById('navUsername').textContent = user.username || 'Student';
document.getElementById('navAvatar').textContent   = (user.username || 'S')[0].toUpperCase();

const API     = 'http://localhost:5000/api/calendar';
const headers = {
  'Content-Type' : 'application/json',
  'Authorization': `Bearer ${token}`
};

// ── State ─────────────────────────────────────────────
let today        = new Date();
let currentYear  = today.getFullYear();
let currentMonth = today.getMonth();
let selectedDate = null;
let events       = [];

// ── Fetch Events ──────────────────────────────────────
async function fetchEvents() {
  try {
    const res = await fetch(API, { headers });
    events    = await res.json();
    renderCalendar();
  } catch { renderCalendar(); }
}

// ── Render Calendar ───────────────────────────────────
function renderCalendar() {
  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];

  document.getElementById('monthYear').textContent =
    `${monthNames[currentMonth]} ${currentYear}`;

  const grid      = document.getElementById('daysGrid');
  grid.innerHTML  = '';

  const firstDay  = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevDays  = new Date(currentYear, currentMonth, 0).getDate();

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = createDayCell(prevDays - i, true);
    grid.appendChild(cell);
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr  = formatDate(currentYear, currentMonth, d);
    const isToday  = d === today.getDate() &&
                     currentMonth === today.getMonth() &&
                     currentYear  === today.getFullYear();
    const hasEvent = events.some(e => e.event_date?.startsWith(dateStr));
    const isSelected = selectedDate === dateStr;

    const cell = createDayCell(d, false, isToday, hasEvent, isSelected);
    cell.addEventListener('click', () => selectDate(dateStr, d));
    grid.appendChild(cell);
  }

  // Next month fill
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d = 1; d <= remaining; d++) {
    grid.appendChild(createDayCell(d, true));
  }
}

// ── Create Day Cell ───────────────────────────────────
function createDayCell(day, otherMonth, isToday, hasEvent, isSelected) {
  const cell = document.createElement('div');
  cell.className = 'day-cell' +
    (otherMonth  ? ' other-month'  : '') +
    (isToday     ? ' today'        : '') +
    (hasEvent    ? ' has-events'   : '') +
    (isSelected  ? ' selected'     : '');
  cell.textContent = day;
  return cell;
}

// ── Format Date ───────────────────────────────────────
function formatDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// ── Select Date ───────────────────────────────────────
function selectDate(dateStr, day) {
  selectedDate = dateStr;
  renderCalendar();

  const dateObj   = new Date(dateStr + 'T00:00:00');
  const formatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  document.getElementById('selectedDateLabel').textContent = formatted;
  document.getElementById('addEventForm').style.display   = 'flex';

  const dayEvents = events.filter(e => e.event_date?.startsWith(dateStr));
  document.getElementById('eventCount').textContent =
    `${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}`;

  renderEventsList(dayEvents);
}

// ── Render Events List ────────────────────────────────
function renderEventsList(dayEvents) {
  const list = document.getElementById('eventsList');

  if (dayEvents.length === 0) {
    list.innerHTML = '<div class="no-events">No events for this day</div>';
    return;
  }

  list.innerHTML = dayEvents.map(e => `
    <div class="event-item">
      <div class="event-dot"></div>
      <div class="event-info">
        <div class="event-title">${e.title}</div>
        ${e.description ? `<div class="event-date">${e.description}</div>` : ''}
      </div>
      <button class="event-delete" onclick="deleteEvent(${e.id})">🗑</button>
    </div>
  `).join('');
}

// ── Add Event ─────────────────────────────────────────
document.getElementById('addEventBtn').addEventListener('click', async () => {
  const title = document.getElementById('eventTitle').value.trim();
  const desc  = document.getElementById('eventDesc').value.trim();
  if (!title)        return alert('Please enter an event title!');
  if (!selectedDate) return alert('Please select a date first!');

  try {
    const res   = await fetch(API, {
      method : 'POST',
      headers,
      body   : JSON.stringify({ title, description: desc, event_date: selectedDate })
    });
    const event = await res.json();
    events.push(event);

    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDesc').value  = '';

    const dayEvents = events.filter(e => e.event_date?.startsWith(selectedDate));
    document.getElementById('eventCount').textContent =
      `${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}`;

    renderEventsList(dayEvents);
    renderCalendar();
  } catch { alert('Error adding event'); }
});

// ── Delete Event ──────────────────────────────────────
async function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE', headers });
    events = events.filter(e => e.id !== id);
    const dayEvents = events.filter(e => e.event_date?.startsWith(selectedDate));
    document.getElementById('eventCount').textContent =
      `${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}`;
    renderEventsList(dayEvents);
    renderCalendar();
  } catch { alert('Error deleting event'); }
}

// ── Month Navigation ──────────────────────────────────
document.getElementById('prevMonth').addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
});

// ── Init ──────────────────────────────────────────────
fetchEvents(); 
