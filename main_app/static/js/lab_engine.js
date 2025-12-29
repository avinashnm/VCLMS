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

// ======================================================
// LAB SURFACES (continuous surfaces)
// ======================================================
const LAB_SURFACES = {
  shelf: { y: 360, minX: 250, maxX: 650, shadowAlpha: 30 },
  table: { y: 460, minX: 200, maxX: 820, shadowAlpha: 45 }
};

// ======================================================
// LAB ZONES (for snapping / titration area)
// ======================================================
const LAB_ZONES = {
  shelf: {
    slots: [
      { x: 280, y: 360, type: 'small', occupants: 0, max: 1, color: [0,150,0], radius: 28 },
      { x: 340, y: 360, type: 'small', occupants: 0, max: 1, color: [255,200,0], radius: 28 },
      { x: 410, y: 360, type: 'small', occupants: 0, max: 1, color: [0,150,0], radius: 28 },
      { x: 470, y: 360, type: 'small', occupants: 0, max: 1, color: [255,200,0], radius: 28 },
      { x: 530, y: 360, type: 'small', occupants: 0, max: 1, color: [0,150,0], radius: 28 },
      { x: 300, y: 410, type: 'small', occupants: 0, max: 1, color: [255,200,0], radius: 28 },
      { x: 370, y: 410, type: 'small', occupants: 0, max: 1, color: [0,150,0], radius: 28 },
      { x: 440, y: 410, type: 'small', occupants: 0, max: 1, color: [255,200,0], radius: 28 },
      { x: 510, y: 410, type: 'small', occupants: 0, max: 1, color: [0,150,0], radius: 28 }
    ]
  },
  table: {
    slots: [
      { x: 220, y: 460, type: 'big', occupants: 0, max: 1, color: [100,100,200], radius: 35 },
      { x: 290, y: 460, type: 'big', occupants: 0, max: 1, color: [200,100,200], radius: 35 },
      { x: 360, y: 460, type: 'big', occupants: 0, max: 1, color: [100,100,200], radius: 35 },
      { x: 430, y: 460, type: 'big', occupants: 0, max: 1, color: [200,100,200], radius: 35 },
      { x: 500, y: 460, type: 'big', occupants: 0, max: 1, color: [100,100,200], radius: 35 },
      { x: 240, y: 500, type: 'big', occupants: 0, max: 1, color: [200,100,200], radius: 35 },
      { x: 320, y: 500, type: 'big', occupants: 0, max: 1, color: [100,100,200], radius: 35 },
      { x: 400, y: 500, type: 'big', occupants: 0, max: 1, color: [200,100,200], radius: 35 },
      { x: 480, y: 500, type: 'big', occupants: 0, max: 1, color: [100,100,200], radius: 35 },
      { x: 540, y: 445, type: 'titration', occupants: 0, max: 1, color: [255,50,50], radius: 40 }
    ]
  }
};


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
// ======================================================
// RESPONSIVE POSITIONS (with size multiplier)
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

  updateResponsivePositions();

  catalog = new LabCatalog({
    visible_apparatus: [
      'beaker', 'conical_flask', 'volumetric_flask',
      'pipette', 'burette', 'bottle',
      'balance', 'crucible', 'hotplate', 'liebig_condensor', 
    'meltingpoint_apparatus', 'pH_meter', 'separatory_funnel', 'TLC_plate',
      'funnel', 'wash_bottle', 'bunsen_burner'
    ],
      scale: 0.75  // Match sizeMultiplier

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

  updateResponsivePositions();

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
// HELPERS (capacity & chemical selection)
// ======================================================
function askCapacity(type) {
  const options = {
    beaker: [50, 100, 250, 500],
    pipette: [10, 25],
    burette: [25, 50],
    volumetric_flask: [100, 250, 500]
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
// SMART SPAWN & COLLISION AROUND ZONES
// ======================================================
function smartSpawnPosition(type) {
  const scaleX = width / 1200;
  const scaleY = height / 700;
  const isBig = BIG_APPARATUS.includes(type);
  const spawnArea = isBig ? LAB_ZONES.table : LAB_ZONES.shelf;

  // Find first empty slot
  const emptySlot = spawnArea.slots.find(slot => slot.occupants === 0);
  if (emptySlot) {
    emptySlot.occupants++;
    return { x: emptySlot.x * scaleX, y: emptySlot.y * scaleY };
  }

  // Fallback: find collision-free position near spawn area
  const centerX = spawnArea === LAB_ZONES.table ? 380 * scaleX : 430 * scaleX;
  const centerY = spawnArea === LAB_ZONES.table ? 460 * scaleY : 385 * scaleY;
  return findCollisionFreePosition(centerX, centerY, type);
}

function findCollisionFreePosition(targetX, targetY, type) {
  let attempts = 0;
  while (attempts < 20) {
    let testX = targetX + (random(-1, 1) * 80);
    let testY = targetY + (random(-1, 1) * 60);

    let collision = false;
    Object.values(vessels).forEach(other => {
      if (dist(testX, testY, other.x, other.y) < 60) {
        collision = true;
      }
    });

    if (!collision) return { x: testX, y: testY };
    attempts++;
  }
  return { x: targetX, y: targetY };
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
    vx: 0, vy: 0
  };
}

function makeResponsiveVessel(id, type) {
  if (!currentPositions) return null;
  const spawnPos = smartSpawnPosition(type);
  const size = currentPositions.sizes[type] || currentPositions.sizes.beaker;
  return makeVessel(id, spawnPos.x, spawnPos.y, size.w, size.h, type, 'Empty', type, 0, 100);
}

// ======================================================
// PHYSICS & SURFACE SNAPPING
// ======================================================
function applyLabPhysics(v) {
  if (v.dragging) return;

  // Gentle gravity-like settle
  const gravity = 1.2;
  v.vy += gravity;
  v.y += v.vy;

  const surf = BIG_APPARATUS.includes(v.type) ? LAB_SURFACES.table : LAB_SURFACES.shelf;

  if (v.y >= surf.y) {
    v.y = surf.y;
    v.vy = 0;
    v.surface = surf;
    v.x = constrain(v.x, surf.minX, surf.maxX);
  }

  // Optional: mild auto-snapping within zones for neat layout
  const scaleX = width / 1200;
  const scaleY = height / 700;
  let closestZone = null;
  let minDist = Infinity;

  Object.values(LAB_ZONES).forEach(area => {
    area.slots.forEach(slot => {
      // Titration zone only for beakers
      if (slot.type === 'titration' && v.type !== 'beaker') return;

      const zoneX = slot.x * scaleX;
      const zoneY = slot.y * scaleY;
      const d = dist(v.x, v.y, zoneX, zoneY);

      if (d < slot.radius * scaleX * 1.5 && slot.occupants < slot.max) {
        if (d < minDist) {
          minDist = d;
          closestZone = {
            x: zoneX,
            y: zoneY,
            strength: map(d, 0, slot.radius * scaleX, 0.25, 0.08)
          };
        }
      }
    });
  });

  if (closestZone) {
    v.x += (closestZone.x - v.x) * closestZone.strength;
    v.y += (closestZone.y - v.y) * closestZone.strength;
  }
}

// ======================================================
// SHADOW RENDERING (REALISTIC CONTACT SHADOWS)
// ======================================================
function drawShadow(v) {
  if (v.dragging || !v.surface) return;

  push();
  // Anchor the shadow to the bottom of the vessel
  translate(v.x, v.y + v.h / 2); 
  noStroke();

  // We use multiple ellipses to simulate a soft radial blur
  // 1. Ambient Occlusion (Small, dark, sharp - right at the base)
  fill(0, 60);
  ellipse(0, 0, v.w * 0.5, v.h * 0.1);

  // 2. Main Shadow (Wider, softer)
  fill(0, 30);
  ellipse(0, 2, v.w * 0.8, v.h * 0.15);

  // 3. Diffuse Glow (Very wide, very faint)
  fill(0, 10);
  ellipse(0, 4, v.w * 1.2, v.h * 0.2);

  pop();
}


// ======================================================
// EASING & LIQUID TRANSFERS
// ======================================================
function easeVolumes() {
  Object.values(vessels).forEach(v => {
    if (v.type === 'beaker') v.volume += (beakerTargetVol - v.volume) * 0.2;
    else if (v.type === 'burette') v.volume += (buretteTargetVol - v.volume) * 0.2;
    else if (v.type === 'pipette') v.volume += (pipetteTargetVol - v.volume) * 0.2;
  });
}

function handleInteraction() {
  if (!isDragging || isDragging.type !== 'pipette') return;

  const bottle = Object.values(vessels).find(v => v.type === 'bottle');
  const beaker = Object.values(vessels).find(v => v.type === 'beaker');

  if (bottle && near(isDragging, bottle, 40)) {
    const step = 0.8;
    if (bottle.volume >= step && pipetteTargetVol < isDragging.capacity) {
      bottle.volume -= step;
      pipetteTargetVol = min(isDragging.capacity, pipetteTargetVol + step);
    }
  }
  if (beaker && near(isDragging, beaker, 40)) {
    const step = 0.8;
    if (pipetteTargetVol >= step && beakerTargetVol < beaker.capacity) {
      pipetteTargetVol = max(0, pipetteTargetVol - step);
      beakerTargetVol = min(beaker.capacity, beakerTargetVol + step);
    }
  }
}

function near(a, b, radius) {
  return dist(a.x, a.y, b.x, b.y) < radius;
}

// ======================================================
// MAIN DRAW LOOP
// ======================================================
function draw() {
  imageMode(CORNER);
  image(imgLabBg, 0, 0, width, height);

  // Physics
  Object.values(vessels).forEach(v => applyLabPhysics(v));

  // Volumes & pipette interactions
  easeVolumes();
  handleInteraction();

  hoverVessel = null;

 
 // Draw vessels THEN their shadows below (perfect layering)
Object.values(vessels).forEach(v => {
  drawVessel(v);
  drawShadow(v);
});



  if (hoverVessel) drawTooltip(hoverVessel);
  if (catalogVisible) drawCatalogPanel();
  drawDataPanel();
}

// ======================================================
// VESSEL DRAWING (full visuals incl. burette liquid)
// ======================================================
function drawVessel(v) {
  const over = mouseX > v.x - v.w/2 && mouseX < v.x + v.w/2 &&
               mouseY > v.y - v.h/2 && mouseY < v.y + v.h/2;

  if (over && !isDragging) hoverVessel = v;

  // Vessel body
  push();
  translate(v.x, v.y);
  imageMode(CENTER);

  // ORIGINAL 9 APPARATUS
  if (v.type === 'beaker') image(imgBeaker, 0, 0, v.w, v.h);
  else if (v.type === 'burette') {
    image(imgBurette, 0, 0, v.w, v.h);
    // ... existing burette liquid code ...
  }
  else if (v.type === 'pipette') image(imgPipette, 0, 0, v.w, v.h);
  else if (v.type === 'bottle') {
    image(imgBottle, 0, 0, v.w, v.h);
    textAlign(CENTER, CENTER); textSize(11); fill(0);
    text(v.chem, 0, -5);
  }
  else if (v.type === 'conical_flask') image(imgConical, 0, 0, v.w, v.h);
  else if (v.type === 'volumetric_flask') image(imgVolumetric, 0, 0, v.w, v.h);
  else if (v.type === 'funnel') image(imgFunnel, 0, 0, v.w, v.h);
  else if (v.type === 'wash_bottle') image(imgWash, 0, 0, v.w, v.h);
  else if (v.type === 'bunsen_burner') image(imgBunsen, 0, 0, v.w, v.h);

  // ⭐ NEW 8 APPARATUS - ADD THESE!
  else if (v.type === 'balance') image(imgBalance, 0, 0, v.w, v.h);
  else if (v.type === 'crucible') image(imgCrucible, 0, 0, v.w, v.h);
  else if (v.type === 'hotplate') image(imgHotplate, 0, 0, v.w, v.h);
  else if (v.type === 'liebig_condensor') image(imgLiebig, 0, 0, v.w, v.h);
  else if (v.type === 'meltingpoint_apparatus') image(imgMeltingPoint, 0, 0, v.w, v.h);
  else if (v.type === 'pH_meter') image(imgPHMeter, 0, 0, v.w, v.h);
  else if (v.type === 'separatory_funnel') image(imgSepFunnel, 0, 0, v.w, v.h);
  else if (v.type === 'TLC_plate') image(imgTLC, 0, 0, v.w, v.h);

  // FALLBACK: Colored rectangle if no image
  else {
    fill(200, 200, 220);
    stroke(100);
    strokeWeight(2);
    rect(-v.w/2, -v.h/2, v.w, v.h, 8);
    fill(0); textAlign(CENTER, CENTER); textSize(12);
    text(v.type, 0, 0);
  }

  // Labels (ALL vessels)
  textAlign(CENTER);
  textSize(11); fill(30);
  text(v.title || v.type, 0, v.h/2 + 15);
  textSize(10);
  text(v.chem || 'Empty', 0, v.h/2 + 28);

  pop();
}


// ======================================================
// TOOLTIP
// ======================================================
function drawTooltip(v) {
  const boxW = 210, boxH = 70;
  const x = constrain(mouseX + 15, 10, width - boxW - 10);
  const y = constrain(mouseY + 15, 10, height - boxH - 10);

  fill(255, 255, 255, 240); stroke(180);
  rect(x, y, boxW, boxH, 8);
  noStroke(); fill(0); textAlign(LEFT);
  textSize(13); text(v.title, x + 10, y + 20);
  textSize(12);
  text('Chemical: ' + v.chem, x + 10, y + 38);
  text('Volume: ' + nf(v.volume, 1, 2) + ' mL', x + 10, y + 56);
}

// ======================================================
// UI PANELS
// ======================================================
function drawDataPanel() {
  const panelW = 220, panelH = 150, margin = 40, panelX = width - panelW - margin;

  fill(255, 255, 255, 235); stroke(210);
  rect(panelX, 30, panelW, panelH, 12);

  noStroke(); fill(0); textAlign(LEFT);
  textSize(15); textStyle(BOLD); text('Live Data', panelX + 15, 55);
  textStyle(NORMAL); textSize(13);
  text('Base added: ' + nf(studentVolume, 1, 2) + ' mL', panelX + 15, 80);

  if (studentVolume > 0) {
    const diff = abs(studentVolume - 25.0);
    if (diff < 0.25) { fill(0, 150, 0); text('Perfect endpoint ✔', panelX + 15, 105); phStage = 2; }
    else if (studentVolume > 26) { fill(200, 0, 0); text('Overshot endpoint ✖', panelX + 15, 105); phStage = 2; }
    else { fill(120, 120, 0); text('Approaching endpoint…', panelX + 15, 105); phStage = 1; }
  } else phStage = 0;

  const btnX = 40, btnY = height - 50, btnW = 200, btnH = 32;
  fill(255, 255, 255, 235); stroke(180);
  rect(btnX, btnY, btnW, btnH, 8);
  noStroke(); fill(0); textAlign(CENTER, CENTER); textSize(13);
  text(catalogVisible ? 'Hide Apparatus Catalog' : 'Show Apparatus Catalog',
       btnX + btnW/2, btnY + btnH/2);
  catalogToggleButton = { x: btnX, y: btnY, w: btnW, h: btnH };
}

// ======================================================
// CATALOG PANEL (RESPONSIVE + SCALED)
// ======================================================
function drawCatalogPanel() {
  const panelX = 20;
  const panelY = 30;
  const panelW = 320;   // ← INCREASED from 240
  const panelH = height - 80;

  catalogPanelBounds = { x: panelX, y: panelY, w: panelW, h: panelH };

  // Panel background
  fill(255, 255, 255, 235); 
  stroke(170);
  rect(panelX, panelY, panelW, panelH, 10);

  // Title
  noStroke(); 
  fill(0); 
  textAlign(LEFT);
  textSize(16);  // ← BIGGER title
  textStyle(BOLD); 
  text('Apparatus Catalog', panelX + 15, panelY + 28);

  // Catalog items (LARGER area)
  const innerX = panelX + 20;
  const innerY = panelY + 50;
  const itemW = 280;   // ← INCREASED from 210
  const itemH = 380;   // ← INCREASED from 280

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

  // Catalog click -> spawn apparatus
  // In mousePressed() - update localY calculation:
// In mousePressed() - bigger panel detection
if (catalogVisible && catalogPanelBounds &&
    mouseX > catalogPanelBounds.x && mouseX < catalogPanelBounds.x + catalogPanelBounds.w &&
    mouseY > catalogPanelBounds.y && mouseY < catalogPanelBounds.y + catalogPanelBounds.h) {
  const localX = mouseX - catalogPanelBounds.x;
  const localY = mouseY - (catalogPanelBounds.y + 50);  // Match new innerY
  const item = catalog.handleClick(localX, localY);
  if (item) {
    spawnApparatusFromCatalog(item);
    return;
  }
}



  // Drag existing vessels (topmost first)
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
  // Remove hovered vessel with 'r'
  if (key.toLowerCase() === 'r' && hoverVessel) {
    delete vessels[hoverVessel.id];
    hoverVessel = null;
    return;
  }

  // SPACE -> titrate from burette into beaker
  if (key === ' ' || keyCode === 32) {
    const beaker = Object.values(vessels).find(v => v.type === 'beaker');
    const burette = Object.values(vessels).find(v => v.type === 'burette');
    if (!beaker || !burette || !currentPositions) return;

    const scaleX = width / 1200;
    const scaleY = height / 700;
    const titrationX = LAB_ZONES.table.slots[2].x * scaleX;
    const titrationY = LAB_ZONES.table.slots[2].y * scaleY;

    const under = Math.abs(beaker.x - titrationX) < 40 && Math.abs(beaker.y - titrationY) < 40;

    if (!under && !beaker.isUnderBurette) {
      console.log('Place beaker under burette, then press SPACE');
      return;
    }

    const flow = keyIsDown(SHIFT) ? 0.8 : 0.25;
    if (buretteTargetVol >= flow && beakerTargetVol < beaker.capacity) {
      buretteTargetVol = max(0, buretteTargetVol - flow);
      beakerTargetVol = min(beaker.capacity, beakerTargetVol + flow);
      studentVolume += flow;
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

  // Only one of some types (unique instruments)
  if (['burette', 'bunsen_burner', 'balance', 'pH_meter', 'meltingpoint_apparatus', 'hotplate'].includes(type) &&
      Object.values(vessels).some(v => v.type === type)) {
    console.log(`${type} already exists!`);
    return;
  }

  let v = null;

  // VOLUMETRIC APPARATUS
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

  // TITRATION APPARATUS
  else if (type === 'burette') {
    const cap = askCapacity('burette');
    if (!cap) return;
    const spawnPos = { x: currentPositions.burette_stand.x, y: currentPositions.burette_stand.y };
    const size = currentPositions.sizes.burette;
    v = makeVessel(
      nextId('burette'),
      spawnPos.x, spawnPos.y,
      size.w, size.h,
      `${cap} mL Burette`,
      '0.1 M NaOH',
      'burette',
      cap,
      cap
    );
    buretteTargetVol = cap;
  }
  else if (type === 'conical_flask') {
    v = makeResponsiveVessel(nextId('conical_flask'), 'conical_flask');
    if (v) v.title = 'Conical Flask';
  }

  // REAGENTS
  else if (type === 'bottle') {
    const chem = askChemical('acid');
    if (!chem) return;
    v = makeResponsiveVessel(nextId('bottle'), 'bottle');
    if (v) {
      v.chem = chem.label;
      v.title = 'Reagent Bottle';
      v.volume = 100;
      v.chemicalId = chem.id;
    }
  }

  // UTILITY
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

  // ⭐ NEW APPARATUS (your 8 new sprites!)
  else if (type === 'balance') {
    v = makeResponsiveVessel(nextId('balance'), 'balance');
    if (v) v.title = 'Analytical Balance';
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
      v.temperature = 25; // Room temp
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
      v.reading = 7.0; // Neutral
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
    console.log(`Spawned: ${v.title}`); // Debug
  } else {
    console.log(`Failed to spawn: ${type}`); // Debug
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
// EXPOSE P5 TO WINDOW
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
