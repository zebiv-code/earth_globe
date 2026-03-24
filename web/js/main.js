// --- Render Loop ---
setTimeout(() => focusOn(40, -100, 1.2), 500);

setInterval(() => { if (!G.manualTime) { G.utcHour=new Date().getUTCHours(); hourEl.value=G.utcHour; } }, 60000);

function frame() {
  G.rotX += (G.tgtRotX-G.rotX)*0.1;
  G.rotY += (G.tgtRotY-G.rotY)*0.1;
  G.zoom += (G.tgtZoom-G.zoom)*0.1;

  gl.clearColor(0,0,0,1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(prog);

  const {mat, eye} = mvp();
  gl.uniformMatrix4fv(loc.matrix, false, mat);

  let sunAngle = G.manualTime ? ((G.utcHour-12)*15)*Math.PI/180 : Date.now()*0.0001;
  const decl = sunDeclination(G.month);
  gl.uniform3fv(loc.sunDir, [Math.cos(sunAngle)*Math.cos(decl), Math.sin(decl), Math.sin(sunAngle)*Math.cos(decl)]);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, dayTex);
  gl.uniform1i(loc.dayTex, 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, nightTex);
  gl.uniform1i(loc.nightTex, 1);

  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.enableVertexAttribArray(loc.pos);
  gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
  gl.enableVertexAttribArray(loc.tex);
  gl.vertexAttribPointer(loc.tex, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.drawElements(gl.TRIANGLES, idxCount, gl.UNSIGNED_SHORT, 0);

  // Cities
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  G.cityPositions = [];
  const visible = G.showCustom ? [...CITIES.slice(0, G.maxCities), ...G.customCities] : CITIES.slice(0, G.maxCities);

  for (const city of visible) {
    const pos = latLngToXYZ(city.lat, city.lng);
    if (pos[0]*eye[0]+pos[1]*eye[1]+pos[2]*eye[2] < 0) continue;
    const t = transformPt(pos, mat);
    if (t[3] <= 0) continue;
    const sx = (t[0]/t[3]+1)*canvas.width/2;
    const sy = (1-t[1]/t[3])*canvas.height/2;
    if (sx<-50||sx>canvas.width+50||sy<-50||sy>canvas.height+50) continue;

    const isCustom = G.customCities.includes(city);
    ctx2d.fillStyle = isCustom ? '#00ff00' : '#ff0000';
    ctx2d.beginPath();
    ctx2d.arc(sx, sy, isCustom?4:3, 0, Math.PI*2);
    ctx2d.fill();
    if (isCustom) { ctx2d.strokeStyle='#00ff00'; ctx2d.lineWidth=1; ctx2d.beginPath(); ctx2d.arc(sx,sy,6,0,Math.PI*2); ctx2d.stroke(); }
    if (G.showLabels) { ctx2d.fillStyle='#fff'; ctx2d.font='12px Arial'; ctx2d.textAlign='center'; ctx2d.textBaseline='bottom'; ctx2d.fillText(city.name, sx, sy-5); }
    G.cityPositions.push({city, x:sx, y:sy});
  }

  requestAnimationFrame(frame);
}
frame();
