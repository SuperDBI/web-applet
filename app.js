const visitorIdEl = document.getElementById('visitorId');
const bgSelector = document.getElementById('bgSelector');
const statusEl = document.getElementById('status');
const dataForm = document.getElementById('dataForm');
const fieldName = document.getElementById('fieldName');
const fieldEmail = document.getElementById('fieldEmail');
const fieldGpa = document.getElementById('fieldGpa');
const fieldSatAct = document.getElementById('fieldSatAct');
const summerActivityInputs = document.querySelectorAll('input[name="summerActivity"]');
const fieldSpecialInterests = document.getElementById('fieldSpecialInterests');
const fieldColor = document.getElementById('fieldColor');
const fieldColor2 = document.getElementById('fieldColor2');
const fieldNotes = document.getElementById('fieldNotes');
const collegeRegionAreas = document.querySelectorAll('.college-region-overlay .region-hitbox');
const collegeRegionRadios = document.querySelectorAll('input[name="collegeRegion"]');
const collegeRegionRadioLabels = document.querySelectorAll('.college-region-options label');
const colorChoiceInputs = document.querySelectorAll('input[name="colorChoice"]');
const colorChoiceInputs2 = document.querySelectorAll('input[name="colorChoice2"]');
const clubChoiceInputs = document.querySelectorAll('input[name="clubChoice"]');
const musicPreferenceInputs = document.querySelectorAll('input[name="musicPreference"]');
const iconOrder = document.getElementById('iconOrder');
const sportsOrder = document.getElementById('sportsOrder');
const downloadCsvBtn = document.getElementById('downloadCsv');
const downloadPdfBtn = document.getElementById('downloadPdf');
const recipientEmail = document.getElementById('recipientEmail');
const emailCsvFile = document.getElementById('emailCsvFile');
const emailPdfFile = document.getElementById('emailPdfFile');
const sendServerBtn = document.getElementById('sendServerBtn');
const sendFilesBtn = document.getElementById('sendFilesBtn');
const entrySummary = document.getElementById('entrySummary');
const entryList = document.getElementById('entryList');
const appContainer = document.querySelector('.container');
const disclaimerOverlay = document.getElementById('disclaimerOverlay');
const disclaimerTextEl = document.getElementById('disclaimerText');
const disclaimerAgree = document.getElementById('disclaimerAgree');
const disclaimerDecline = document.getElementById('disclaimerDecline');
const disclaimerContinueBtn = document.getElementById('disclaimerContinueBtn');
const disclaimerStatusEl = document.getElementById('disclaimerStatus');

const STORAGE_KEY = 'freecapsEntries';
const VISITOR_ID_KEY = 'freecapsVisitorId';

let visitorId = sessionStorage.getItem(VISITOR_ID_KEY) || localStorage.getItem(VISITOR_ID_KEY) || '';
let entries = [];

try {
  const sessionEntries = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
  if (Array.isArray(sessionEntries) && sessionEntries.length) {
    entries = sessionEntries;
  } else {
    const localEntries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(localEntries)) {
      entries = localEntries;
    }
  }
} catch (error) {
  entries = [];
}

const iconDefinitions = [
  { name: 'Chimpanzee', emoji: '🐒' },
  { name: 'Elephant', emoji: '🐘' },
  { name: 'Snake', emoji: '🐍' },
  { name: 'Dog', emoji: '🐕' },
  { name: 'Cat', emoji: '🐈' },
];

let draggedIcon = null;

const sportsDefinitions = [
  { name: 'Basketball', emoji: '🏀' },
  { name: 'Football', emoji: '🏈' },
  { name: 'Swimming', emoji: '🏊' },
  { name: 'Track', emoji: '🏃' },
  { name: 'Soccer', emoji: '⚽' },
  { name: 'Baseball', emoji: '⚾' },
  { name: 'Hockey', emoji: '🏒' },
];

function renderIconOrder() {
  iconOrder.innerHTML = iconDefinitions
    .map((icon) => `
      <span class="animal-icon" draggable="true" data-animal="${icon.name}" aria-label="${icon.name}">${icon.emoji}</span>`)
    .join('');

  iconOrder.querySelectorAll('.animal-icon').forEach((item) => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('dragend', handleDragEnd);
  });
}

