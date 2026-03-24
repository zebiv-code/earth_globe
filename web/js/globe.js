// --- State ---
const G = {
  rotX: 0, rotY: 0, tgtRotX: 0, tgtRotY: 0,
  zoom: 1, tgtZoom: 1,
  dragging: false, lastMX: 0, lastMY: 0, dragSX: 0, dragSY: 0,
  showLabels: true, showCustom: true, maxCities: 100,
  month: new Date().getMonth(), utcHour: new Date().getUTCHours(), manualTime: false,
  customCities: JSON.parse(localStorage.getItem('customCities') || '[]'),
  cityPositions: []
};

// --- GL Init ---
const canvas = document.getElementById('gl');
const overlay = document.getElementById('overlay');
const gl = canvas.getContext('webgl');
const ctx2d = overlay.getContext('2d');

function resize() {
  canvas.width = overlay.width = window.innerWidth;
  canvas.height = overlay.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

function compileShader(src, type) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

const prog = gl.createProgram();
gl.attachShader(prog, compileShader(VS, gl.VERTEX_SHADER));
gl.attachShader(prog, compileShader(FS, gl.FRAGMENT_SHADER));
gl.linkProgram(prog);
gl.useProgram(prog);

const loc = {
  pos: gl.getAttribLocation(prog, 'a_position'),
  tex: gl.getAttribLocation(prog, 'a_texCoord'),
  matrix: gl.getUniformLocation(prog, 'u_matrix'),
  dayTex: gl.getUniformLocation(prog, 'u_dayTexture'),
  nightTex: gl.getUniformLocation(prog, 'u_nightTexture'),
  sunDir: gl.getUniformLocation(prog, 'u_sunDirection')
};

gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);

// --- Sphere ---
const LAT_BANDS = 120, LNG_BANDS = 120;
const positions = [], texCoords = [], indices = [];
for (let lat = 0; lat <= LAT_BANDS; lat++) {
  const v = lat / LAT_BANDS, latA = (v - 0.5) * Math.PI;
  const y = Math.sin(latA), xz = Math.cos(latA);
  for (let lng = 0; lng <= LNG_BANDS; lng++) {
    const u = lng / LNG_BANDS, lngA = u * 2 * Math.PI;
    positions.push(-xz * Math.cos(lngA), y, xz * Math.sin(lngA));
    texCoords.push(u, 1 - v);
  }
}
for (let lat = 0; lat < LAT_BANDS; lat++) {
  for (let lng = 0; lng < LNG_BANDS; lng++) {
    const f = lat * (LNG_BANDS + 1) + lng, s = f + LNG_BANDS + 1;
    indices.push(f, f + 1, s, s, f + 1, s + 1);
  }
}
const posBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
const texBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
const idxBuf = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
const idxCount = indices.length;

// --- Textures ---
function loadTex(url, fallback) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,100,200,255]));
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };
  img.onerror = () => { img.src = fallback; };
  img.src = url;
  return tex;
}
const dayTex = loadTex(
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/2048px-Blue_Marble_2002.png',
  'https://upload.wikimedia.org/wikipedia/commons/2/23/Blue_Marble_2002.png'
);
const nightTex = loadTex(
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/The_earth_at_night.jpg/2048px-The_earth_at_night.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/b/ba/The_earth_at_night.jpg'
);
