// ======================================================
// VIRTUAL CHEMISTRY LAB - COMPLETE ENHANCED VERSION
// ======================================================

// ======================================================
// GLOBAL STATE
// ======================================================
let imgLabBg;
let vessels = {};
let isDragging = null;
let hoverVessel = null;

let studentVolume = 0;
let phStage = 0;
let beakerTargetVol = 0;
let pipetteTargetVol = 0;
let buretteTargetVol = 0;

let catalog;
let imgBeaker, imgBottle, imgBurette, imgPipette;
let imgConical, imgVolumetric, imgFunnel, imgWash, imgBunsen;
let imgBalance, imgCrucible, imgHotplate, imgLiebig, imgMeltingPoint, imgPHMeter, imgSepFunnel, imgTLC;

let catalogVisible = true;
let catalogToggleButton = null;
let catalogPanelBounds = null;

let currentPositions = null;
let idCounter = 0;
const sizeMultiplier = 0.50;
let labSurfaces = null;

// ======================================================
// LAB SURFACES (continuous surfaces)
// ======================================================
const LAB_SURFACES = {
  shelf: { y: 360, minX: 250, maxX: 650, shadowAlpha: 30 },
  table: { y: 460, minX: 200, maxX: 820, shadowAlpha: 45 }
};

function getLabSurfaces() {
  const scaleX = width / 1200;
  const scaleY = height / 700;
  return {
    shelf: { 
      y: 360 * scaleY, 
      minX: 150 * scaleX,      // Full coverage left
      maxX: width * 0.75,      // Full coverage right  
      shadowAlpha: 30 
    },
    table: { 
      y: 460 * scaleY, 
      minX: 100 * scaleX,      // Wider coverage
      maxX: width * 0.85, 
      shadowAlpha: 45 
    }
  };
}

function updateLabSurfaces() {
  labSurfaces = getLabSurfaces();
}

// ======================================================
// CHEMICALS
// ======================================================
const CHEMICALS = {
  acid: [
    { id: 'hcl_0_1M', label: '0.1 M HCl' },
    { id: 'h2so4_0_1M', label: '0.1 M H2SO4' }
  ],
  base: [
    { id: 'naoh_0_1M', label: '0.1 M NaOH' },
    { id: 'koh_0_1M', label: '0.1 M KOH' }
  ],
  indicator: [
    { id: 'phenolphthalein', label: 'Phenolphthalein' }
  ]
};

// Big vs Small apparatus classification
const BIG_APPARATUS = [
  'burette', 'bunsen_burner', 'wash_bottle', 'hotplate', 'balance', 
  'liebig_condensor', 'separatory_funnel', 'pH_meter', 'meltingpoint_apparatus'
];

const SMALL_APPARATUS = [
  'beaker', 'pipette', 'bottle', 'funnel', 'conical_flask', 
  'volumetric_flask', 'crucible', 'TLC_plate'
];

// ======================================================
// RESPONSIVE POSITIONS
// ======================================================
function getResponsivePositions() {
  const scaleX = width / 1200;
  const scaleY = height / 700;
  const scale = min(scaleX, scaleY);

  return {
    burette_stand: { x: 540 * scaleX, y: 260 * scaleY },
    sizes: {
      beaker: { w: 120 * scale * sizeMultiplier, h: 140 * scale * sizeMultiplier },
      pipette: { w: 150 * scale * sizeMultiplier, h: 130 * scale * sizeMultiplier },
      burette: { w: 200 * scale * sizeMultiplier, h: 360 * scale * sizeMultiplier },
      bottle: { w: 120 * scale * sizeMultiplier, h: 180 * scale * sizeMultiplier },
      balance: { w: 200 * scale * sizeMultiplier, h: 250 * scale * sizeMultiplier },
      crucible: { w: 100 * scale * sizeMultiplier, h: 100 * scale * sizeMultiplier },
      hotplate: { w: 200 * scale * sizeMultiplier, h: 150 * scale * sizeMultiplier },
      liebig_condensor: { w: 150 * scale * sizeMultiplier, h: 160 * scale * sizeMultiplier },
      meltingpoint_apparatus: { w: 200 * scale * sizeMultiplier, h: 250 * scale * sizeMultiplier },
      pH_meter: { w: 200 * scale * sizeMultiplier, h: 250 * scale * sizeMultiplier },
      separatory_funnel: { w: 200 * scale * sizeMultiplier, h: 360 * scale * sizeMultiplier },
      TLC_plate: { w: 100 * scale * sizeMultiplier, h: 120 * scale * sizeMultiplier },
      conical_flask: { w: 120 * scale * sizeMultiplier, h: 150 * scale * sizeMultiplier },
      volumetric_flask: { w: 120 * scale * sizeMultiplier, h: 160 * scale * sizeMultiplier },
      funnel: { w: 80 * scale * sizeMultiplier, h: 80 * scale * sizeMultiplier },
      wash_bottle: { w: 120 * scale * sizeMultiplier, h: 180 * scale * sizeMultiplier },
      bunsen_burner: { w: 120 * scale * sizeMultiplier, h: 180 * sizeMultiplier * scale }
    }
  };
}