function renderSportsOrder() {
  sportsOrder.innerHTML = sportsDefinitions
    .map((sport) => `
      <span class="animal-icon" draggable="true" data-animal="${sport.name}" aria-label="${sport.name}">${sport.emoji}</span>`)
    .join('');

  sportsOrder.querySelectorAll('.animal-icon').forEach((item) => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('dragend', handleDragEnd);
  });
}

function handleDragStart(event) {
  draggedIcon = event.target;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', event.target.dataset.animal);
  event.target.classList.add('dragging');
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(event) {
  if (event.target.classList.contains('animal-icon') && event.target !== draggedIcon) {
    event.target.classList.add('drag-over');
  }
}

function handleDragLeave(event) {
  if (event.target.classList.contains('animal-icon')) {
    event.target.classList.remove('drag-over');
  }
}

function handleDrop(event) {
  event.preventDefault();
  const target = event.target.closest('.animal-icon');
  if (!target || target === draggedIcon || draggedIcon.parentNode !== target.parentNode) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const insertAfter = event.clientX > rect.left + rect.width / 2;
  if (insertAfter) {
    target.after(draggedIcon);
  } else {
    target.before(draggedIcon);
  }
  target.classList.remove('drag-over');
}

function handleDragEnd(event) {
  event.target.classList.remove('dragging');
  document.querySelectorAll('.animal-icon').forEach((item) => item.classList.remove('drag-over'));
}

function getIconOrder() {
  return Array.from(iconOrder.children).map((item) => item.dataset.animal);
}

function getSportsOrder() {
  return Array.from(sportsOrder.children).map((item) => item.dataset.animal);
}

function getMusicPreference() {
  const checked = document.querySelector('input[name="musicPreference"]:checked');
  return checked ? checked.value : 'Outdoor Festivals';
}

function getCollegeRegion() {
  const checked = document.querySelector('input[name="collegeRegion"]:checked');
  return checked ? checked.value : 'West';
}

function updateCollegeRegionMap(region) {
  collegeRegionAreas.forEach((area) => {
    area.classList.toggle('selected', area.dataset.region === region);
  });
  collegeRegionRadioLabels.forEach((label) => {
    const input = label.querySelector('input[name="collegeRegion"]');
    label.classList.toggle('selected', input && input.value === region);
  });
}

function selectCollegeRegion(region) {
  const target = document.querySelector(`input[name="collegeRegion"][value="${region}"]`);
  if (target) {
    target.checked = true;
    updateCollegeRegionMap(region);
  }
}

function getClubPreferences() {
  return Array.from(clubChoiceInputs)
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function getSummerActivities() {
  return Array.from(summerActivityInputs)
    .filter((input) => input.checked)
    .map((input) => input.value)
    .join(', ');
}

function resetSummerActivities() {
  summerActivityInputs.forEach((input) => {
    input.checked = input.value === 'Volunteer';
  });
}

function resetMusicPreference() {
  if (musicPreferenceInputs.length > 0) {
    musicPreferenceInputs[0].checked = true;
  }
}

function resetCollegeRegion() {
  const defaultRegion = document.querySelector('input[name="collegeRegion"][value="West"]');
  if (defaultRegion) {
    defaultRegion.checked = true;
    updateCollegeRegionMap('West');
  }
}

function resetColorChoice() {
  const defaultChoice = document.querySelector('input[name="colorChoice"][value="#4a90e2"]');
  if (defaultChoice) {
    defaultChoice.checked = true;
  }
  fieldColor.value = '#4a90e2';
}

function resetColorChoice2() {
  const defaultChoice2 = document.querySelector('input[name="colorChoice2"][value="#4a90e2"]');
  if (defaultChoice2) {
    defaultChoice2.checked = true;
  }
  fieldColor2.value = '#4a90e2';
}

function resetClubChoices() {
  clubChoiceInputs.forEach((input) => {
    input.checked = false;
  });
}

function syncColorChoice() {
  const selected = document.querySelector('input[name="colorChoice"]:checked');
  if (selected) {
    fieldColor.value = selected.value;
  }
}

function syncColorChoice2() {
  const selected = document.querySelector('input[name="colorChoice2"]:checked');
  if (selected) {
    fieldColor2.value = selected.value;
  }
}

function createVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const timestamp = Date.now().toString(36);
  let randomPart = Math.random().toString(36).substring(2, 10);

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    randomPart = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).padStart(8, '0');
  }

  return `id-${timestamp}-${randomPart}`;
}

function setVisitorId() {
  visitorId = createVisitorId();
  visitorIdEl.textContent = visitorId;
  statusEl.textContent = 'Visitor ID assigned.';
}

