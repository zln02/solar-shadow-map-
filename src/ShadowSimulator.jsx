import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import * as ChartJS from "chart.js";

ChartJS.Chart.register(...ChartJS.registerables);

// ─── Sun Position Algorithm (실제 천문 계산식) ────────────────────────────────
const SEASON_DOY = { 1: 15, 3: 75, 6: 166, 9: 258, 12: 349 };

function getSun(h, lat, doy) {
  const lr = lat * Math.PI / 180;
  const dec = 23.45 * Math.sin((284 + doy) / 365 * 2 * Math.PI) * Math.PI / 180;
  const ha = (h - 12) * 15 * Math.PI / 180;
  const sinE = Math.sin(lr) * Math.sin(dec) + Math.cos(lr) * Math.cos(dec) * Math.cos(ha);
  const elev = Math.asin(Math.max(-0.1, sinE)) * 180 / Math.PI;
  if (elev < 1.5) return null;
  const cA = (Math.sin(dec) - Math.sin(lr) * Math.sin(elev * Math.PI / 180)) /
             (Math.cos(lr) * Math.cos(elev * Math.PI / 180));
  let az = Math.acos(Math.max(-1, Math.min(1, cA))) * 180 / Math.PI;
  if (h > 12) az = 360 - az;
  return { elev, az };
}

// ─── Geometry Algorithms ───────────────────────────────────────────────────────
function convexHull(pts) {
  pts = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length-1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length-2], up[up.length-1], p) <= 0) up.pop(); up.push(p); }
  return [...lo.slice(0,-1), ...up.slice(0,-1)];
}

function pip(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length-1; i < poly.length; j = i++) {
    const [xi,yi] = poly[i], [xj,yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj-xi)*(pt[1]-yi)/(yj-yi)+xi) inside = !inside;
  }
  return inside;
}

function corners(b) { return [[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]]; }

function shadowVec(sun, ht) {
  if (!sun) return null;
  const eR = Math.max(3, sun.elev) * Math.PI / 180;
  const len = Math.min(580, ht / Math.tan(eR) * 3.5);
  const azR = (sun.az + 180) % 360 * Math.PI / 180;
  return [Math.sin(azR) * len, -Math.cos(azR) * len];
}

function calcLitPct(lot, blds, sun, N = 20) {
  if (!sun) return 0;
  const polys = blds.map(b => {
    const v = shadowVec(sun, b.height); if (!v) return null;
    const cs = corners(b), sh = cs.map(([x,y]) => [x+v[0], y+v[1]]);
    return convexHull([...cs, ...sh]);
  }).filter(Boolean);
  let lit = 0, tot = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const px = lot.x + (i+.5)*lot.w/N, py = lot.y + (j+.5)*lot.h/N; tot++;
    if (!polys.some(p => pip([px,py], p))) lit++;
  }
  return Math.round(lit / tot * 100);
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const LOT = { x: 195, y: 160, w: 180, h: 150 };

const INIT_BLDS = [
  { id:1, x:130, y:25,  w:310, h:95,  height:30, label:'아파트' },
  { id:2, x:415, y:105, w:95,  h:220, height:22, label:'오피스' },
  { id:3, x:390, y:345, w:120, h:55,  height:9,  label:'상가'   },
  { id:4, x:68,  y:340, w:255, h:68,  height:14, label:'상가'   },
  { id:5, x:40,  y:95,  w:105, h:235, height:24, label:'주거'   },
];

const CITIES = [
  { name:'서울', lat:37.5, lng:127.0 },
  { name:'부산', lat:35.1, lng:129.0 },
  { name:'제주', lat:33.4, lng:126.5 },
  { name:'도쿄', lat:35.7, lng:139.7 },
  { name:'뉴욕', lat:40.7, lng:-74.0 },
];