// ======================================================
// PRELOAD
// ======================================================
function preload() {
  imgLabBg = loadImage('/static/images/lab-bg.jpg');
  imgBeaker = loadImage('/static/img/catalog/beaker.png');
  imgBottle = loadImage('/static/img/catalog/bottle.png');
  imgBurette = loadImage('/static/img/catalog/burette.png');
  imgPipette = loadImage('/static/img/catalog/pipette.png');
  imgConical = loadImage('/static/img/catalog/conical_flask.png');
  imgVolumetric = loadImage('/static/img/catalog/volumetric_flask.png');
  imgFunnel = loadImage('/static/img/catalog/funnel.png');
  imgWash = loadImage('/static/img/catalog/wash_bottle.png');
  imgBunsen = loadImage('/static/img/catalog/bunsen_burner.png');
  imgBalance = loadImage('/static/img/catalog/balance.png');
  imgCrucible = loadImage('/static/img/catalog/crucible.png');
  imgHotplate = loadImage('/static/img/catalog/hotplate.png');
  imgLiebig = loadImage('/static/img/catalog/liebig_condensor.png');
  imgMeltingPoint = loadImage('/static/img/catalog/meltingpoint_apparatus.png');
  imgPHMeter = loadImage('/static/img/catalog/pH_meter.png');
  imgSepFunnel = loadImage('/static/img/catalog/separatory_funnel.png');
  imgTLC = loadImage('/static/img/catalog/TLC_plate.png');
}



// ======================================================
// SETUP & RESIZE
// ======================================================
function setup() {
  const root = document.getElementById('simulation-canvas');
  const w = root ? root.clientWidth : window.innerWidth;
  const h = root ? root.clientHeight : window.innerHeight - 48;

  let canvas = createCanvas(w, h);
  canvas.parent('simulation-canvas');

  vessels = {};
  studentVolume = 0;
  phStage = 0;
  beakerTargetVol = 0;
  pipetteTargetVol = 0;
  buretteTargetVol = 0;

  updateLabSurfaces(); 

  updateResponsivePositions();

  catalog = new LabCatalog({
    visible_apparatus: [
      'beaker', 'conical_flask', 'volumetric_flask',
      'pipette', 'burette', 'bottle',
      'balance', 'crucible', 'hotplate', 'liebig_condensor', 
      'meltingpoint_apparatus', 'pH_meter', 'separatory_funnel', 'TLC_plate',
      'funnel', 'wash_bottle', 'bunsen_burner'
    ],
    scale: 0.75
  });

  catalog.initSprites({
    beaker: imgBeaker, pipette: imgPipette, bottle: imgBottle,
    burette: imgBurette, conical_flask: imgConical,
    volumetric_flask: imgVolumetric, funnel: imgFunnel,
    wash_bottle: imgWash, bunsen_burner: imgBunsen,
    balance: imgBalance, crucible: imgCrucible,
    hotplate: imgHotplate, liebig_condensor: imgLiebig,
    meltingpoint_apparatus: imgMeltingPoint, pH_meter: imgPHMeter,
    separatory_funnel: imgSepFunnel, TLC_plate: imgTLC
  });
}

function windowResized() {
  const root = document.getElementById('simulation-canvas');
  const w = root ? root.clientWidth : window.innerWidth;
  const h = root ? root.clientHeight : window.innerHeight - 48;
  resizeCanvas(w, h);

  updateLabSurfaces();  // Recalculate surfaces

  if (currentPositions) {
    Object.values(vessels).forEach(v => {
      const size = currentPositions.sizes[v.type] || currentPositions.sizes.beaker;
      v.w = size.w;
      v.h = size.h;
    });
  }
}

function updateResponsivePositions() {
  currentPositions = getResponsivePositions();
}

// ======================================================
// HELPERS
// ======================================================
function askCapacity(type) {
  const options = {
    beaker: [50, 100, 250, 500],
    pipette: [10, 25],
    burette: [25, 50],
    volumetric_flask: [100, 250, 500],
    separatory_funnel: [250, 500]
  }[type] || [];

  if (!options.length) return null;

  const input = window.prompt(`Choose ${type} capacity (mL): ` + options.join(', '));
  if (input === null) return null;
  const value = parseFloat(input);
  return options.includes(value) ? value : null;
}

function askChemical(kind) {
  const list = CHEMICALS[kind];
  if (!list?.length) return null;

  const text = list.map((c, i) => `${i + 1}. ${c.label}`).join('\n');
  const choice = window.prompt(`Choose a ${kind}:\n${text}`);
  if (choice === null) return null;
  const idx = parseInt(choice, 10) - 1;
  return (idx >= 0 && idx < list.length) ? list[idx] : null;
}