function setAppAccess(enabled) {
  if (appContainer) {
    appContainer.inert = !enabled;
    appContainer.setAttribute('aria-hidden', String(!enabled));
  }

  document.body.classList.toggle('disclaimer-open', !enabled);

  if (disclaimerOverlay) {
    disclaimerOverlay.hidden = enabled;
  }
}

async function loadDisclaimerOverlayText() {
  if (!disclaimerTextEl) return;

  try {
    const response = await fetch('Disclaimer.txt', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Unable to load disclaimer text.');
    }

    disclaimerTextEl.textContent = await response.text();
  } catch (error) {
    disclaimerTextEl.textContent = 'Unable to load the disclaimer text. Please refresh the page and try again.';
  }
}

function syncDisclaimerChoice(selectedInput) {
  if (!disclaimerAgree || !disclaimerDecline || !disclaimerContinueBtn || !disclaimerStatusEl) return;

  if (selectedInput === disclaimerAgree && disclaimerAgree.checked) {
    disclaimerDecline.checked = false;
  }

  if (selectedInput === disclaimerDecline && disclaimerDecline.checked) {
    disclaimerAgree.checked = false;
  }

  if (disclaimerAgree.checked) {
    disclaimerContinueBtn.disabled = false;
    disclaimerStatusEl.textContent = 'Approval selected. Click continue to enter the app.';
    return;
  }

  disclaimerContinueBtn.disabled = true;
  disclaimerStatusEl.textContent = disclaimerDecline.checked
    ? 'Access remains blocked unless you approve the disclaimer.'
    : 'You must approve the disclaimer to access the app.';
}

function initializeDisclaimerGate() {
  if (!disclaimerOverlay) return;

  setAppAccess(false);
  loadDisclaimerOverlayText();
  syncDisclaimerChoice();

  if (window.twttr?.widgets?.load) {
    window.twttr.widgets.load(disclaimerOverlay);
  }

  if (disclaimerAgree) {
    disclaimerAgree.addEventListener('change', () => syncDisclaimerChoice(disclaimerAgree));
  }

  if (disclaimerDecline) {
    disclaimerDecline.addEventListener('change', () => syncDisclaimerChoice(disclaimerDecline));
  }

  if (disclaimerContinueBtn) {
    disclaimerContinueBtn.addEventListener('click', () => {
      if (!disclaimerAgree.checked) {
        disclaimerStatusEl.textContent = 'Please select Yes to continue to the web application.';
        return;
      }

      setAppAccess(true);
      statusEl.textContent = 'Disclaimer approved. You may now use the application.';
      fieldName.focus();
    });
  }
}

function clearFormFields() {
  if (!dataForm) return;
  dataForm.reset();
  fieldGpa.value = '1.0-2.09';
  fieldSatAct.value = '36 / 1570-1600';
  resetSummerActivities();
  resetCollegeRegion();
  updateCollegeRegionMap(getCollegeRegion());
  resetColorChoice();
  resetColorChoice2();
  resetMusicPreference();
  fieldColor.value = '#4a90e2';
  fieldColor2.value = '#4a90e2';
}

const weatherPreview = document.getElementById('weatherPreview');