// ─── 2D Canvas Renderer ────────────────────────────────────────────────────────
function draw2D(ctx, W, H, blds, lot, sun, selId) {
  const dk = window.matchMedia('(prefers-color-scheme:dark)').matches;
  const bg   = dk ? '#1a1a18' : '#c8c4b8';
  const lotC = dk ? '#1a2a1a' : '#d0e8d0';
  const lotB = dk ? '#449944' : '#3a8a3a';
  const bldC = dk ? '#3c3c3a' : '#b0ac9e';
  const bldT = dk ? '#505050' : '#c0bcb0';
  const bldB = dk ? '#686866' : '#8a8880';
  const txtC = dk ? '#b8b6b0' : '#3c3c38';
  const grdC = dk ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = grdC; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // Lot base
  ctx.fillStyle = lotC; ctx.fillRect(lot.x, lot.y, lot.w, lot.h);

  // Shadows
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  for (const b of blds) {
    const v = shadowVec(sun, b.height); if (!v) continue;
    const cs = corners(b), sh = cs.map(([x,y]) => [x+v[0], y+v[1]]);
    const h2 = convexHull([...cs, ...sh]);
    ctx.beginPath(); ctx.moveTo(h2[0][0], h2[0][1]);
    for (let i = 1; i < h2.length; i++) ctx.lineTo(h2[i][0], h2[i][1]);
    ctx.closePath(); ctx.fill();
  }

  // Lot border
  ctx.strokeStyle = lotB; ctx.lineWidth = 1.5; ctx.setLineDash([6,4]);
  ctx.strokeRect(lot.x, lot.y, lot.w, lot.h); ctx.setLineDash([]);
  ctx.fillStyle = lotB; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('공터', lot.x + lot.w/2, lot.y + 18);

  // Buildings
  for (const b of blds) {
    const isSel = b.id === selId;
    ctx.fillStyle = bldC; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = bldT; ctx.fillRect(b.x, b.y, b.w, 6);
    ctx.strokeStyle = isSel ? '#378ADD' : bldB;
    ctx.lineWidth = isSel ? 2 : 0.5;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = txtC; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(b.label, b.x + b.w/2, b.y + b.h/2);
    ctx.fillStyle = dk ? '#787670' : '#686660'; ctx.font = '9px sans-serif';
    ctx.fillText(b.height + 'm', b.x + b.w/2, b.y + b.h/2 + 13);
  }

  // Compass (top-right)
  const [cx_, cy_, r_] = [572, 28, 18];
  ctx.fillStyle = dk ? 'rgba(26,26,24,0.88)' : 'rgba(248,246,240,0.88)';
  ctx.beginPath(); ctx.arc(cx_, cy_, r_+7, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = dk ? '#484845' : '#c0bcb0'; ctx.lineWidth = 0.5; ctx.stroke();
  const dirs = [['N',[0,-1],'#e24b4a'],['E',[1,0],dk?'#787670':'#686660'],['S',[0,1],dk?'#787670':'#686660'],['W',[-1,0],dk?'#787670':'#686660']];
  ctx.font = '9px sans-serif';
  for (const [lbl,[dx,dy],col] of dirs) {
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(lbl, cx_+dx*(r_+1), cy_+dy*(r_+1));
  }
  ctx.textBaseline = 'alphabetic';
}

// ─── 2D View Component ─────────────────────────────────────────────────────────
function View2D({ blds, setBlds, lot, sun, sel, setSel, addMode, setAddMode }) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    draw2D(cv.getContext('2d'), 600, 480, blds, lot, sun, sel);
  }, [blds, lot, sun, sel]);

  const getPos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [(e.clientX - r.left) * (600 / r.width), (e.clientY - r.top) * (480 / r.height)];
  };

  const onDown = (e) => {
    const [mx, my] = getPos(e);
    if (addMode) {
      setBlds(p => [...p, { id: Date.now(), x: mx-55, y: my-38, w: 110, h: 75, height: 18, label: '신규' }]);
      setAddMode(false); return;
    }
    for (let i = blds.length-1; i >= 0; i--) {
      const b = blds[i];
      if (mx >= b.x && mx <= b.x+b.w && my >= b.y && my <= b.y+b.h) {
        setSel(b.id); dragRef.current = { id: b.id, ox: mx-b.x, oy: my-b.y }; return;
      }
    }
    setSel(null);
  };
  const onMove = (e) => {
    if (!dragRef.current) return;
    const [mx, my] = getPos(e);
    const { id, ox, oy } = dragRef.current;
    setBlds(p => p.map(b => b.id === id ? { ...b, x: Math.max(0, mx-ox), y: Math.max(0, my-oy) } : b));
  };
  const onUp = () => { dragRef.current = null; };

  const selB = blds.find(b => b.id === sel);

  return (
    <div>
      <canvas ref={canvasRef} width={600} height={480}
        style={{ width:'100%', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, display:'block', cursor: addMode ? 'crosshair' : 'grab' }}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} />
      <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap', alignItems:'center' }}>
        <button onClick={() => setAddMode(a => !a)} style={{
          padding:'4px 12px', borderRadius:8, fontSize:12, cursor:'pointer', border:'0.5px solid',
          borderColor: addMode ? 'var(--color-border-info)' : 'var(--color-border-secondary)',
          background: addMode ? 'var(--color-background-info)' : 'var(--color-background-secondary)',
          color: addMode ? 'var(--color-text-info)' : 'var(--color-text-primary)'
        }}>+ 건물 추가 {addMode ? '(클릭하세요)' : ''}</button>
        {selB && (<>
          <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>높이</span>
          <input type="range" min={5} max={60} value={selB.height}
            onChange={e => setBlds(p => p.map(b => b.id === sel ? { ...b, height: +e.target.value } : b))}
            style={{ width:90 }} />
          <span style={{ fontSize:12, fontWeight:500 }}>{selB.height}m</span>
          <span style={{ fontSize:12, color:'var(--color-text-secondary)', marginLeft:4 }}>이름</span>
          <input value={selB.label} onChange={e => setBlds(p => p.map(b => b.id === sel ? { ...b, label: e.target.value } : b))}
            style={{ width:60, padding:'2px 6px', borderRadius:6, fontSize:12, border:'0.5px solid var(--color-border-secondary)',
              background:'var(--color-background-secondary)', color:'var(--color-text-primary)' }} />
          <button onClick={() => { setBlds(p => p.filter(b => b.id !== sel)); setSel(null); }} style={{
            padding:'4px 10px', borderRadius:8, fontSize:12, cursor:'pointer',
            border:'0.5px solid var(--color-border-danger)', color:'var(--color-text-danger)',
            background:'var(--color-background-danger)'
          }}>삭제</button>
        </>)}
        <button onClick={() => setBlds(INIT_BLDS)} style={{
          marginLeft:'auto', padding:'4px 10px', borderRadius:8, fontSize:12, cursor:'pointer',
          border:'0.5px solid var(--color-border-secondary)', background:'var(--color-background-secondary)',
          color:'var(--color-text-secondary)'
        }}>초기화</button>
      </div>
    </div>
  );
}