// ======================================================
// SMART SPAWN & COLLISION
// ======================================================
function smartSpawnPosition(type) {
  // Use dynamic lab surfaces (no more fixed LAB_ZONES!)
  if (!labSurfaces) return { x: width/2, y: height/2 };
  
  const isBig = BIG_APPARATUS.includes(type);
  const spawnSurface = isBig ? labSurfaces.table : labSurfaces.shelf;
  
  // Spawn at center of surface with slight random offset
  const centerX = (spawnSurface.minX + spawnSurface.maxX) / 2;
  const centerY = spawnSurface.y;
  
  // Find collision-free spot near center
  return findCollisionFreePosition(centerX + random(-50, 50), centerY, type);
}


function findCollisionFreePosition(targetX, targetY, type) {
  let attempts = 0;
  const scaleX = width / 1200;
  const scaleY = height / 700;
  
  while (attempts < 20) {
    let testX = targetX + random(-80, 80);
    let testY = targetY + random(-20, 20);
    
    // Keep within lab surface bounds
    const isBig = BIG_APPARATUS.includes(type);
    const bounds = isBig ? labSurfaces.table : labSurfaces.shelf;
    
    if (testX < bounds.minX || testX > bounds.maxX || testY > bounds.y + 20) {
      attempts++;
      continue;
    }
    
    // Check collision with other vessels
    let collision = false;
    Object.values(vessels).forEach(other => {
      if (dist(testX, testY, other.x, other.y) < 60) {
        collision = true;
      }
    });
    
    if (!collision) return { x: testX, y: testY };
    attempts++;
  }
  
  // Fallback: surface center
  return { 
    x: constrain(targetX, labSurfaces.table.minX + 50, labSurfaces.table.maxX - 50), 
    y: labSurfaces.table.y 
  };
}


// ======================================================
// VESSEL MODEL
// ======================================================
function makeVessel(id, x, y, w, h, title, chem, vtype, vol, cap) {
  return {
    id, x, y, w, h,
    title, chem, type: vtype,
    volume: vol, capacity: cap,
    dragging: false,
    isUnderBurette: false,
    chemicalId: null,
    surface: null,
    vx: 0, vy: 0,
    glow: 0, // Proximity glow effect
    hint: '' // Contextual hint
  };
}

function makeResponsiveVessel(id, type) {
  if (!currentPositions) return null;
  const spawnPos = smartSpawnPosition(type);
  const size = currentPositions.sizes[type] || currentPositions.sizes.beaker;
  return makeVessel(id, spawnPos.x, spawnPos.y, size.w, size.h, type, 'Empty', type, 0, 100);
}

// ======================================================
// PROXIMITY & GLOW SYSTEM
// ======================================================
function proximityCheck() {
  Object.values(vessels).forEach(v => {
    v.glow = 0;
    v.hint = '';
    
    // Pipette interactions
    if (v.type === 'pipette') {
      const bottle = Object.values(vessels).find(b => b.type === 'bottle');
      const beaker = Object.values(vessels).find(b => b.type === 'beaker');
      
      if (bottle && near(v, bottle, 50)) {
        v.glow = 1;
        v.hint = 'SHIFT = Suck acid/base';
      } else if (beaker && near(v, beaker, 50)) {
        v.glow = 1;
        v.hint = 'SHIFT = Pour contents';
      }
    }
    
    // pH Meter
    if (v.type === 'pH_meter') {
      const beaker = Object.values(vessels).find(b => b.type === 'beaker');
      if (beaker && near(v, beaker, 50)) {
        v.glow = 1;
        v.hint = 'Hover to read pH';
      }
    }
    
    // Balance
    if (v.type === 'balance') {
      const crucible = Object.values(vessels).find(c => c.type === 'crucible');
      const beaker = Object.values(vessels).find(b => b.type === 'beaker');
      if ((crucible && near(v, crucible, 50)) || (beaker && near(v, beaker, 50))) {
        v.glow = 1;
        v.hint = 'T = Tare';
      }
    }
  });
}

// ======================================================
// PHYSICS & SURFACE SNAPPING
// ======================================================
function applyLabPhysics(v) {
  if (v.dragging) return;

  // Gravity
  const gravity = 1.2;
  v.vy += gravity;
  v.y += v.vy;

  // Find closest surface
  let closestSurface = null;
  let minDist = Infinity;
  
  Object.values(labSurfaces).forEach(surf => {
    const dist = abs(v.y - surf.y);
    if (dist < minDist) {
      minDist = dist;
      closestSurface = surf;
    }
  });

  // Snap to surface + dynamic positioning
  if (closestSurface && v.y >= closestSurface.y - 20) {
    v.y = closestSurface.y;
    v.vy = 0;
    v.surface = closestSurface;
    
    // DYNAMIC SPACING - apparatus auto-arrange!
    const spacing = v.w * 1.3;  // Perfect spacing based on size
    const sameSurfaceVessels = Object.values(vessels).filter(other => 
      other !== v && 
      other.surface === closestSurface && 
      abs(other.y - v.y) < 15  // Same row
    );
    
    // Repel from neighbors (smooth arrangement)
    sameSurfaceVessels.forEach(neighbor => {
      const dx = v.x - neighbor.x;
      const overlap = spacing - abs(dx);
      if (overlap > 0) {
        v.x += (dx > 0 ? overlap * 0.12 : -overlap * 0.12);
      }
    });
    
    // Gentle bounds (not harsh constrain)
    const margin = v.w * 0.6 + 20;
    v.x = lerp(v.x, constrain(v.x, closestSurface.minX + margin, closestSurface.maxX - margin), 0.15);
  }
}


