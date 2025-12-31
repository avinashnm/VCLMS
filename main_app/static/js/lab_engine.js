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

let apparatusCatalog, chemicalCatalog;
let currentCatalogTab = 'apparatus';
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
      maxX: width * 0.99,       
      shadowAlpha: 30 
    },
    table: { 
      y: 460 * scaleY, 
      minX: 100 * scaleX,      // Wider coverage
      maxX: width * 0.99, 
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

 apparatusCatalog = new LabCatalog({ scale: 0.75 });
apparatusCatalog.initSprites({
  beaker: imgBeaker, pipette: imgPipette, bottle: imgBottle,
  burette: imgBurette, conical_flask: imgConical,
  volumetric_flask: imgVolumetric, funnel: imgFunnel,
  wash_bottle: imgWash, bunsen_burner: imgBunsen,
  balance: imgBalance, crucible: imgCrucible,
  hotplate: imgHotplate, liebig_condensor: imgLiebig,
  meltingpoint_apparatus: imgMeltingPoint, pH_meter: imgPHMeter,
  separatory_funnel: imgSepFunnel, TLC_plate: imgTLC
});

chemicalCatalog = new ChemicalCatalog([
  { 
    id: 'na2co3_nahco3', 
    label: '25% Na₂CO₃+NaHCO₃', 
    name: 'Sodium Carbonate + Bicarbonate', 
    formula: 'Na₂CO₃ + NaHCO₃', 
    conc: '25%', 
    color: [220, 180, 100] 
  },
  { 
    id: 'hcl_0_1M', 
    label: '0.1M HCl (Burette)', 
    name: 'Hydrochloric Acid', 
    formula: 'HCl', 
    conc: '0.1M', 
    color: [255, 120, 80] 
  },
  { 
    id: 'phenolphthalein', 
    label: 'Phenolphthalein', 
    name: 'Phenolphthalein', 
    formula: 'C₂₀H₁₄O₄', 
    conc: '', 
    color: [255, 180, 220] 
  },
  { 
    id: 'methyl_orange', 
    label: 'Methyl Orange', 
    name: 'Methyl Orange', 
    formula: 'C₁₄H₁₄N₃NaO₃S', 
    conc: '', 
    color: [255, 160, 60] 
  },
  { 
    id: 'distilled_water', 
    label: 'Distilled Water', 
    name: 'Distilled Water', 
    formula: 'H₂O', 
    conc: '', 
    color: [200, 220, 255] 
  }
]);

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

function applySloshPhysics(v) {
  // Calculate horizontal velocity for sloshing
  let horizontalMove = v.x - (v.lastX || v.x);
  v.lastX = v.x;

  // Target tilt is based on speed (inertia)
  let targetTilt = constrain(horizontalMove * 0.12, -0.6, 0.6);
  
  // Spring-damping physics for the liquid surface
  let springForce = (targetTilt - v.tilt) * 0.15;
  v.tiltVel += springForce;
  v.tiltVel *= 0.82; // Damping (makes it stop sloshing eventually)
  v.tilt += v.tiltVel;

  // Return to level if not moving
  if (!v.dragging) {
    v.tilt = lerp(v.tilt, 0, 0.05);
  }
}

// ======================================================
// VESSEL MODEL
// ======================================================
/**
 * PHASE 1 UPDATED VESSEL MODEL
 * This model now tracks chemical volumes specifically for the Jan 8th test.
 */
function makeVessel(id, x, y, w, h, title, chem, vtype, vol, cap) {
  return {
    // --- BASIC IDENTITY ---
    id: id,
    type: vtype,
    title: title,
    chem: chem,             // Display label (e.g., "0.1 M HCl")
    chemicalId: null,       // Catalog ID (e.g., "hcl_0_1M")
    
    // --- DIMENSIONS & PHYSICS ---
    x: x, 
    y: y, 
    w: w, 
    h: h,
    vx: 0, 
    vy: 0,
    lastX: x,               // For slosh physics calculation
    tilt: 0,                // Visual tilt angle
    tiltVel: 0,             // Tilt momentum
    surface: null,          // Which lab surface it's on
    
    // --- VOLUME & CAPACITY ---
    volume: vol,            // The total visual liquid level (mL)
    capacity: cap,          // Maximum allowed (mL)
    
    hasFunnel: false, 
    tiltAngle: 0, // 0 to 90 degrees
    isDraining: false,

    // --- UI & INTERACTION STATES ---
    dragging: false,
    isUnderBurette: false,
    isOnBalance: false,     // Visual flag to hide labels
    glow: 0,                // Proximity feedback
    hint: '',               // Contextual guidance
    color: [200, 220, 255, 150], // Current liquid color (RGBA)

    // ======================================================
    // NEW: THE CHEMICAL BRAIN (For Double Indicator Test)
    // ======================================================
    contents: {
      // Precise volume tracking for marking
      mixture_vol: 0,       // Volume of Na2CO3 + NaHCO3 (Analyte)
      hcl_vol: 0,           // Volume of HCl added (Titrant)
      water_vol: 0,         // For rinsing/dilution checks
      
      // Indicator Tracking
      pp_drops: 0,          // Phenolphthalein drops
      mo_drops: 0,          // Methyl Orange drops
      
      // Assessment Flags (Procedural Marking)
      isRinsed: false,      // Did student clean it before use?
      isContaminated: false, // Flagged if wrong chemicals mixed
      titrationStage: 1,    // 1 = V1 (PP), 2 = V2 (MO)
      
      // Target values (Updated dynamically during experiment)
      theoreticalV1: 10.0,  
      theoreticalV2: 25.0   
    }
  };
}

function makeResponsiveVessel(id, type) {
  if (!currentPositions) return null;
  const spawnPos = smartSpawnPosition(type);
  const size = currentPositions.sizes[type] || currentPositions.sizes.beaker;
  return makeVessel(id, spawnPos.x, spawnPos.y, size.w, size.h, type, 'Empty', type, 0, 100);
}

function getTitrationColor(v) {
  const c = v.contents;
  
  // 1. Basic mixture color (Clear/Distilled look)
  let baseColor = [220, 230, 255, 120]; 

  // 2. Stage 1: Phenolphthalein (Pink -> Colorless)
  if (c.pp_drops > 0 && c.mo_drops === 0) {
    if (c.hcl_vol < 10.0) {
      // Deep pink if 0mL HCl, fades to pale pink near 10mL
      let alpha = map(c.hcl_vol, 8.0, 10.0, 180, 0, true);
      return [255, 105, 180, alpha]; 
    } else {
      return [240, 240, 255, 100]; // Colorless
    }
  }

  // 3. Stage 2: Methyl Orange (Yellow -> Orange/Red)
  if (c.mo_drops > 0) {
    if (c.hcl_vol < 25.0) {
      return [255, 220, 0, 180]; // Golden Yellow
    } else if (c.hcl_vol >= 25.0 && c.hcl_vol < 25.5) {
      return [255, 140, 0, 200]; // Orange (End point)
    } else {
      return [220, 50, 0, 220]; // Red (Overshot)
    }
  }

  return baseColor;
}

function handleIndicatorDrops() {
  const flask = Object.values(vessels).find(v => v.type === 'conical_flask');
  if (!isDragging || !flask) return;

  // Check if dragging Phenolphthalein or Methyl Orange bottle
  if (isDragging.chemicalId === 'phenolphthalein' || isDragging.chemicalId === 'methyl_orange') {
    if (near(isDragging, flask, 60) && mouseIsPressed && frameCount % 30 === 0) {
      
      // Add a visual drop particle
      createParticles(isDragging.x, isDragging.y + 30, 1, 'drip');
      
      // Update state
      if (isDragging.chemicalId === 'phenolphthalein') flask.contents.pp_drops++;
      if (isDragging.chemicalId === 'methyl_orange') flask.contents.mo_drops++;
      
      console.log("Drops added to flask");
    }
  }
}

// ======================================================
// PROXIMITY & GLOW SYSTEM
// ======================================================
function proximityCheck() {
  Object.values(vessels).forEach(v => {
    v.glow = 0;
    v.hint = '';
    
    if (v.type === 'pipette') {
      const bottle = Object.values(vessels).find(b => b.type === 'bottle');
      const beaker = Object.values(vessels).find(b => b.type === 'beaker');
      
      if (bottle && near(v, bottle, 50)) {
        v.glow = 1;
        v.hint = 'SHIFT = Suck';
      } else if (beaker && near(v, beaker, 50)) {
        v.glow = 1;
        v.hint = 'SHIFT = Pour';
      }
    }
    
    if (v.type === 'pH_meter') {
      const beaker = Object.values(vessels).find(b => b.type === 'beaker');
      if (beaker && near(v, beaker, 50)) {
        v.glow = 1;
        v.hint = 'Hover to read pH';
      }
    }
  });
}

function instrumentReadings() {
  const balance = Object.values(vessels).find(v => v.type === 'balance');
  if (!balance) return;

  let totalPhysicalWeight = 0;
  Object.values(vessels).forEach(v => {
    if (v.id === balance.id) return;
    
    // Check if on pan
    const onPan = dist(v.x, v.y, balance.x, balance.y - balance.h * 0.4) < 40;
    v.isOnBalance = onPan; // Flag to hide labels later

    if (onPan) {
      const tares = { beaker: 45.5, pipette: 15.0, bottle: 80.0, crucible: 25.0 };
      totalPhysicalWeight += (tares[v.type] || 30.0) + (v.volume || 0);
    }
  });

  balance.rawWeight = totalPhysicalWeight;
  let targetWeight = max(0, balance.rawWeight - (balance.tareOffset || 0));

  // --- ANALYTICAL STABILIZATION LOGIC ---
  if (balance.displayWeight === undefined) balance.displayWeight = 0;
  
  // Smoothly glide toward the target weight
  balance.displayWeight = lerp(balance.displayWeight, targetWeight, 0.1);

  
}

function drawBalanceDisplay(v) {
  push();
  const lcdX = -v.w * 0.25;
  const lcdY = v.h * 0.01; 

  fill(0);
  textAlign(RIGHT, CENTER);
  textSize(v.h * 0.10);
  
  // Make sure you don't have a variable named 'text' here
  let displayVal = nf(v.displayWeight || 0, 1, 3) + "g";
  text(displayVal, lcdX + v.w * 0.38, lcdY + v.h * 0.1);
  pop();
}


// ======================================================
// PHYSICS & SURFACE SNAPPING
// ======================================================
function applyLabPhysics(v) {
  if (v.type === 'funnel' && v.isAttachedTo) {
    const parent = vessels[v.isAttachedTo];
    if (parent) {
      v.x = parent.x;
      v.y = parent.y - (parent.h * 0.46);
      v.vy = 0; // Disable gravity for attached items
      return; 
    } else {
      v.isAttachedTo = null; // Parent was deleted
    }
  }
  if (v.dragging) return;

  // 1. Check Balance Snapping
  const balance = Object.values(vessels).find(b => b.type === 'balance');
  let snappedToBalance = false;

  if (balance && v.id !== balance.id && !isNaN(balance.x) && 
      dist(v.x, v.y, balance.x, balance.y - balance.h * 0.4) < 60) {
    
    v.x = lerp(v.x, balance.x, 0.2); 
    v.y = lerp(v.y, balance.y - balance.h * 0.45, 0.2); 
    v.vy = 0;
    v.surface = null; 
    snappedToBalance = true;
    v.isOnBalance = true; // NEW: Set this flag to hide labels
  } else {
    v.isOnBalance = false; // NEW: Reset flag when moved away
  }

  if (snappedToBalance) return;

  // 2. Standard Gravity and Surface logic
  const gravity = 1.2;
  v.vy += gravity;
  v.y += v.vy;

  let closestSurface = null;
  let minDist = Infinity;
  
  if (labSurfaces) {
    Object.values(labSurfaces).forEach(surf => {
      const d = abs(v.y - surf.y);
      if (d < minDist) { minDist = d; closestSurface = surf; }
    });
  }

  if (closestSurface && v.y >= closestSurface.y - 10) {
    v.y = closestSurface.y;
    v.vy = 0;
    v.surface = closestSurface;
    
    // Auto-arrangement logic
    const spacing = v.w * 1.3;
    const neighbors = Object.values(vessels).filter(other => 
      other !== v && other.surface === closestSurface && abs(other.y - v.y) < 15
    );
    
    neighbors.forEach(n => {
      const dx = v.x - n.x;
      const overlap = spacing - abs(dx);
      if (overlap > 0 && !isNaN(dx)) {
        v.x += (dx > 0 ? overlap * 0.1 : -overlap * 0.1);
      }
    });
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

  const pipette = isDragging;
  const bottle = Object.values(vessels).find(v => v.type === 'bottle' && v.volume > 0 && near(pipette, v, 60));
  // Find receiver (beaker or conical flask)
  const receiver = Object.values(vessels).find(v => (v.type === 'beaker' || v.type === 'conical_flask') && near(pipette, v, 60));

  if (bottle && keyIsDown(SHIFT)) {
    const step = 0.8;
    if (bottle.volume >= step && pipetteTargetVol < pipette.capacity) {
      bottle.volume -= step;
      pipetteTargetVol += step;
      
      pipette.color = bottle.color;
      pipette.chemicalId = bottle.chemicalId;
      pipette.chem = bottle.chem;
    }
  }
  
  if (receiver && keyIsDown(SHIFT)) {
    const step = 0.8;
    if (pipetteTargetVol >= step && receiver.volume < receiver.capacity) {
      pipetteTargetVol -= step;
      receiver.volume += step;
      
      // --- PHASE 1 FIX: TRANSFER CHEMICAL TO THE BRAIN ---
      if (pipette.chemicalId === 'na2co3_nahco3') {
          receiver.contents.mixture_vol += step;
      }
      // --------------------------------------------------

      receiver.color = pipette.color;
      receiver.chemicalId = pipette.chemicalId;
      receiver.chem = pipette.chem;

      let tipX = pipette.x;
      let tipY = pipette.y + (pipette.h * 0.4);
      drawPouringStream(tipX, tipY, receiver.x, receiver.y - 15, color(...(pipette.color || [100, 200, 255])));
    }
  }
}

function drawSnapGuides() {
  
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
    handleBuretteFilling(); // <--- ADD THIS HERE
  handleIndicatorDrops();
  instrumentReadings();

  // Draw shadows first, then vessels
  Object.values(vessels).forEach(v => drawShadow(v));
Object.values(vessels).forEach(v => {
    drawVessel(v);
    if (v.type === 'burette') drawBuretteZoom(v); // Call the zoom here
  });
  
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
function getChemicalInfo(chemicalId) {
  const catalog = [
    { id: 'na2co3_nahco3', name: 'Sodium Carbonate + Bicarbonate', formula: 'Na₂CO₃ + NaHCO₃', conc: '25%' },
    { id: 'hcl_0_1M', name: 'Hydrochloric Acid', formula: 'HCl', conc: '0.1M' },
    { id: 'phenolphthalein', name: 'Phenolphthalein', formula: 'C₂₀H₁₄O₄', conc: '' },
    { id: 'methyl_orange', name: 'Methyl Orange', formula: 'C₁₄H₁₄N₃NaO₃S', conc: '' },
    { id: 'distilled_water', name: 'Distilled Water', formula: 'H₂O', conc: '' }
  ];
  return catalog.find(c => c.id === chemicalId) || 
         { name: 'Unknown', formula: '—', conc: '' };
}

// ======================================================
// ENHANCED VESSEL DRAWING (with glow, liquid, pH color)
// ======================================================
function drawVessel(v) {
  const over = mouseX > v.x - v.w/2 && mouseX < v.x + v.w/2 &&
              mouseY > v.y - v.h/2 && mouseY < v.y + v.h/2;

  if (over && !isDragging) {
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

  // --- SPRITE RENDERING ---
  if (v.type === 'beaker') {
    image(imgBeaker, 0, 0, v.w, v.h);
    drawRealisticLiquid(v, color(100, 200, 255)); 
  } 
  else if (v.type === 'burette') {
    image(imgBurette, 0, 0, v.w, v.h);
    drawRealisticLiquid(v, v.color || color(255, 160, 100));
  }
  else if (v.type === 'pipette') {
    image(imgPipette, 0, 0, v.w, v.h);
    drawRealisticLiquid(v, color(200, 200, 200));
  }
  else if (v.type === 'bottle') {
    image(imgBottle, 0, 0, v.w, v.h);
    drawRealisticLiquid(v, v.color || color(100, 200, 255));
    
    if (v.chemicalId) {
      push(); translate(-1, 8);
      const chemInfo = getChemicalInfo(v.chemicalId);
      fill(0); textAlign(CENTER, CENTER); textStyle(BOLD);
      textSize(8); text(chemInfo.name, 0, -7);
      textSize(9); text(chemInfo.formula, 0, 5);
      if (chemInfo.conc) { textSize(7); fill(60); text(chemInfo.conc, 0, 16); }
      pop();
    }
  }
  else if (v.type === 'balance') {
    image(imgBalance, 0, 0, v.w, v.h);
    drawBalanceDisplay(v); // Integrated realistic meter
  }  
else if (v.type === 'conical_flask') {
  image(imgConical, 0, 0, v.w, v.h);
  
  // NEW: Calculate dynamic titration color
  let activeColor = getTitrationColor(v);
  drawRealisticLiquid(v, color(...activeColor)); 
} 
 else if (v.type === 'volumetric_flask') image(imgVolumetric, 0, 0, v.w, v.h);
  else if (v.type === 'funnel') image(imgFunnel, 0, 0, v.w, v.h);
  else if (v.type === 'wash_bottle') image(imgWash, 0, 0, v.w, v.h);
  else if (v.type === 'bunsen_burner') image(imgBunsen, 0, 0, v.w, v.h);
  else if (v.type === 'crucible') image(imgCrucible, 0, 0, v.w, v.h);
  else if (v.type === 'hotplate') image(imgHotplate, 0, 0, v.w, v.h);
  else if (v.type === 'liebig_condensor') image(imgLiebig, 0, 0, v.w, v.h);
  else if (v.type === 'meltingpoint_apparatus') image(imgMeltingPoint, 0, 0, v.w, v.h);
  else if (v.type === 'pH_meter') image(imgPHMeter, 0, 0, v.w, v.h);
  else if (v.type === 'separatory_funnel') image(imgSepFunnel, 0, 0, v.w, v.h);
  else if (v.type === 'TLC_plate') image(imgTLC, 0, 0, v.w, v.h);
  else {
    fill(200, 200, 220); stroke(100); strokeWeight(2);
    rect(-v.w/2, -v.h/2, v.w, v.h, 8);
    fill(0); textAlign(CENTER, CENTER); textSize(12); text(v.type, 0, 0);
  }

  drawingContext.shadowBlur = 0;
  drawingContext.shadowColor = 'transparent';

  // --- LABEL LOGIC: Hide if it's a bottle, the balance, or an item ON the balance ---
  const shouldHideLabel = v.type === 'bottle' || v.type === 'balance' || v.isOnBalance;

  if (!shouldHideLabel) {
    textAlign(CENTER);
    textSize(11); fill(30);
    text(v.title || v.type, 0, v.h/2 + 15);
    textSize(10);
    text(v.chem || 'Empty', 0, v.h/2 + 28);
  }

  // --- INSTRUMENT OVERLAYS ---
  if (v.type === 'pH_meter' && v.reading) {
    drawDigitalDisplay(20, -30, `pH: ${nf(v.reading, 1, 2)}`);
  }
  // Note: The green balance display was removed from here to fix the duplication issue.

  if (v.hint) {
    fill(0, 255, 0, 200); textSize(10); textAlign(CENTER);
    text(v.hint, 0, -v.h/2 - 10);
  }

  pop();
}

function drawPouringStream(startX, startY, endX, endY, col) {
  push();
  const r = red(col), g = green(col), b = blue(col);
  
  // Outer Glow
  stroke(r, g, b, 100);
  strokeWeight(6);
  noFill();
  
  // Use a Bezier curve for a gravity-affected stream
  beginShape();
  vertex(startX, startY);
  // Control points create the "arc" of the pour
  bezierVertex(startX, startY + 40, endX, endY - 40, endX, endY);
  endShape();
  
  // Inner Core
  stroke(r, g, b, 220);
  strokeWeight(2.5);
  beginShape();
  vertex(startX, startY);
  bezierVertex(startX, startY + 40, endX, endY - 40, endX, endY);
  endShape();
  
  // Splash particles at the impact point
  if (frameCount % 2 === 0) {
    createParticles(endX, endY, 2, 'drip');
  }
  pop();
}

// APPARATUS-SPECIFIC REALISTIC LIQUIDS
function drawRealisticLiquid(v, col) {
  // Use the vessel's assigned color if it exists, otherwise use the passed default
  let activeCol = v.color ? color(...v.color) : col;
  if (v.volume <= 0.01) return;
  
  applySloshPhysics(v);
  
  push();
  const fillRatio = constrain(v.volume / v.capacity, 0, 1);
  const r = red(activeCol), g = green(activeCol), b = blue(activeCol);
  const slosh = (v.w * 0.4) * v.tilt;

  if (v.type === 'beaker') {
    const w = v.w * 0.75; 
    const hMax = v.h * 0.70;
    const bottomY = v.h * 0.44; 
    const topY = bottomY - (hMax * fillRatio);

    fill(r, g, b, 180);
    noStroke();
    beginShape();
    vertex(-w/2, bottomY); 
    vertex(w/2, bottomY);  
    vertex(w/2, topY - slosh); 
    bezierVertex(w/4, topY - slosh + 5, -w/4, topY + slosh + 5, -w/2, topY + slosh);
    endShape(CLOSE);
    
    // Meniscus Highlight
    stroke(255, 255, 255, 100); strokeWeight(1); noFill();
    arc(0, topY, w, 6 + abs(slosh), PI, 0);

  } else if (v.type === 'pipette') {
    // Liquid mechanics for Pipette neck
    const w = v.w * 0.105; 
    const tipY = v.h * 0.40; 
    const neckHeight = v.h * 0.85;
    const topY = tipY - (neckHeight * fillRatio);

    fill(r, g, b, 220); // More opaque for thin tube
    noStroke();
    rect(-w/2, topY, w, tipY - topY, 1);
    
    // Tiny meniscus for the pipette
    fill(r, g, b, 255);
    ellipse(0, topY, w, 3);

  } else if (v.type === 'bottle' || v.type === 'chemical_bottle') {
    const w = v.w * 0.72; 
    const hMax = v.h * 0.50;
    const bottomY = v.h * 0.42; 
    const topY = bottomY - (hMax * fillRatio);

    fill(r, g, b, 150);
    noStroke();
    beginShape();
    vertex(-w/2, bottomY);
    vertex(w/2, bottomY);
    vertex(w/2, topY - slosh);
    bezierVertex(0, topY + 4, -w/4, topY + 4, -w/2, topY + slosh);
    endShape(CLOSE);
  }
  else if (v.type === 'burette') {
    // Burettes are very narrow tubes
    const w = v.w * 0.12; 
    const bottomY = v.h * 0.38; // Bottom of the glass tube before the stopcock
    const hMax = v.h * 0.75;    // Total height of the graduated part
    
    const fillRatio = v.volume / v.capacity;
    const topY = bottomY - (hMax * fillRatio);

    // Liquid Color (HCl is usually clear, but we give it a slight tint for the UI)
    fill(255, 120, 80, 180); 
    noStroke();
    
    // Draw the column of liquid
    rect(-w/2, topY, w, bottomY - topY);
    
    // Meniscus (The curve at the top)
    fill(255, 120, 80, 255);
    ellipse(0, topY, w, 4);

    // Highlight for glass effect
    stroke(255, 100); strokeWeight(1);
    line(-w/4, topY + 5, -w/4, bottomY - 5);
  }
  pop();
}


function drawBeakerRealistic(v, col, fillRatio) {
  const liquidTop = -25 + (70 * (1 - fillRatio));  // BOTTOM UP!
  
  // 1. MAIN LIQUID (clipped to beaker shape)
  drawingContext.save();
  drawingContext.clip();  // Use vessel image as mask
  
  fill(red(col), green(col), blue(col), 220);
  noStroke();
  // Perfect cylindrical fill - BOTTOM UP
  rect(-v.w*0.28, liquidTop, v.w*0.56, 70, v.w*0.22);
  
  drawingContext.restore();
  
  // 2. MENISCUS CURVE (highlight)
  fill(red(col), green(col), blue(col), 240);
  arc(0, liquidTop, v.w*0.48, v.w*0.48 + 6, PI, 0);
}


function drawBuretteRealistic(v, col, fillRatio) {
  const tubeHeight = 180 * fillRatio;
  const tubeTop = -110 + (180 - tubeHeight);  // DROPS FROM TOP
  
  drawingContext.save();
  // Narrow tube mask (center 15% width)
  rect(-v.w*0.075, tubeTop, v.w*0.15, tubeHeight);
  drawingContext.clip();
  
  fill(red(col), green(col), blue(col), 230);
  rect(-v.w*0.075, tubeTop, v.w*0.15, tubeHeight);
  drawingContext.restore();
  
  // Meniscus
  fill(red(col), green(col), blue(col), 255);
  arc(0, tubeTop, v.w*0.2, v.w*0.2 + 3, PI, 0);
}


function drawBottleRealistic(v, col, fillRatio) {
  const liquidHeight = 55 * fillRatio;
  const liquidTop = 35 + (55 - liquidHeight);  // BOTTOM UP
  
  // Curved base liquid
  fill(red(col), green(col), blue(col), 200);
  noStroke();
  rect(-v.w*0.22, liquidTop, v.w*0.44, liquidHeight, 
       v.w*0.18, v.w*0.18, 0, v.w*0.18);
  
  // Shine highlight
  fill(255, 255, 255, 80);
  arc(-v.w*0.12, liquidTop + 8, v.w*0.15, v.w*0.15, 0, PI);
}


function drawGenericLiquid(v, col, fillRatio) {
  // Fallback for other vessels
  const h = 60 * fillRatio;
  fill(red(col), green(col), blue(col), 180);
  rect(-v.w*0.3, 20, v.w*0.6, h, v.w*0.2);
}


function drawDigitalDisplay(x, y, label) { // Change 'text' to 'label' here
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
  // This now correctly calls the p5.js text() function
  text(label, x, y); 
}

// ======================================================
// TOOLTIP
// ======================================================
function drawTooltip(v) {
  const boxW = 260, boxH = 140;  // Taller for more info
  const x = constrain(mouseX + 15, 10, width - boxW - 10);
  const y = constrain(mouseY + 15, 10, height - boxH - 10);

  fill(255, 255, 255, 240); stroke(180);
  rect(x, y, boxW, boxH, 8);
  
  noStroke(); fill(0); textAlign(LEFT);
  textSize(14); textStyle(BOLD); 
  text(v.title, x + 12, y + 22);
  
  textSize(12); textStyle(NORMAL);

  // CHEMICAL INFO SECTION (enhanced!)
  if (v.chemicalId) {
    const chemInfo = getChemicalInfo(v.chemicalId);
    
    // Color indicator
    if (v.color) {
      fill(...v.color); noStroke(); 
      rect(x + 12, y + 38, 14, 14);
      fill(0); 
    }
    
    // Full chemical details
    textSize(11);
    text(`${chemInfo.name}`, x + 32, y + 42);
    textSize(10); fill(60);
    text(`Formula: ${chemInfo.formula}`, x + 12, y + 58);
    
    if (chemInfo.conc) {
      text(`Concentration: ${chemInfo.conc}`, x + 12, y + 72);
    }
  } else {
    textSize(12);
    text('Chemical: ' + v.chem, x + 12, y + 42);
  }

  // Volume & other info
  textSize(12); fill(0);
  text('Volume: ' + nf(v.volume || 0, 1, 2) + ' mL', x + 12, y + 92);
  
  if (v.capacity) {
    text(`Capacity: ${v.capacity} mL`, x + 12, y + 108);
  }
  
  if (v.hint) {
    fill(0, 150, 0); textSize(11);
    text('💡 ' + v.hint, x + 12, y + 126);
  }
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
  text('↑ / ↓  = Tilt Bottle (Fill)', x + 15, y + 50);
  text('SPACE  = Titrate (Flask)', x + 15, y + 70);
  text('S Key  = Drain (Zeroing)', x + 15, y + 90);
  text('D Key  = Add Indicator Drop', x + 15, y + 110);
}

function drawCatalogPanel() {
  const panelX = 20, panelY = 30, panelW = 340, panelH = height - 80;
  catalogPanelBounds = { x: panelX, y: panelY, w: panelW, h: panelH };

  fill(255, 255, 255, 235); stroke(170);
  rect(panelX, panelY, panelW, panelH, 10);

  // TABS
  const tabW = 170, tabH = 35, tabY = panelY + 10;
  const tabs = [
    { id: 'apparatus', label: '🧪 APPARATUS', active: currentCatalogTab === 'apparatus' },
    { id: 'chemicals', label: '🧴 CHEMICALS (5)', active: currentCatalogTab === 'chemicals' }
  ];
  
  tabs.forEach((tab, i) => {
    fill(tab.active ? [100, 180, 255] : [240, 240, 240]);
    stroke(tab.active ? [0, 120, 200] : 170);
    strokeWeight(tab.active ? 3 : 1);
    rect(panelX + i * tabW, tabY, tabW, tabH, 6);
    
    fill(tab.active ? 0 : 100); noStroke();
    textAlign(CENTER, CENTER); textSize(13);
    text(tab.label, panelX + i * tabW + tabW/2, tabY + tabH/2);
  });

  // Active catalog content
  const innerX = panelX + 20, innerY = panelY + 55;
  const activeCatalog = currentCatalogTab === 'apparatus' ? apparatusCatalog : chemicalCatalog;
  activeCatalog.drawPanel(innerX, innerY, 300, height - 140);
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

  // TAB SWITCHING
  if (catalogVisible && catalogPanelBounds &&
      mouseY > catalogPanelBounds.y + 10 && mouseY < catalogPanelBounds.y + 45 &&
      mouseX > catalogPanelBounds.x && mouseX < catalogPanelBounds.x + 340) {
    currentCatalogTab = mouseX < catalogPanelBounds.x + 170 ? 'apparatus' : 'chemicals';
    return;
  }

  // CATALOG CLICK
  if (catalogVisible && catalogPanelBounds &&
      mouseX > catalogPanelBounds.x && mouseX < catalogPanelBounds.x + catalogPanelBounds.w &&
      mouseY > catalogPanelBounds.y + 55 && mouseY < catalogPanelBounds.y + catalogPanelBounds.h) {
    
    const localX = mouseX - catalogPanelBounds.x - 20;
    const localY = mouseY - (catalogPanelBounds.y + 55);
    const item = (currentCatalogTab === 'apparatus' ? apparatusCatalog : chemicalCatalog)
                .handleClick(localX, localY);
    
    if (item) {
      if (currentCatalogTab === 'apparatus') {
        spawnApparatusFromCatalog(item);
      } else {
        spawnChemicalBottle(item);
      }
      return;
    }
  }

  Object.values(vessels).forEach(v => {
    if (v.type === 'balance') {
      // Check if mouse is over the "TARE" button area (bottom right of the control panel)
      const isOverTare = mouseX > v.x + v.w * 0.1 && mouseX < v.x + v.w * 0.4 &&
                         mouseY > v.y + v.h * 0.1 && mouseY < v.y + v.h * 0.4;
      
      if (isOverTare) {
        // Taring: Set the offset to the current raw weight
        v.tareOffset = v.rawWeight;
        console.log("Balance Tared to:", v.tareOffset);
      }
    }
  });
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
    // --- FUNNEL SNAPPING LOGIC ---
    if (isDragging.type === 'funnel') {
      const burette = Object.values(vessels).find(v => v.type === 'burette');
      if (burette) {
        // Calculate the exact top of the burette glass
        const buretteTopX = burette.x;
        const buretteTopY = burette.y - (burette.h * 0.46); // Adjusted for sprite height
        
        if (dist(isDragging.x, isDragging.y, buretteTopX, buretteTopY) < 40) {
          // Snap funnel to burette
          isDragging.x = buretteTopX;
          isDragging.y = buretteTopY;
          isDragging.isAttachedTo = burette.id; // Record the connection
          burette.hasFunnel = true;            // Mark burette as ready to fill
          console.log("Funnel Snapped to Burette!");
        } else {
          isDragging.isAttachedTo = null;
          burette.hasFunnel = false;
        }
      }
    }
    
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
  const keyL = key.toLowerCase();

  // 1. REMOVE APPARATUS
  if (keyL === 'r' && hoverVessel) {
    delete vessels[hoverVessel.id];
    hoverVessel = null;
    return;
  }

  // 2. TARE BALANCE
  if (keyL === 't') {
    const balance = Object.values(vessels).find(v => v.type === 'balance');
    if (balance) balance.tareOffset = balance.rawWeight;
  }

  // 3. HEAT TOGGLE
  if (keyL === 'h') {
    const hotplate = Object.values(vessels).find(v => v.type === 'hotplate');
    if (hotplate) hotplate.heating = !hotplate.heating;
  }

  // 4. ADD INDICATOR DROP (Crucial for Phase 1 Testing)
  // Logic: If you are dragging an indicator bottle over a flask/beaker, press 'D' to add a drop.
  if (keyL === 'd' && isDragging) {
    const target = Object.values(vessels).find(v => 
      (v.type === 'conical_flask' || v.type === 'beaker') && near(isDragging, v, 60)
    );
    
    if (target) {
      if (isDragging.chemicalId === 'phenolphthalein') {
        target.contents.pp_drops++;
        createParticles(isDragging.x, isDragging.y + 20, 2, 'drip');
        console.log("PP drops in flask:", target.contents.pp_drops);
      } else if (isDragging.chemicalId === 'methyl_orange') {
        target.contents.mo_drops++;
        createParticles(isDragging.x, isDragging.y + 20, 2, 'drip');
        console.log("MO drops in flask:", target.contents.mo_drops);
      }
    }
  }
// Inside keyPressed()
if (key.toLowerCase() === 's') {
  const burette = Object.values(vessels).find(v => v.type === 'burette');
  // Check if any beaker is under the burette to catch waste
  const wasteBeaker = Object.values(vessels).find(v => 
    v.type === 'beaker' && dist(v.x, v.y, burette.x, burette.y + 150) < 60
  );

  if (burette && wasteBeaker) {
    // Small drainage for precision zeroing
    const drainAmount = 0.02; 
    if (burette.volume > 0) {
       burette.volume -= drainAmount;
       wasteBeaker.volume += drainAmount;
       createParticles(burette.x, burette.y + 120, 1, 'drip');
    }
  } else if (burette && !wasteBeaker) {
     // Penalty logic: If they drain without a beaker, they spill on the table!
     burette.volume -= 0.02;
     createParticles(burette.x, burette.y + 120, 1, 'drip');
     console.log("⚠️ Spilling on table! Use a waste beaker.");
  }
}
  if (key.toLowerCase() === 's') {
  const burette = Object.values(vessels).find(v => v.type === 'burette');
  const wasteBeaker = Object.values(vessels).find(v => v.type === 'beaker' && dist(v.x, v.y, burette.x, burette.y + 150) < 50);

  if (burette && wasteBeaker) {
    const drainRate = 0.05; // Slow drainage for precision
    if (burette.volume > 0) {
      burette.volume -= drainRate;
      wasteBeaker.volume += drainRate;
      
      // Visual Drip
      createParticles(burette.x, burette.y + 120, 1, 'drip');
      console.log("Draining... Current Vol:", burette.volume);
    }
  }
}
  // 5. TITRATION (SPACE BAR)
  // Note: In p5.js, keyPressed only fires ONCE per press. 
  // For continuous titration, the logic below is better placed in the draw() loop 
  // using keyIsDown(32), but here is the corrected logic for Phase 1:
  if (key === ' ' || keyCode === 32) {
    const burette = Object.values(vessels).find(v => v.type === 'burette');
    // Find EITHER a beaker OR a conical flask under the burette
    const receiver = Object.values(vessels).find(v => 
      (v.type === 'beaker' || v.type === 'conical_flask') && 
      dist(v.x, v.y, burette.x - 45, burette.y + 120) < 80
    );

    if (burette && receiver) {
      const flow = keyIsDown(SHIFT) ? 0.6 : 0.15;
      
      if (burette.volume >= flow && receiver.volume < receiver.capacity) {
        // --- UPDATING VISUALS ---
        buretteTargetVol -= flow;
        receiver.volume += flow; // Update the receiver's local volume
        studentVolume += flow;

        // --- PHASE 1: UPDATING THE CHEMICAL BRAIN ---
        receiver.contents.hcl_vol += flow; 
        
        // Visual feedback
        drawPouringStream(
          burette.x - 45, burette.y + 110, 
          receiver.x, receiver.y - 15, 
          color(255, 160, 100)
        );
      }
    }
  }
}
function handleBuretteFilling() {
  if (!isDragging || isDragging.type !== 'bottle') return;
  
  const burette = Object.values(vessels).find(v => v.type === 'burette');
  if (!burette) return;

  const buretteTopY = burette.y - (burette.h * 0.45);
  const distance = dist(mouseX, mouseY, burette.x, buretteTopY);

  if (distance < 70) {
    if (!burette.hasFunnel) {
      isDragging.hint = "⚠️ Need Funnel on top!";
      return;
    }

    // --- LAPTOP FRIENDLY CONTROLS ---
    isDragging.hint = "Arrows ↑/↓ to Tilt & Pour";

    // Initialize tiltAngle if not exists
    if (isDragging.tiltAngle === undefined) isDragging.tiltAngle = 0;

    // Use Arrow Keys for smooth, precise tilting
    if (keyIsDown(UP_ARROW)) {
      isDragging.tiltAngle = constrain(isDragging.tiltAngle + 2, 0, 90);
    } else if (keyIsDown(DOWN_ARROW)) {
      isDragging.tiltAngle = constrain(isDragging.tiltAngle - 2, 0, 0);
    }
    // Return to upright position slowly if no key is pressed
    if (!keyIsDown(UP_ARROW) && !keyIsDown(DOWN_ARROW)) {
       isDragging.tiltAngle = lerp(isDragging.tiltAngle, 0, 0.1);
    }

    // Calculate Flow based on the tilt angle
    // (Flow starts at 25 degrees, max at 90)
    let flowRate = map(isDragging.tiltAngle, 25, 90, 0, 0.8, true);
    
    if (flowRate > 0 && isDragging.volume > 0) {
      if (burette.volume < burette.capacity) {
        let actualFlow = flowRate * (deltaTime / 25); 
        burette.volume += actualFlow;
        isDragging.volume -= actualFlow;
        
        // Visual stream
        drawPouringStream(isDragging.x, isDragging.y + 10, burette.x, buretteTopY - 10, color(255, 120, 80));
      } else {
        isDragging.hint = "⚠️ BURETTE FULL / OVERFLOW!";
      }
    }
  }
}

// Add this to your global window events to control tilt
function mouseWheel(event) {
  if (isDragging && isDragging.type === 'bottle') {
    isDragging.tiltAngle = constrain((isDragging.tiltAngle || 0) - event.delta * 0.1, 0, 90);
    return false; // prevent page scroll
  }
}

function drawBuretteZoom(v) {
  const zoomX = width - 250;
  const zoomY = 150;
  const zoomSize = 180;

  // Only show if bottle or meniscus is near the top
  const isNearTop = v.volume > v.capacity - 5;
  if (!isNearTop && !isDragging) return;

  push();
  // Draw Zoom Circular Frame
  fill(255); stroke(0); strokeWeight(3);
  circle(zoomX, zoomY, zoomSize);
  clip(() => { circle(zoomX, zoomY, zoomSize); }); // p5.js masking

  // Draw Magnified Burette
  translate(zoomX, zoomY + 300); // Center the top of the burette
  scale(5); // 5x Magnification
  
  // Re-draw the tube and the graduation lines
  noFill(); stroke(100, 150); strokeWeight(0.5);
  rect(-10, -100, 20, 150);
  
  // Draw Graduation Lines (The tricky part!)
  for(let i=0; i <= 50; i++) {
    let lineY = -100 + (i * 10);
    line(-10, lineY, (i % 5 === 0 ? 5 : 0), lineY);
    if(i % 10 === 0) {
       fill(0); textSize(4); noStroke();
       text(i/10, 8, lineY + 2);
    }
  }

  // Draw the rising liquid in high detail
  let fillRatio = v.volume / v.capacity;
  let liquidTop = 50 - (150 * fillRatio);
  fill(255, 120, 80, 150); noStroke();
  rect(-10, liquidTop, 20, 100);
  
  // The Meniscus Curve
  fill(255, 120, 80);
  arc(0, liquidTop, 20, 5, PI, 0);

  pop();
  
  // Zoom Label
  fill(0); noStroke(); textAlign(CENTER); textSize(12);
  text("PRECISION VIEW (0-5 mL)", zoomX, zoomY + zoomSize/2 + 20);
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
    const cap = askCapacity('burette') || 50;
    const spawnPos = { x: currentPositions.burette_stand.x, y: currentPositions.burette_stand.y };
    const size = currentPositions.sizes.burette;
    
    // START AT 0 VOLUME for Phase 1 realism
    v = makeVessel(nextId('burette'), spawnPos.x, spawnPos.y, size.w, size.h,
      `${cap} mL Burette`, 'Empty', 'burette', 0, cap);
      
    buretteTargetVol = 0; // Target is now 0
    v.contents.hcl_vol = 0;
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
    v.tareOffset = 0;   // Explicitly initialize
    v.rawWeight = 0;    // Explicitly initialize
    v.displayWeight = 0; // Explicitly initialize
    v.mass = 0;         // For backwards compatibility
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
function spawnChemicalBottle(chem) {
  const bottle = makeResponsiveVessel(nextId('chemical_bottle'), 'bottle');
  if (!bottle) return;
  
  bottle.chem = chem.label;
  bottle.chemicalId = chem.id;
  bottle.color = chem.color;
  bottle.volume = 100;
  bottle.capacity = 250;
  bottle.isChemical = true;
  
 switch(chem.id) {
    case 'na2co3_nahco3': bottle.title = '25% Carbonate Mixture'; break;
    case 'hcl_0_1M': bottle.title = '0.1M HCl (Titration)'; break;
    case 'phenolphthalein': bottle.title = 'Phenolphthalein'; break;
    case 'methyl_orange': bottle.title = 'Methyl Orange'; break;
    default: bottle.title = chem.label;
  }
  
  vessels[bottle.id] = bottle;
  console.log(`Spawned: ${bottle.title}`);
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
