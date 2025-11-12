const form = document.getElementById('searchForm');
const status = document.getElementById('status');
const resultsEl = document.getElementById('results');
const mapContainer = document.getElementById('mapContainer');
const mapEl = document.getElementById('map');

let map = null;
let markers = [];
let workMarkers = [];
let googleMapsLoaded = false;

// Detect if running locally or on Vercel
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : '';

// Load Google Maps API dynamically
(async () => {
  try {
    const configResp = await fetch(`${API_BASE}/api/config`);
    const config = await configResp.json();
    
    if (config.googleMapsApiKey) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  } catch (e) {
    console.warn('Could not load Google Maps config', e);
  }
})();

window.initGoogleMaps = () => {
  googleMapsLoaded = true;
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.innerText = 'Søker... dette kan ta litt tid (Playwright crawler)';
  resultsEl.innerHTML = '';
  mapContainer.style.display = 'none';

  const finnUrl = document.getElementById('finnUrl').value;
  const workA = document.getElementById('workA').value;
  const workB = document.getElementById('workB').value;
  const travelMode = document.getElementById('travelMode').value;
  const maxMinutes = parseInt(document.getElementById('maxMinutes').value || '60');

  const resp = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ finnUrl, workA, workB, travelMode, maxMinutes })
  });

  if (!resp.ok) {
    status.innerText = 'Feil: ' + (await resp.text());
    return;
  }

  const data = await resp.json();
  const passed = data.results.filter(r => r.passes);
  const failed = data.results.length - passed.length;
  
  status.innerText = `Ferdig — fant ${passed.length} leiligheter som møter kravet (${failed} filtrert bort)`;

  // Initialize map if we have coordinates and Google Maps is loaded
  const withCoords = passed.filter(r => r.listing.coordinates);
  if (withCoords.length > 0 && googleMapsLoaded && typeof google !== 'undefined') {
    initMap(withCoords, workA, workB);
  } else if (withCoords.length > 0 && !googleMapsLoaded) {
    status.innerText += ' (Kart ikke tilgjengelig - Google Maps API-nøkkel mangler)';
  }

  for (const r of passed) {
    const div = document.createElement('div');
    div.className = 'listing pass';
    div.dataset.index = passed.indexOf(r);

    const title = document.createElement('h3');
    title.innerHTML = `<a href="${r.listing.url}" target="_blank">${r.listing.title || r.listing.url}</a>`;
    div.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `Pris: ${r.listing.price || 'N/A'} — Adresse: ${r.listing.address || 'N/A'}`;
    div.appendChild(meta);

    const times = document.createElement('div');
    times.className = 'times';
    const aColor = colorForMinutes(r.travel.workA.duration_minutes);
    const bColor = colorForMinutes(r.travel.workB.duration_minutes);
    times.innerHTML = `Arbeid A: <span style="color:${aColor}">${r.travel.workA.duration_minutes} min</span> — Arbeid B: <span style="color:${bColor}">${r.travel.workB.duration_minutes} min</span>`;
    div.appendChild(times);

    // Add click handler to highlight on map
    if (r.listing.coordinates) {
      div.style.cursor = 'pointer';
      div.addEventListener('click', () => {
        highlightMarker(passed.indexOf(r));
        // Remove highlight from other listings
        document.querySelectorAll('.listing').forEach(l => l.classList.remove('highlight'));
        div.classList.add('highlight');
      });
    }

    resultsEl.appendChild(div);
  }
});

function initMap(listings, workA, workB) {
  mapContainer.style.display = 'block';
  
  // Clear existing markers
  markers.forEach(m => m.setMap(null));
  workMarkers.forEach(m => m.setMap(null));
  markers = [];
  workMarkers = [];

  // Center on Trondheim by default
  const center = { lat: 63.4305, lng: 10.3951 };
  
  if (!map) {
    map = new google.maps.Map(mapEl, {
      zoom: 13,
      center: center,
      mapTypeControl: true,
      streetViewControl: false
    });
  }

  const bounds = new google.maps.LatLngBounds();

  // Add markers for each listing
  listings.forEach((r, idx) => {
    if (!r.listing.coordinates) return;
    
    const pos = { lat: r.listing.coordinates.lat, lng: r.listing.coordinates.lng };
    const marker = new google.maps.Marker({
      position: pos,
      map: map,
      title: r.listing.title,
      label: String(idx + 1),
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#4CAF50',
        fillOpacity: 0.8,
        strokeColor: '#fff',
        strokeWeight: 2,
        scale: 10
      }
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="max-width:200px">
        <strong>${r.listing.title}</strong><br>
        ${r.listing.price}<br>
        <span style="color:${colorForMinutes(r.travel.workA.duration_minutes)}">${r.travel.workA.duration_minutes} min til A</span> | 
        <span style="color:${colorForMinutes(r.travel.workB.duration_minutes)}">${r.travel.workB.duration_minutes} min til B</span><br>
        <a href="${r.listing.url}" target="_blank">Se annonse</a>
      </div>`
    });

    marker.addListener('click', () => {
      markers.forEach(m => m.infoWindow && m.infoWindow.close());
      infoWindow.open(map, marker);
      // Highlight corresponding listing
      document.querySelectorAll('.listing').forEach(l => l.classList.remove('highlight'));
      const listingEl = document.querySelector(`.listing[data-index="${idx}"]`);
      if (listingEl) {
        listingEl.classList.add('highlight');
        listingEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    marker.infoWindow = infoWindow;
    markers.push(marker);
    bounds.extend(pos);
  });

  // Fit map to show all markers
  if (markers.length > 0) {
    map.fitBounds(bounds);
  }
}

function highlightMarker(index) {
  if (markers[index] && markers[index].infoWindow) {
    markers.forEach(m => m.infoWindow && m.infoWindow.close());
    markers[index].infoWindow.open(map, markers[index]);
    map.panTo(markers[index].getPosition());
  }
}

function colorForMinutes(m) {
  if (m <= 20) return 'green';
  if (m <= 40) return 'orange';
  return 'red';
}