// ======================================================
// SHADOW RENDERING
// ======================================================
function drawShadow(v) {
  if (v.dragging || !v.surface) return;

  push();
  translate(v.x, v.y + v.h / 2); 
  noStroke();

  fill(0, 60);
  ellipse(0, 0, v.w * 0.5, v.h * 0.1);

  fill(0, 30);
  ellipse(0, 2, v.w * 0.8, v.h * 0.15);

  fill(0, 10);
  ellipse(0, 4, v.w * 1.2, v.h * 0.2);

  pop();
}

// ======================================================
// PARTICLE SYSTEM (Drips/Bubbles)
// ======================================================
let particles = [];

function createParticles(x, y, count, type) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + random(-5, 5),
      y: y,
      vx: random(-1, 1),
      vy: random(-2, 0),
      life: 60,
      maxLife: 60,
      size: random(2, 5),
      type: type // 'drip' or 'bubble'
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.life--;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  updateParticles();
  particles.forEach(p => {
    const alpha = map(p.life, 0, p.maxLife, 0, 255);
    fill(200, 200, 255, alpha);
    noStroke();
    ellipse(p.x, p.y, p.size);
  });
}

// ======================================================
// VOLUME EASING & INTERACTIONS
// ======================================================
function easeVolumes() {
  Object.values(vessels).forEach(v => {
    if (v.type === 'beaker') v.volume += (beakerTargetVol - v.volume) * 0.2;
    else if (v.type === 'burette') v.volume += (buretteTargetVol - v.volume) * 0.2;
    else if (v.type === 'pipette') v.volume += (pipetteTargetVol - v.volume) * 0.2;
  });
}

function near(a, b, radius) {
  return dist(a.x, a.y, b.x, b.y) < radius;
}

function handlePipetteInteraction() {
  if (!isDragging || isDragging.type !== 'pipette') return;

  const bottle = Object.values(vessels).find(v => v.type === 'bottle' && v.volume > 0);
  const beaker = Object.values(vessels).find(v => v.type === 'beaker');

  if (bottle && near(isDragging, bottle, 40) && keyIsDown(SHIFT)) {
    const step = 0.8;
    if (bottle.volume >= step && pipetteTargetVol < isDragging.capacity) {
      bottle.volume -= step;
      pipetteTargetVol = min(isDragging.capacity, pipetteTargetVol + step);
      createParticles(bottle.x, bottle.y + bottle.h/2, 3, 'drip');
    }
  }
  
  if (beaker && near(isDragging, beaker, 40) && keyIsDown(SHIFT)) {
    const step = 0.8;
    if (pipetteTargetVol >= step && beakerTargetVol < beaker.capacity) {
      pipetteTargetVol = max(0, pipetteTargetVol - step);
      beakerTargetVol = min(beaker.capacity, beakerTargetVol + step);
      createParticles(beaker.x, beaker.y + beaker.h/2 - 20, 3, 'drip');
    }
  }
}

// ======================================================
// INSTRUMENT READINGS
// ======================================================
function instrumentReadings() {
  // pH Meter reading
  const phMeter = Object.values(vessels).find(v => v.type === 'pH_meter');
  if (phMeter) {
    const beaker = Object.values(vessels).find(b => b.type === 'beaker' && near(phMeter, b, 50));
    if (beaker) {
      phMeter.reading = map(beakerTargetVol, 0, 25, 1, 11); // Simulated pH curve
    }
  }

  // Balance reading
  const balance = Object.values(vessels).find(v => v.type === 'balance');
  if (balance) {
    const crucible = Object.values(vessels).find(c => c.type === 'crucible' && near(balance, c, 50));
    const beaker = Object.values(vessels).find(b => b.type === 'beaker' && near(balance, b, 50));
    if (crucible) {
      balance.mass = crucible.volume * 1.2; // Simulated mass
    } else if (beaker) {
      balance.mass = beaker.volume;
    }
  }
}
function drawSnapGuides() {
  if (!isDragging || !labSurfaces) return;
  
  strokeWeight(5);
  Object.values(labSurfaces).forEach(surf => {
    const dist = abs(mouseY - surf.y);
    if (dist < 60) {
      stroke(0, 255, 0, map(dist, 0, 60, 200, 50));
      line(surf.minX, surf.y, surf.maxX, surf.y);
    }
  });
  noStroke();
}

