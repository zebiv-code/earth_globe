// --- Input ---
canvas.addEventListener('mousedown', e => {
  G.dragging=true; G.lastMX=e.clientX; G.lastMY=e.clientY; G.dragSX=e.clientX; G.dragSY=e.clientY;
});
window.addEventListener('mousemove', e => {
  if (!G.dragging) return;
  G.tgtRotY += (e.clientX-G.lastMX)*0.005;
  G.tgtRotX += (e.clientY-G.lastMY)*0.005;
  G.tgtRotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, G.tgtRotX));
  G.lastMX=e.clientX; G.lastMY=e.clientY;
});
window.addEventListener('mouseup', () => { G.dragging=false; });

canvas.addEventListener('click', e => {
  if (Math.hypot(e.clientX-G.dragSX, e.clientY-G.dragSY) > 5) return;
  const rect=canvas.getBoundingClientRect(), mx=e.clientX-rect.left, my=e.clientY-rect.top;
  let best=null, bestD=10;
  for (const p of G.cityPositions) {
    const d=Math.hypot(mx-p.x, my-p.y);
    if (d<bestD) { bestD=d; best=p.city; }
  }
  if (best) showCityInfo(best);
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  G.tgtZoom = Math.max(0.5, Math.min(3, G.tgtZoom - e.deltaY*0.001));
}, {passive:false});

canvas.addEventListener('touchstart', e => {
  if (e.touches.length===1) { G.dragging=true; G.lastMX=e.touches[0].clientX; G.lastMY=e.touches[0].clientY; }
});
canvas.addEventListener('touchmove', e => {
  if (e.touches.length===1 && G.dragging) {
    G.tgtRotY += (e.touches[0].clientX-G.lastMX)*0.005;
    G.tgtRotX += (e.touches[0].clientY-G.lastMY)*0.005;
    G.tgtRotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, G.tgtRotX));
    G.lastMX=e.touches[0].clientX; G.lastMY=e.touches[0].clientY;
  }
});
canvas.addEventListener('touchend', () => { G.dragging=false; });

// --- UI ---
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const monthEl = document.getElementById('month');
monthNames.forEach((m,i) => { const o=document.createElement('option'); o.value=i; o.textContent=m; monthEl.appendChild(o); });
monthEl.value = G.month;
monthEl.onchange = () => { G.month = +monthEl.value; };

const hourEl = document.getElementById('hour');
const tzOff = new Date().getTimezoneOffset() / -60;
for (let h=0;h<24;h++) {
  let lh=h+tzOff; if(lh<0)lh+=24; if(lh>=24)lh-=24;
  const o=document.createElement('option'); o.value=h;
  o.textContent=String(lh).padStart(2,'0')+':00 ('+String(h).padStart(2,'0')+':00 UTC)';
  hourEl.appendChild(o);
}
hourEl.value = G.utcHour;
hourEl.onchange = () => { G.utcHour=+hourEl.value; G.manualTime=true; timeToggle.classList.remove('active'); };

const timeToggle = document.getElementById('timeToggle');
timeToggle.onclick = () => {
  G.manualTime = !G.manualTime;
  timeToggle.classList.toggle('active', !G.manualTime);
  if (!G.manualTime) { G.utcHour=new Date().getUTCHours(); hourEl.value=G.utcHour; }
};

const cityCountEl = document.getElementById('cityCount');
const cityCountLabel = document.getElementById('cityCountLabel');
cityCountEl.oninput = () => { G.maxCities=+cityCountEl.value; cityCountLabel.textContent=G.maxCities; };

document.getElementById('showLabels').onchange = e => { G.showLabels=e.target.checked; };
document.getElementById('showCustom').onchange = e => { G.showCustom=e.target.checked; };
document.getElementById('resetBtn').onclick = () => {
  focusOn(40,-100,1.2);
  G.manualTime=false; G.month=new Date().getMonth(); G.utcHour=new Date().getUTCHours();
  monthEl.value=G.month; hourEl.value=G.utcHour; timeToggle.classList.add('active');
};

// --- Search ---
const searchInput = document.getElementById('search');
const searchResults = document.getElementById('searchResults');
document.getElementById('searchBtn').onclick = doSearch;
searchInput.onkeydown = e => { if (e.key==='Enter') doSearch(); };

async function doSearch() {
  const q = searchInput.value.trim();
  if (!q) return;
  const res = await fetch('https://nominatim.openstreetmap.org/search?q='+encodeURIComponent(q)+'&format=json&limit=10');
  const data = await res.json();
  searchResults.innerHTML = '';
  data.forEach(r => {
    const btn = document.createElement('button');
    btn.textContent = r.display_name;
    btn.onclick = () => {
      const city = { name: r.display_name.split(',')[0], country: r.display_name.split(',').slice(-1)[0].trim(), lat: +r.lat, lng: +r.lon };
      G.customCities.push(city);
      localStorage.setItem('customCities', JSON.stringify(G.customCities));
      focusOn(city.lat, city.lng, 2);
      searchResults.style.display='none';
      searchInput.value='';
    };
    searchResults.appendChild(btn);
  });
  searchResults.style.display = data.length ? 'block' : 'none';
}
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) searchResults.style.display='none';
});

// --- City Info ---
function showCityInfo(city) {
  document.getElementById('ciName').textContent = city.name;
  document.getElementById('ciCountry').textContent = 'Country: ' + city.country;
  const lat = Math.abs(city.lat).toFixed(2)+'°'+(city.lat>=0?'N':'S');
  const lng = Math.abs(city.lng).toFixed(2)+'°'+(city.lng>=0?'E':'W');
  document.getElementById('ciLocation').textContent = 'Location: '+lat+', '+lng;
  document.getElementById('ciPop').textContent = city.pop ? 'Population: '+city.pop.toLocaleString() : '';
  document.getElementById('cityInfo').style.display = 'block';
}
document.getElementById('cityClose').onclick = () => { document.getElementById('cityInfo').style.display='none'; };