// ─── 3D View Component (Three.js) ─────────────────────────────────────────────
function View3D({ blds, lot, sun }) {
  const mountRef = useRef(null);
  const sceneRefs = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth || 600, H = 420;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x18181a);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x18181a, 500, 950);

    const camera = new THREE.PerspectiveCamera(48, W / H, 1, 1500);
    camera.position.set(0, 280, 360);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.22);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfff3d0, 1.6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    const sc = dirLight.shadow.camera;
    [sc.left, sc.bottom] = [-320, -320];
    [sc.right, sc.top] = [320, 320];
    [sc.near, sc.far] = [30, 900];
    scene.add(dirLight);
    scene.add(dirLight.target);
    dirLight.target.position.set(0, 0, 0);
    dirLight.target.updateMatrixWorld();

    // Ground
    const gnd = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 750),
      new THREE.MeshLambertMaterial({ color: 0x38342e })
    );
    gnd.rotation.x = -Math.PI / 2;
    gnd.receiveShadow = true;
    scene.add(gnd);

    // Grid
    const grid = new THREE.GridHelper(700, 35, 0x4a4845, 0x3a3835);
    grid.position.y = 0.4;
    scene.add(grid);

    // Lot surface
    const lotX = lot.x + lot.w/2 - 300, lotZ = lot.y + lot.h/2 - 240;
    const lotMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(lot.w, lot.h),
      new THREE.MeshLambertMaterial({ color: 0x1e3c1e })
    );
    lotMesh.rotation.x = -Math.PI / 2;
    lotMesh.position.set(lotX, 0.6, lotZ);
    lotMesh.receiveShadow = true;
    scene.add(lotMesh);

    // Lot border
    const lotEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(lot.w, 1, lot.h)),
      new THREE.LineBasicMaterial({ color: 0x44aa44 })
    );
    lotEdge.position.set(lotX, 1, lotZ);
    scene.add(lotEdge);

    // Buildings
    const bldColors = [0x3c3c3a, 0x484845, 0x404042, 0x444040, 0x3e3c38];
    const topColors = [0x585855, 0x606060, 0x585858, 0x5a5855, 0x565452];
    blds.forEach((b, i) => {
      const cx_ = b.x + b.w/2 - 300, cz_ = b.y + b.h/2 - 240;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, b.height, b.h),
        new THREE.MeshLambertMaterial({ color: bldColors[i % 5] })
      );
      body.position.set(cx_, b.height/2, cz_);
      body.castShadow = true; body.receiveShadow = true;
      scene.add(body);
      // Top face
      const top = new THREE.Mesh(
        new THREE.PlaneGeometry(b.w-2, b.h-2),
        new THREE.MeshLambertMaterial({ color: topColors[i % 5] })
      );
      top.rotation.x = -Math.PI/2;
      top.position.set(cx_, b.height + 0.1, cz_);
      top.receiveShadow = true; scene.add(top);
      // Edges
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(b.w, b.height, b.h)),
        new THREE.LineBasicMaterial({ color: 0x606060, transparent: true, opacity: 0.4 })
      );
      edges.position.set(cx_, b.height/2, cz_);
      scene.add(edges);
    });

    sceneRefs.current = { renderer, scene, camera, dirLight };

    // Orbit controls (manual)
    let isDragging = false, prevX = 0, prevY = 0;
    let theta = 0.5, phi = 1.05, radius = 390;

    const updateCamera = () => {
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(0, 0, 0);
    };

    const onDown = (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; };
    const onMove = (e) => {
      if (!isDragging) return;
      theta -= (e.clientX - prevX) * 0.007; prevX = e.clientX;
      phi = Math.max(0.22, Math.min(1.45, phi - (e.clientY - prevY) * 0.007)); prevY = e.clientY;
      updateCamera();
    };
    const onUp = () => { isDragging = false; };
    const onWheel = (e) => {
      radius = Math.max(140, Math.min(650, radius + e.deltaY * 0.55));
      updateCamera();
    };

    mount.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    mount.addEventListener('wheel', onWheel, { passive: true });

    let rafId;
    const animate = () => { rafId = requestAnimationFrame(animate); renderer.render(scene, camera); };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      mount.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      mount.removeEventListener('wheel', onWheel);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [blds, lot]);

  // Reactive sun light update
  useEffect(() => {
    const { dirLight } = sceneRefs.current;
    if (!dirLight) return;
    if (!sun) { dirLight.intensity = 0; return; }
    dirLight.intensity = 1.6;
    const eR = sun.elev * Math.PI / 180, azR = sun.az * Math.PI / 180, d = 400;
    dirLight.position.set(
      -d * Math.sin(azR) * Math.cos(eR),
       d * Math.sin(eR),
      -d * Math.cos(azR) * Math.cos(eR)
    );
    dirLight.shadow.camera.updateProjectionMatrix();
  }, [sun]);

  return (
    <div style={{ position:'relative' }}>
      <div ref={mountRef} style={{
        width:'100%', height:420, borderRadius:12, overflow:'hidden',
        border:'0.5px solid var(--color-border-tertiary)', cursor:'grab', userSelect:'none'
      }} />
      <div style={{ position:'absolute', bottom:10, left:12, fontSize:11, color:'rgba(180,178,170,0.5)', pointerEvents:'none' }}>
        드래그: 회전 &nbsp;|&nbsp; 스크롤: 줌
      </div>
    </div>
  );
}