function setBackgroundStyle(style) {
  document.body.classList.remove(
    'background-sun',
    'background-rain',
    'background-cloud',
    'background-snow',
    'background-beach',
    'background-city',
    'background-town'
  );
  document.body.classList.add(`background-${style}`);

  const options = {
    sun: { label: 'Sun', icon: '☀️' },
    rain: { label: 'Rain', icon: '🌧️' },
    cloud: { label: 'Cloudy', icon: '☁️' },
    snow: { label: 'Snow and skiing', icon: '⛷️' },
    beach: { label: 'Beach and surf', icon: '🏖️' },
    city: { label: 'Big city and buildings', icon: '🌆' },
    town: { label: 'Small town', icon: '🏡' },
  };

  const option = options[style] || options.sun;
  weatherPreview.textContent = option.icon;
  const svg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><text x="10" y="95" font-size="80">${option.icon}</text></svg>`);
  document.body.style.setProperty('--weather-icon-url', `url("data:image/svg+xml,${svg}")`);
  statusEl.textContent = `Background set to ${option.label}.`;
}

function getFavoriteWeather() {
  const style = bgSelector.value;
  const options = {
    sun: { label: 'Sun', icon: '☀️' },
    rain: { label: 'Rain', icon: '🌧️' },
    cloud: { label: 'Cloudy', icon: '☁️' },
    snow: { label: 'Snow and skiing', icon: '⛷️' },
    beach: { label: 'Beach and surf', icon: '🏖️' },
    city: { label: 'Big city and buildings', icon: '🌆' },
    town: { label: 'Small town', icon: '🏡' },
  };

  return options[style] || options.sun;
}

function renderEntries() {
  if (entries.length === 0) {
    entryList.innerHTML = '<p class="empty">No entries added yet.</p>';
    renderEntrySummary(null);
    return;
  }

  const rows = entries
    .map((entry, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(entry.visitorId)}</td>
        <td>${escapeHtml(entry.name)}</td>
        <td>${escapeHtml(entry.email)}</td>
        <td>${escapeHtml(entry.gpa)}</td>
        <td>${escapeHtml(entry.collegeRegion)}</td>
        <td>${escapeHtml(entry.summerActivity)}</td>
        <td>${escapeHtml(entry.satActRange)}</td>
        <td>${escapeHtml(entry.specialInterests)}</td>
        <td><span class="color-swatch" style="background:${escapeHtml(entry.color)}"></span>${escapeHtml(entry.color)}</td>
        <td><span class="color-swatch" style="background:${escapeHtml(entry.secondColor)}"></span>${escapeHtml(entry.secondColor)}</td>
        <td>${escapeHtml(entry.favoriteWeatherIcon)} ${escapeHtml(entry.favoriteWeather)}</td>
        <td>${escapeHtml(entry.musicPreference)}</td>
        <td>${escapeHtml(entry.clubs.join(', '))}</td>
        <td>${escapeHtml(entry.iconOrder.join(' → '))}</td>
        <td>${escapeHtml(entry.sportsOrder.join(' → '))}</td>
        <td>${escapeHtml(entry.notes)}</td>
      </tr>`)
    .join('');

  entryList.innerHTML = `
    <table>
      <thead>
        <tr><th>#</th><th>Visitor ID</th><th>Name</th><th>Email</th><th>GPA</th><th>College Region</th><th>Last Summer Activity</th><th>SAT-ACT Range</th><th>Awards/Honors/Interests/Hobbies</th><th>Favorite Color</th><th>Second Favorite Color</th><th>Favorite Weather</th><th>Music Preference</th><th>Clubs</th><th>Animal Icon Order</th><th>Sports Order</th><th>Notes</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderEntrySummary(entry) {
  if (!entry) {
    entrySummary.innerHTML = '';
    entrySummary.classList.add('hidden');
    return;
  }

  entrySummary.classList.remove('hidden');
  entrySummary.innerHTML = `
    <strong>Latest entry: ${escapeHtml(entry.name)}</strong>
    <div class="summary-row"><span class="summary-key">Visitor ID</span><span class="summary-value">${escapeHtml(entry.visitorId)}</span></div>
    <div class="summary-row"><span class="summary-key">Favorite color</span><span class="summary-value"><span class="summary-color" style="background:${escapeHtml(entry.color)}"></span>${escapeHtml(entry.color)}</span></div>
    <div class="summary-row"><span class="summary-key">Second favorite color</span><span class="summary-value"><span class="summary-color" style="background:${escapeHtml(entry.secondColor)}"></span>${escapeHtml(entry.secondColor)}</span></div>
    <div class="summary-row"><span class="summary-key">GPA</span><span class="summary-value">${escapeHtml(entry.gpa)}</span></div>
    <div class="summary-row"><span class="summary-key">College region</span><span class="summary-value">${escapeHtml(entry.collegeRegion)}</span></div>
    <div class="summary-row"><span class="summary-key">Last summer activity</span><span class="summary-value">${escapeHtml(entry.summerActivity)}</span></div>
    <div class="summary-row"><span class="summary-key">SAT-ACT range</span><span class="summary-value">${escapeHtml(entry.satActRange)}</span></div>
    <div class="summary-row"><span class="summary-key">Awards / honors / interests / hobbies</span><span class="summary-value">${escapeHtml(entry.specialInterests) || '—'}</span></div>
    <div class="summary-row"><span class="summary-key">Weather</span><span class="summary-value">${escapeHtml(entry.favoriteWeatherIcon)} ${escapeHtml(entry.favoriteWeather)}</span></div>
    <div class="summary-row"><span class="summary-key">Music</span><span class="summary-value">${escapeHtml(entry.musicPreference)}</span></div>
    <div class="summary-row"><span class="summary-key">Clubs</span><span class="summary-value">${escapeHtml(entry.clubs.join(', ') || 'None')}</span></div>
    <div class="summary-row"><span class="summary-key">Animal icon order</span><span class="summary-value">${escapeHtml(entry.iconOrder.join(' → '))}</span></div>
    <div class="summary-row"><span class="summary-key">Sports order</span><span class="summary-value">${escapeHtml(entry.sportsOrder.join(' → '))}</span></div>
    <div class="summary-row"><span class="summary-key">Notes</span><span class="summary-value">${escapeHtml(entry.notes) || '—'}</span></div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getLatestEntry() {
  return entries.length ? entries[entries.length - 1] : null;
}