function drawTitrationZone() {
  const burette = Object.values(vessels).find(v => v.type === 'burette');
  if (!burette || isDragging) return;
  
  const zoneX = burette.x - 45;
  const zoneY = burette.y + 120;
  const beaker = Object.values(vessels).find(v => v.type === 'beaker');
  
  const zoneColor = beaker && dist(beaker.x, beaker.y, zoneX, zoneY) < 40 
    ? [255, 100, 100, 150] : [100, 255, 100, 100];
  
  noFill();
  stroke(...zoneColor);
  strokeWeight(3);
  circle(zoneX, zoneY, 80);
  
  fill(...zoneColor);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(12);
  text('DROP', zoneX, zoneY);
}

// ======================================================
// MAIN DRAW LOOP
// ======================================================
function draw() {
  // Background
  imageMode(CORNER);
  image(imgLabBg, 0, 0, width, height);

  updateLabSurfaces();

  hoverVessel = null;

  // Core systems
  proximityCheck();
  Object.values(vessels).forEach(v => applyLabPhysics(v));
  easeVolumes();
  handlePipetteInteraction();
  instrumentReadings();

  // Draw shadows first, then vessels
  Object.values(vessels).forEach(v => drawShadow(v));
  Object.values(vessels).forEach(v => drawVessel(v));
  drawTitrationZone();
  drawSnapGuides();  // ✨ Visual feedback!

  // Particles
  drawParticles();

  // UI
  
  if (hoverVessel) drawTooltip(hoverVessel);
  if (catalogVisible) drawCatalogPanel();
  drawDataPanel();
  drawControlsPanel();
}

// ======================================================
// ENHANCED VESSEL DRAWING (with glow, liquid, pH color)
// ======================================================
function drawVessel(v) {
  const over = mouseX > v.x - v.w/2 && mouseX < v.x + v.w/2 &&
              mouseY > v.y - v.h/2 && mouseY < v.y + v.h/2;

  if (over && !isDragging) 
    {
      hoverVessel = v;
    }

  push();
  translate(v.x, v.y);
  imageMode(CENTER);

  // Proximity glow effect
  if (v.glow > 0) {
    drawingContext.shadowColor = 'rgba(0, 255, 0, 0.6)';
    drawingContext.shadowBlur = 30 * v.glow;
  }

  // Vessel sprites (ALL 17 apparatus)
  if (v.type === 'beaker') {
    image(imgBeaker, 0, 0, v.w, v.h);
    drawLiquid(v, -20, 60, v.w * 0.6, 70, color(255 - v.volume * 10, 100 + v.volume * 6, 255));
  }
  else if (v.type === 'burette') {
    image(imgBurette, 0, 0, v.w, v.h);
    drawLiquid(v, -30, -100, v.w * 0.4, 200, color(100, 200, 255));
  }
  else if (v.type === 'pipette') image(imgPipette, 0, 0, v.w, v.h);
  else if (v.type === 'bottle') {
    image(imgBottle, 0, 0, v.w, v.h);
    drawLiquid(v, -15, 40, v.w * 0.5, 80, color(100, 200, 255));
  }
  else if (v.type === 'conical_flask') image(imgConical, 0, 0, v.w, v.h);
  else if (v.type === 'volumetric_flask') image(imgVolumetric, 0, 0, v.w, v.h);
  else if (v.type === 'funnel') image(imgFunnel, 0, 0, v.w, v.h);
  else if (v.type === 'wash_bottle') image(imgWash, 0, 0, v.w, v.h);
  else if (v.type === 'bunsen_burner') image(imgBunsen, 0, 0, v.w, v.h);
  else if (v.type === 'balance') image(imgBalance, 0, 0, v.w, v.h);
  else if (v.type === 'crucible') image(imgCrucible, 0, 0, v.w, v.h);
  else if (v.type === 'hotplate') image(imgHotplate, 0, 0, v.w, v.h);
  else if (v.type === 'liebig_condensor') image(imgLiebig, 0, 0, v.w, v.h);
  else if (v.type === 'meltingpoint_apparatus') image(imgMeltingPoint, 0, 0, v.w, v.h);
  else if (v.type === 'pH_meter') image(imgPHMeter, 0, 0, v.w, v.h);
  else if (v.type === 'separatory_funnel') image(imgSepFunnel, 0, 0, v.w, v.h);
  else if (v.type === 'TLC_plate') image(imgTLC, 0, 0, v.w, v.h);

  // Fallback
  else {
    fill(200, 200, 220);
    stroke(100);
    strokeWeight(2);
    rect(-v.w/2, -v.h/2, v.w, v.h, 8);
    fill(0); textAlign(CENTER, CENTER); textSize(12);
    text(v.type, 0, 0);
  }

  drawingContext.shadowBlur = 0;
  drawingContext.shadowColor = 'transparent';

  // Labels
  textAlign(CENTER);
  textSize(11); fill(30);
  text(v.title || v.type, 0, v.h/2 + 15);
  textSize(10);
  text(v.chem || 'Empty', 0, v.h/2 + 28);

  // Instrument displays
  if (v.type === 'pH_meter' && v.reading) {
    drawDigitalDisplay(20, -30, `pH: ${nf(v.reading, 1, 2)}`);
  }
  if (v.type === 'balance' && v.mass !== undefined) {
    drawDigitalDisplay(-40, -60, `Mass: ${nf(v.mass, 1, 3)}g`);
  }

  // Hints
  if (v.hint) {
    fill(0, 255, 0, 200);
    textSize(10); textAlign(CENTER);
    text(v.hint, 0, -v.h/2 - 10);
  }

  pop();
}