// ─── Chart Component ───────────────────────────────────────────────────────────
function SunChart({ lat, doy, blds, lot }) {
  const chartRef = useRef(null);
  const instRef = useRef(null);

  const chartData = useMemo(() => {
    const hours = [];
    for (let h = 6; h <= 18; h += 0.5) hours.push(h);
    return hours.map(h => {
      const s = getSun(h, lat, doy);
      return { h, pct: calcLitPct(lot, blds, s, 12), elev: s ? Math.round(s.elev) : 0 };
    });
  }, [lat, doy, blds, lot]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (instRef.current) { instRef.current.destroy(); instRef.current = null; }
    const dk = window.matchMedia('(prefers-color-scheme:dark)').matches;
    const tc = dk ? '#b8b6b0' : '#3c3c38';
    const gc = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    instRef.current = new ChartJS.Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: chartData.map(d => {
          const h = Math.floor(d.h);
          return `${String(h).padStart(2,'0')}:${d.h % 1 ? '30' : '00'}`;
        }),
        datasets: [
          {
            label: '일조 면적 %',
            yAxisID: 'y',
            data: chartData.map(d => d.pct),
            backgroundColor: chartData.map(d => `rgba(244,184,48,${0.2 + d.pct/100*0.75})`),
            borderColor: 'rgba(244,184,48,0.85)',
            borderWidth: 1,
            borderRadius: 3,
          },
          {
            label: '태양 고도각 (°)',
            yAxisID: 'y2',
            type: 'line',
            data: chartData.map(d => d.elev),
            borderColor: '#378ADD',
            backgroundColor: 'rgba(55,138,221,0.08)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: tc, font: { size: 12 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.dataset.label + ': ' + ctx.raw + (ctx.datasetIndex === 0 ? '%' : '°')
            }
          }
        },
        scales: {
          x: { ticks: { color: tc, maxTicksLimit: 13, font: { size: 11 } }, grid: { color: gc } },
          y: {
            min: 0, max: 100,
            ticks: { color: tc, callback: v => v + '%' },
            grid: { color: gc },
            title: { display: true, text: '일조 면적', color: tc, font: { size: 11 } }
          },
          y2: {
            position: 'right', min: 0, max: 90,
            ticks: { color: '#378ADD', callback: v => v + '°' },
            grid: { display: false },
            title: { display: true, text: '태양 고도', color: '#378ADD', font: { size: 11 } }
          }
        }
      }
    });
    return () => { if (instRef.current) { instRef.current.destroy(); instRef.current = null; } };
  }, [chartData]);

  // Peak sunlight info
  const peak = chartData.reduce((a, b) => a.pct >= b.pct ? a : b, chartData[0]);
  const avg = Math.round(chartData.reduce((s, d) => s + d.pct, 0) / chartData.length);

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
        {[
          ['최대 일조', peak.pct + '%'],
          ['평균 일조', avg + '%'],
          ['최대 시간', `${String(Math.floor(peak.h)).padStart(2,'0')}:${peak.h%1?'30':'00'}`],
        ].map(([l,v]) => (
          <div key={l} style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'8px 12px' }}>
            <div style={{ fontSize:18, fontWeight:500 }}>{v}</div>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem' }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ShadowSimulator() {
  const [view, setView] = useState('2d');
  const [lat, setLat] = useState(37.5);
  const [lng, setLng] = useState(127.0);
  const [hour, setHour] = useState(10);
  const [season, setSeason] = useState(6);
  const [blds, setBlds] = useState(INIT_BLDS);
  const [addMode, setAddMode] = useState(false);
  const [sel, setSel] = useState(null);

  const doy = SEASON_DOY[season];
  const sun = useMemo(() => getSun(hour, lat, doy), [hour, lat, doy]);
  const pct = useMemo(() => calcLitPct(LOT, blds, sun), [blds, sun]);

  // Play animation
  const playRef = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    playRef.current = playing;
    if (!playing) return;
    let raf;
    const tick = () => {
      if (!playRef.current) return;
      setHour(h => { const n = +(h + 0.02).toFixed(3); return n > 18.1 ? 6 : n; });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const hh = Math.floor(hour), mm = Math.round((hour - hh) * 60);
  const timeStr = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;

  const tabBtn = (label, val) => (
    <button key={val} onClick={() => setView(val)} style={{
      padding: '5px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: '0.5px solid',
      borderColor: view === val ? 'var(--color-border-info)' : 'var(--color-border-secondary)',
      background: view === val ? 'var(--color-background-info)' : 'var(--color-background-secondary)',
      color: view === val ? 'var(--color-text-info)' : 'var(--color-text-primary)',
      fontWeight: view === val ? 500 : 400
    }}>{label}</button>
  );

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)', padding: '0 0 1.5rem' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>공터 일조권 시뮬레이터</div>
          <div style={{ fontSize: 12, color:'var(--color-text-secondary)', marginTop:2 }}>
            Solar Position Algorithm · Convex Hull · 3D Rendering
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          {tabBtn('2D 평면', '2d')}
          {tabBtn('3D 뷰', '3d')}
          {tabBtn('일조 그래프', 'chart')}
        </div>
      </div>

      {/* Location */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginBottom:10 }}>
        {CITIES.map(c => (
          <button key={c.name} onClick={() => { setLat(c.lat); setLng(c.lng); }} style={{
            padding:'4px 11px', borderRadius:20, fontSize:12, cursor:'pointer', border:'0.5px solid',
            borderColor: Math.abs(lat - c.lat) < 0.2 ? 'var(--color-border-info)' : 'var(--color-border-secondary)',
            background: Math.abs(lat - c.lat) < 0.2 ? 'var(--color-background-info)' : 'var(--color-background-secondary)',
            color: Math.abs(lat - c.lat) < 0.2 ? 'var(--color-text-info)' : 'var(--color-text-secondary)'
          }}>{c.name}</button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:5, alignItems:'center' }}>
          <input type="number" value={lat} step={0.1}
            onChange={e => setLat(+e.target.value)}
            style={{ width:70, padding:'3px 6px', borderRadius:6, fontSize:12,
              border:'0.5px solid var(--color-border-secondary)',
              background:'var(--color-background-secondary)', color:'var(--color-text-primary)' }} />
          <span style={{ fontSize:11, color:'var(--color-text-secondary)' }}>°N</span>
          <input type="number" value={lng} step={0.1}
            onChange={e => setLng(+e.target.value)}
            style={{ width:70, padding:'3px 6px', borderRadius:6, fontSize:12,
              border:'0.5px solid var(--color-border-secondary)',
              background:'var(--color-background-secondary)', color:'var(--color-text-primary)' }} />
          <span style={{ fontSize:11, color:'var(--color-text-secondary)' }}>°E</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
        {[
          ['태양 고도각', sun ? Math.round(sun.elev) + '°' : '—'],
          ['공터 일조 면적', pct + '%'],
          ['태양 방위각', sun ? Math.round(sun.az) + '°' : '—'],
        ].map(([label, val]) => (
          <div key={label} style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'8px 12px' }}>
            <div style={{ fontSize: 20, fontWeight: 500 }}>{val}</div>
            <div style={{ fontSize: 11, color:'var(--color-text-secondary)', marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* View */}
      {view === '2d' && (
        <View2D blds={blds} setBlds={setBlds} lot={LOT} sun={sun}
          sel={sel} setSel={setSel} addMode={addMode} setAddMode={setAddMode} />
      )}
      {view === '3d' && <View3D blds={blds} lot={LOT} sun={sun} />}
      {view === 'chart' && <SunChart lat={lat} doy={doy} blds={blds} lot={LOT} />}

      {/* Time Controls */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12, flexWrap:'wrap' }}>
        <span style={{ fontSize: 22, fontWeight: 500, minWidth: 56, fontVariantNumeric:'tabular-nums' }}>
          {timeStr}
        </span>
        <input type="range" min={6} max={18} step={0.05} value={hour}
          onChange={e => { setPlaying(false); setHour(+e.target.value); }}
          style={{ flex: 1, minWidth: 100 }} />
        <select value={season} onChange={e => setSeason(+e.target.value)} style={{
          padding:'5px 8px', borderRadius:8, fontSize:12, cursor:'pointer',
          border:'0.5px solid var(--color-border-secondary)',
          background:'var(--color-background-secondary)', color:'var(--color-text-primary)'
        }}>
          <option value={1}>1월 겨울</option>
          <option value={3}>3월 봄</option>
          <option value={6}>6월 여름</option>
          <option value={9}>9월 가을</option>
          <option value={12}>12월 동지</option>
        </select>
        <button onClick={() => setPlaying(p => !p)} style={{
          padding:'5px 16px', borderRadius:8, fontSize:13, cursor:'pointer',
          border:'0.5px solid var(--color-border-secondary)',
          background: playing ? 'var(--color-background-info)' : 'var(--color-background-secondary)',
          color: playing ? 'var(--color-text-info)' : 'var(--color-text-primary)',
          borderColor: playing ? 'var(--color-border-info)' : 'var(--color-border-secondary)'
        }}>
          {playing ? '⏸ 일시정지' : '▶ 하루 재생'}
        </button>
      </div>
    </div>
  );
}