function createCsvContent() {
  const header = ['Visitor ID', 'Name', 'Email', 'GPA', 'College Region', 'Last Summer Activity', 'SAT-ACT Range', 'Awards/Honors/Interests/Hobbies', 'Favorite Color', 'Second Favorite Color', 'Favorite Weather', 'Music Preference', 'Clubs', 'Animal Icon Order', 'Sports Order', 'Notes'];
  const csvRows = [header.join(',')];
  const latestEntry = getLatestEntry();

  if (!latestEntry) {
    return csvRows.join('\r\n');
  }

  const row = [latestEntry.visitorId, latestEntry.name, latestEntry.email, latestEntry.gpa, latestEntry.collegeRegion, latestEntry.summerActivity, latestEntry.satActRange, latestEntry.specialInterests, latestEntry.color, latestEntry.secondColor, `${latestEntry.favoriteWeatherIcon} ${latestEntry.favoriteWeather}`, latestEntry.musicPreference, latestEntry.clubs.join(', '), latestEntry.iconOrder.join(' → '), latestEntry.sportsOrder.join(' → '), latestEntry.notes].map((value) => {
    const escaped = String(value).replace(/"/g, '""');
    return `"${escaped}"`;
  });

  csvRows.push(row.join(','));
  return csvRows.join('\r\n');
}

function createPdfHtml() {
  const csvContent = createCsvContent();
  const escapedCsv = escapeHtml(csvContent).replace(/\r/g, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Entries PDF - ${escapeHtml(visitorId)}</title>
<style>
  body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; margin: 24px; color: #111827; }
  h1 { margin-bottom: 18px; font-size: 1.3rem; }
  pre { white-space: pre-wrap; word-break: break-word; font-size: 0.9rem; line-height: 1.4; overflow-wrap: anywhere; }
  @media print {
    body { margin: 12mm; }
    pre { white-space: pre-wrap; page-break-inside: avoid; }
    button { display: none; }
  }
</style>
</head>
<body>
  <h1>Entries CSV for ${escapeHtml(visitorId)}</h1>
  <pre>${escapedCsv}</pre>
  <script>
    window.onload = function() {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;
}

function downloadPdf() {
  if (entries.length === 0) {
    statusEl.textContent = 'Add at least one entry before downloading PDF.';
    return;
  }

  const pdfWindow = window.open('', '_blank');
  if (!pdfWindow) {
    statusEl.textContent = 'Please allow popups to download PDF.';
    return;
  }

  pdfWindow.document.write(createPdfHtml());
  pdfWindow.document.close();
  statusEl.textContent = 'PDF preview opened. Use the browser print dialog to save as PDF.';
}

function downloadCsv() {
  if (entries.length === 0) {
    statusEl.textContent = 'Add at least one entry before downloading CSV.';
    return;
  }

  const csvContent = createCsvContent();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${visitorId}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  statusEl.textContent = 'CSV file is ready to download.';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildEmailBody(recipient) {
  const csvName = emailCsvFile.files[0]?.name || 'CSV file';
  const pdfName = emailPdfFile.files[0]?.name || 'PDF file';
  return encodeURIComponent(
    `Hello,

Please attach the selected files before sending this email.

Recipient: ${recipient}
Visitor ID: ${visitorId}

CSV file: ${csvName}
PDF file: ${pdfName}

Thank you.`
  );
}

function sendFilesByEmail() {
  const email = recipientEmail.value.trim();
  if (!isValidEmail(email)) {
    statusEl.textContent = 'Please enter a valid recipient email address.';
    return;
  }

  if (!emailCsvFile.files.length || !emailPdfFile.files.length) {
    statusEl.textContent = 'Please choose both a CSV and a PDF file to send.';
    return;
  }

  const subject = encodeURIComponent(`freeCAPS export files for ${visitorId}`);
  const body = buildEmailBody(email);
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
  statusEl.textContent = 'Email client opened for your custom recipient. Attach the selected files and send.';
}

function sendFilesToServer() {
  const serverEmail = 'serverside@monpo.com';
  if (!emailCsvFile.files.length || !emailPdfFile.files.length) {
    statusEl.textContent = 'Please choose both a CSV and a PDF file to send to the server.';
    return;
  }

  const subject = encodeURIComponent(`freeCAPS export files for ${visitorId}`);
  const body = buildEmailBody(serverEmail);
  window.location.href = `mailto:${encodeURIComponent(serverEmail)}?subject=${subject}&body=${body}`;
  statusEl.textContent = 'Email client opened for server-side upload. Attach the selected files and send to serverside@monpo.com.';
}

bgSelector.addEventListener('change', (event) => {
  setBackgroundStyle(event.target.value);
});

colorChoiceInputs.forEach((input) => {
  input.addEventListener('change', syncColorChoice);
});

colorChoiceInputs2.forEach((input) => {
  input.addEventListener('change', syncColorChoice2);
});

collegeRegionAreas.forEach((area) => {
  area.addEventListener('click', () => {
    selectCollegeRegion(area.dataset.region);
  });
  area.addEventListener('mouseover', () => {
    area.classList.add('hovered');
  });
  area.addEventListener('mouseout', () => {
    area.classList.remove('hovered');
  });
});

collegeRegionRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    if (radio.checked) {
      updateCollegeRegionMap(radio.value);
    }
  });
});