function drawLiquid(v, x, y, w, h, col) {
  const fillHeight = map(v.volume, 0, v.capacity, 0, h);
  fill(red(col), green(col), blue(col), 180);
  noStroke();
  rect(x, y + h - fillHeight, w, fillHeight, w/2);
}

function drawDigitalDisplay(x, y, text) {
  // Digital display background
  fill(0, 50);
  stroke(100);
  strokeWeight(1);
  rect(x-5, y-5, 80, 22, 4);
  
  // Digital text
  fill(0, 255, 0);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(11);
  text(text, x, y);
}

// ======================================================
// TOOLTIP
// ======================================================
function drawTooltip(v) {
  const boxW = 210, boxH = 90;
  const x = constrain(mouseX + 15, 10, width - boxW - 10);
  const y = constrain(mouseY + 15, 10, height - boxH - 10);

  fill(255, 255, 255, 240); stroke(180);
  rect(x, y, boxW, boxH, 8);
  noStroke(); fill(0); textAlign(LEFT);
  textSize(13); text(v.title, x + 10, y + 20);
  textSize(12);
  text('Chemical: ' + v.chem, x + 10, y + 38);
  text('Volume: ' + nf(v.volume, 1, 2) + ' mL', x + 10, y + 56);
  if (v.hint) text('Hint: ' + v.hint, x + 10, y + 74);
}

// ======================================================
// UI PANELS
// ======================================================
function drawDataPanel() {
  const panelW = 220, panelH = 180, margin = 40, panelX = width - panelW - margin;

  fill(255, 255, 255, 235); stroke(210);
  rect(panelX, 30, panelW, panelH, 12);

  noStroke(); fill(0); textAlign(LEFT);
  textSize(15); textStyle(BOLD); text('Live Data', panelX + 15, 55);
  textStyle(NORMAL); textSize(13);
  text('Base added: ' + nf(studentVolume, 1, 2) + ' mL', panelX + 15, 80);

  if (studentVolume > 0) {
    const diff = abs(studentVolume - 25.0);
    if (diff < 0.25) { 
      fill(0, 150, 0); 
      text('Perfect endpoint ✔', panelX + 15, 105); 
      phStage = 2; 
    }
    else if (studentVolume > 26) { 
      fill(200, 0, 0); 
      text('Overshot endpoint ✖', panelX + 15, 105); 
      phStage = 2; 
    }
    else { 
      fill(120, 120, 0); 
      text('Approaching endpoint…', panelX + 15, 105); 
      phStage = 1; 
    }
  }

  // Status
  textSize(12); fill(0);
  text(`pH Stage: ${phStage}`, panelX + 15, 135);

  const btnX = 40, btnY = height - 50, btnW = 200, btnH = 32;
  fill(255, 255, 255, 235); stroke(180);
  rect(btnX, btnY, btnW, btnH, 8);
  noStroke(); fill(0); textAlign(CENTER, CENTER); textSize(13);
  text(catalogVisible ? 'Hide Apparatus Catalog' : 'Show Apparatus Catalog', btnX + btnW/2, btnY + btnH/2);
  catalogToggleButton = { x: btnX, y: btnY, w: btnW, h: btnH };
}

function drawControlsPanel() {
  const panelW = 200, panelH = 120;
  const x = width - panelW - 20;
  const y = height - panelH - 20;

  fill(0, 0, 0, 220); stroke(255);
  strokeWeight(2);
  rect(x, y, panelW, panelH, 12);

  fill(255); noStroke(); textAlign(LEFT);
  textSize(14); textStyle(BOLD);
  text('📱 CONTROLS', x + 15, y + 25);
  
  textSize(12); textStyle(NORMAL);
  text('SPACE  = Pour/Titrate', x + 15, y + 50);
  text('SHIFT+SPACE = Fast', x + 15, y + 70);
  text('H = Heat ON/OFF', x + 15, y + 90);
  text('T = Tare/Reset', x + 15, y + 110);
}

function drawCatalogPanel() {
  const panelX = 20;
  const panelY = 30;
  const panelW = 320;
  const panelH = height - 80;

  catalogPanelBounds = { x: panelX, y: panelY, w: panelW, h: panelH };

  fill(255, 255, 255, 235); 
  stroke(170);
  rect(panelX, panelY, panelW, panelH, 10);

  noStroke(); 
  fill(0); 
  textAlign(LEFT);
  textSize(16); 
  textStyle(BOLD); 
  text('Apparatus Catalog', panelX + 15, panelY + 28);

  const innerX = panelX + 20;
  const innerY = panelY + 50;
  const itemW = 280;
  const itemH = 380;

  catalog.drawPanel(innerX, innerY, itemW, itemH);
}

