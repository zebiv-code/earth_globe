// --- Math ---
function normalize(v) { const l = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]); return [v[0]/l,v[1]/l,v[2]/l]; }
function cross(a,b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
function sub(a,b) { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }

function lookAt(eye, tgt, up) {
  const z = normalize(sub(eye,tgt)), x = normalize(cross(up,z)), y = normalize(cross(z,x));
  const m = new Float32Array(16);
  m[0]=x[0]; m[4]=x[1]; m[8]=x[2];
  m[1]=y[0]; m[5]=y[1]; m[9]=y[2];
  m[2]=z[0]; m[6]=z[1]; m[10]=z[2];
  m[12]=-(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]);
  m[13]=-(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]);
  m[14]=-(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]);
  m[3]=0; m[7]=0; m[11]=0; m[15]=1;
  return m;
}

function mulMat(a,b) {
  const r = new Float32Array(16);
  for (let i=0;i<4;i++) for (let j=0;j<4;j++) {
    let s=0; for (let k=0;k<4;k++) s += a[k*4+j]*b[i*4+k]; r[i*4+j]=s;
  }
  return r;
}

function mvp() {
  const fov=60*Math.PI/180, asp=canvas.width/canvas.height, near=0.1, far=100;
  const f=Math.tan(Math.PI*0.5-0.5*fov), ri=1/(near-far);
  const p=new Float32Array(16);
  p[0]=f/asp; p[5]=f; p[10]=(near+far)*ri; p[11]=-1; p[14]=near*far*ri*2;
  const d=3/G.zoom;
  const eye=[
    -d*Math.sin(G.rotY)*Math.cos(G.rotX),
    d*Math.sin(G.rotX),
    d*Math.cos(G.rotY)*Math.cos(G.rotX)
  ];
  return { mat: mulMat(p, lookAt(eye,[0,0,0],[0,1,0])), eye };
}

function transformPt(pos, mat) {
  const r=[0,0,0,0];
  for (let i=0;i<4;i++) r[i]=mat[i]*pos[0]+mat[4+i]*pos[1]+mat[8+i]*pos[2]+mat[12+i];
  return r;
}

function latLngToXYZ(lat, lng) {
  const lr=lat*Math.PI/180, lgr=(lng+180)*Math.PI/180;
  const y=Math.sin(lr), xz=Math.cos(lr);
  return [-xz*Math.cos(lgr), y, xz*Math.sin(lgr)];
}

function sunDeclination(month) {
  const tilt=23.5*Math.PI/180;
  const days=[-80,-50,-20,10,40,70,100,130,160,190,220,250];
  return tilt*Math.sin((days[month]/365)*2*Math.PI);
}

function focusOn(lat, lng, z) {
  G.tgtRotX = lat*Math.PI/180;
  G.tgtRotY = -lng*Math.PI/180 - Math.PI/2;
  G.tgtZoom = z || 1.5;
}