dataForm.addEventListener('submit', (event) => {
  event.preventDefault();

  syncColorChoice();
  syncColorChoice2();
  const favoriteWeather = getFavoriteWeather();
  const newEntry = {
    name: fieldName.value.trim(),
    email: fieldEmail.value.trim(),
    gpa: fieldGpa.value,
    satActRange: fieldSatAct.value,
    summerActivity: getSummerActivities(),
    collegeRegion: getCollegeRegion(),
    specialInterests: fieldSpecialInterests.value.trim(),
    color: fieldColor.value,
    secondColor: fieldColor2.value,
    visitorId,
    favoriteWeather: favoriteWeather.label,
    favoriteWeatherIcon: favoriteWeather.icon,
    musicPreference: getMusicPreference(),
    clubs: getClubPreferences(),
    iconOrder: getIconOrder(),
    sportsOrder: getSportsOrder(),
    notes: fieldNotes.value.trim(),
  };

  if (fieldColor.value === fieldColor2.value) {
    statusEl.textContent = 'Please choose two different favorite colors.';
    return;
  }

  entries.push(newEntry);
  sessionStorage.setItem('freecapsEntries', JSON.stringify(entries));
  sessionStorage.setItem('freecapsVisitorId', visitorId);
  localStorage.setItem('freecapsEntries', JSON.stringify(entries));
  localStorage.setItem('freecapsVisitorId', visitorId);
  fieldName.value = '';
  fieldEmail.value = '';
  fieldGpa.value = '1.0-2.09';
  fieldSatAct.value = '36 / 1570-1600';
  resetSummerActivities();
  resetCollegeRegion();
  fieldSpecialInterests.value = '';
  resetColorChoice();
  resetColorChoice2();
  resetClubChoices();
  resetMusicPreference();
  fieldNotes.value = '';
  fieldName.focus();

  renderEntries();
  renderEntrySummary(newEntry);
  statusEl.textContent = `Added entry for ${newEntry.name}. Redirecting to match page...`;
  window.location.href = 'match.html';
});

function clearPersistedEntries() {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
}

renderIconOrder();
renderSportsOrder();
clearFormFields();
resetCollegeRegion();
updateCollegeRegionMap(getCollegeRegion());
setBackgroundStyle(bgSelector.value);
initializeDisclaimerGate();

renderEntries();
clearPersistedEntries();

downloadCsvBtn.addEventListener('click', downloadCsv);
downloadPdfBtn.addEventListener('click', downloadPdf);
if (sendServerBtn) {
  sendServerBtn.addEventListener('click', sendFilesToServer);
}
if (sendFilesBtn) {
  sendFilesBtn.addEventListener('click', sendFilesByEmail);
}

renderEntries();
setVisitorId();