// ======================================================
// EVENTS
// ======================================================
function mousePressed() {
  // Toggle catalog
  if (catalogToggleButton &&
      mouseX > catalogToggleButton.x && mouseX < catalogToggleButton.x + catalogToggleButton.w &&
      mouseY > catalogToggleButton.y && mouseY < catalogToggleButton.y + catalogToggleButton.h) {
    catalogVisible = !catalogVisible;
    return;
  }

  // Catalog click
  if (catalogVisible && catalogPanelBounds &&
      mouseX > catalogPanelBounds.x && mouseX < catalogPanelBounds.x + catalogPanelBounds.w &&
      mouseY > catalogPanelBounds.y && mouseY < catalogPanelBounds.y + catalogPanelBounds.h) {
    const localX = mouseX - catalogPanelBounds.x;
    const localY = mouseY - (catalogPanelBounds.y + 50);
    const item = catalog.handleClick(localX, localY);
    if (item) {
      spawnApparatusFromCatalog(item);
      return;
    }
  }

  // Drag vessels
  const keys = Object.keys(vessels);
  for (let i = keys.length - 1; i >= 0; i--) {
    const v = vessels[keys[i]];
    if (mouseX > v.x - v.w/2 && mouseX < v.x + v.w/2 &&
        mouseY > v.y - v.h/2 && mouseY < v.y + v.h/2) {
      v.dragging = true;
      v.surface = null;
      v.vy = 0;
      isDragging = v;
      break;
    }
  }
}

function mouseDragged() {
  if (isDragging) {
    isDragging.x = mouseX;
    isDragging.y = mouseY;
    isDragging.vy = 0;
  }
}

function mouseReleased() {
  if (isDragging) {
    isDragging.dragging = false;
    isDragging = null;
  }
}

function mouseClicked() {
  if (mouseButton === RIGHT && hoverVessel) {
    delete vessels[hoverVessel.id];
    hoverVessel = null;
  }
}

function keyPressed() {
  // Remove with 'R'
  if (key.toLowerCase() === 'r' && hoverVessel) {
    delete vessels[hoverVessel.id];
    hoverVessel = null;
    return;
  }

  // SPACE - Titration
  if (key === ' ' || keyCode === 32) {
  const beaker = Object.values(vessels).find(v => v.type === 'beaker');
  const burette = Object.values(vessels).find(v => v.type === 'burette');
  if (!beaker || !burette) return;

  // DYNAMIC TITRATION - beaker near burette (no fixed zones!)
  const dist = dist(beaker.x, beaker.y, burette.x, burette.y);
  const underBurette = dist < 80;  // Within 80px radius
  
  if (!underBurette) {
    console.log('Place beaker under burette tip, then press SPACE');
    return;
  }

  // Auto-snap beaker directly under burette
  beaker.x = burette.x - 45;  // Perfect alignment
  beaker.y = burette.y + 120; // Under burette tip

  const flow = keyIsDown(SHIFT) ? 0.8 : 0.25;
  if (buretteTargetVol >= flow && beakerTargetVol < beaker.capacity) {
    buretteTargetVol = max(0, buretteTargetVol - flow);
    beakerTargetVol = min(beaker.capacity, beakerTargetVol + flow);
    studentVolume += flow;
    createParticles(beaker.x, beaker.y + 20, 5, 'drip');  // Particles from beaker
  }
}


  // T - Tare balance
  if (key.toLowerCase() === 't') {
    const balance = Object.values(vessels).find(v => v.type === 'balance');
    if (balance) {
      balance.massOffset = balance.mass || 0;
      console.log('Balance tared');
    }
  }

  // H - Heat toggle
  if (key.toLowerCase() === 'h') {
    const hotplate = Object.values(vessels).find(v => v.type === 'hotplate');
    if (hotplate) {
      hotplate.heating = !hotplate.heating;
      console.log('Hotplate:', hotplate.heating ? 'ON' : 'OFF');
    }
  }
}

// ======================================================
// SPAWN APPARATUS
// ======================================================
function nextId(type) { idCounter++; return `${type}_${idCounter}`; }

function spawnApparatusFromCatalog(item) {
  if (!currentPositions) return;

  const type = item.id || item.type;
  if (!type) return;

  // Prevent duplicates for unique instruments
  if (['burette', 'bunsen_burner', 'balance', 'pH_meter', 'meltingpoint_apparatus', 'hotplate'].includes(type) &&
      Object.values(vessels).some(v => v.type === type)) {
    console.log(`${type} already exists!`);
    return;
  }

  let v = null;

  // Volumetric apparatus
  if (type === 'beaker') {
    const cap = askCapacity('beaker');
    if (!cap) return;
    v = makeResponsiveVessel(nextId('beaker'), 'beaker');
    if (v) {
      v.capacity = cap;
      v.title = `${cap} mL Beaker`;
      beakerTargetVol = 0;
    }
  }
  else if (type === 'pipette') {
    const cap = askCapacity('pipette');
    if (!cap) return;
    v = makeResponsiveVessel(nextId('pipette'), 'pipette');
    if (v) {
      v.capacity = cap;
      v.title = `${cap} mL Pipette`;
      pipetteTargetVol = 0;
    }
  }
  else if (type === 'volumetric_flask') {
    const cap = askCapacity('volumetric_flask');
    if (!cap) return;
    v = makeResponsiveVessel(nextId('volumetric_flask'), 'volumetric_flask');
    if (v) {
      v.capacity = cap;
      v.title = `${cap} mL Volumetric Flask`;
    }
  }
  else if (type === 'burette') {
    const cap = askCapacity('burette');
    if (!cap) return;
    const spawnPos = { x: currentPositions.burette_stand.x, y: currentPositions.burette_stand.y };
    const size = currentPositions.sizes.burette;
    v = makeVessel(nextId('burette'), spawnPos.x, spawnPos.y, size.w, size.h,
      `${cap} mL Burette`, '0.1 M NaOH', 'burette', cap, cap);
    buretteTargetVol = cap;
  }
  else if (type === 'conical_flask') {
    v = makeResponsiveVessel(nextId('conical_flask'), 'conical_flask');
    if (v) v.title = 'Conical Flask';
  }
  else if (type === 'bottle') {
    const chem = askChemical('base'); // Default to base for titration
    if (!chem) return;
    v = makeResponsiveVessel(nextId('bottle'), 'bottle');
    if (v) {
      v.chem = chem.label;
      v.title = 'Reagent Bottle';
      v.volume = 100;
      v.chemicalId = chem.id;
    }
  }
  else if (type === 'funnel') {
    v = makeResponsiveVessel(nextId('funnel'), 'funnel');
    if (v) v.title = 'Filter Funnel';
  }
  else if (type === 'wash_bottle') {
    v = makeResponsiveVessel(nextId('wash_bottle'), 'wash_bottle');
    if (v) {
      v.chem = 'Distilled Water';
      v.capacity = 250;
      v.title = 'Wash Bottle';
    }
  }
  else if (type === 'bunsen_burner') {
    v = makeResponsiveVessel(nextId('bunsen_burner'), 'bunsen_burner');
    if (v) v.title = 'Bunsen Burner';
  }
  else if (type === 'balance') {
    v = makeResponsiveVessel(nextId('balance'), 'balance');
    if (v) {
      v.title = 'Analytical Balance';
      v.mass = 0;
      v.massOffset = 0;
    }
  }
  else if (type === 'crucible') {
    v = makeResponsiveVessel(nextId('crucible'), 'crucible');
    if (v) {
      v.capacity = 20;
      v.title = 'Porcelain Crucible';
    }
  }
  else if (type === 'hotplate') {
    v = makeResponsiveVessel(nextId('hotplate'), 'hotplate');
    if (v) {
      v.title = 'Digital Hotplate';
      v.temperature = 25;
      v.heating = false;
    }
  }
  else if (type === 'liebig_condensor') {
    v = makeResponsiveVessel(nextId('liebig_condensor'), 'liebig_condensor');
    if (v) v.title = 'Liebig Condenser';
  }
  else if (type === 'meltingpoint_apparatus') {
    v = makeResponsiveVessel(nextId('meltingpoint_apparatus'), 'meltingpoint_apparatus');
    if (v) {
      v.title = 'Melting Point Apparatus';
      v.temperature = 25;
    }
  }
  else if (type === 'pH_meter') {
    v = makeResponsiveVessel(nextId('pH_meter'), 'pH_meter');
    if (v) {
      v.title = 'Digital pH Meter';
      v.reading = 7.0;
    }
  }
  else if (type === 'separatory_funnel') {
    const cap = askCapacity('separatory_funnel') || 250;
    v = makeResponsiveVessel(nextId('separatory_funnel'), 'separatory_funnel');
    if (v) {
      v.capacity = cap;
      v.title = `${cap} mL Sep. Funnel`;
    }
  }
  else if (type === 'TLC_plate') {
    v = makeResponsiveVessel(nextId('TLC_plate'), 'TLC_plate');
    if (v) v.title = 'TLC Plate';
  }

  if (v) {
    vessels[v.id] = v;
    console.log(`Spawned: ${v.title}`);
  }
}

// ======================================================
// RESET
// ======================================================
function resetExperiment() {
  studentVolume = beakerTargetVol = pipetteTargetVol = buretteTargetVol = 0;
  phStage = 0;
  Object.values(vessels).forEach(v => {
    if (v.type === 'beaker' || v.type === 'pipette') v.volume = 0;
    if (v.type === 'burette') v.volume = v.capacity;
    if (v.type === 'bottle') v.volume = 100;
  });
}

// ======================================================
// EXPOSE TO WINDOW
// ======================================================
window.preload = preload;
window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
window.mousePressed = mousePressed;
window.mouseDragged = mouseDragged;
window.mouseReleased = mouseReleased;
window.mouseClicked = mouseClicked;
window.keyPressed = keyPressed;
