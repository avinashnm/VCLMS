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
let userClosedZoom = false;
let buretteReading = 0;

let apparatusCatalog, chemicalCatalog;
let currentCatalogTab = 'apparatus';
let imgBeaker, imgBottle, imgBurette, imgPipette;
let imgConical, imgVolumetric, imgFunnel, imgWash, imgBunsen;
let imgBalance, imgCrucible, imgHotplate, imgLiebig, imgMeltingPoint, imgPHMeter, imgSepFunnel, imgTLC;
let imgBuretteTube, imgStand;

let catalogVisible = false;
let catalogToggleButton = null;
let catalogPanelBounds = null;
let controlsVisible = false;
let assistantVisible = true;
let clearShelfButton = null;

let currentPositions = null;
let idCounter = 0;
const sizeMultiplier = 0.45; // Slightly reduced for better fit on shelves
let labSurfaces = null;
const BURETTE_GLASS_X_OFFSET = -8;
// Initialize from Django (passed via template)
const experimentData = typeof EXPERIMENT_CONFIG !== 'undefined' ? EXPERIMENT_CONFIG : null;
const TARGET_V1 = experimentData?.targets?.v1 || 10.0;
const TARGET_V2 = experimentData?.targets?.v2 || 25.0;

let currentStepIndex = 0; // Tracks which milestone we are on
let penalties = [];       // List of strings explaining point losses
let sessionMarks = 0;     // Current score
let activeModal = null; // Tracks if an input box is open

// ======================================================
// LAB SURFACES (continuous surfaces)
// ======================================================
const LAB_SURFACES = {
  shelfTop: { y: 85, minX: 280, maxX: 950, shadowAlpha: 30 },
  shelfBottom: { y: 175, minX: 280, maxX: 950, shadowAlpha: 30 },
  table: { y: 335, minX: 50, maxX: 1150, shadowAlpha: 45 }
};

//experiment assessment
class MarkingManager {
  constructor(config) {
    this.config = config;
    this.milestones = config?.milestones || [];
    this.completedIds = new Set();
    this.mistakesMade = new Set();

    // Stored observations for the calculation phase
    this.recordedV1 = 0;
    this.recordedV2 = 0;
    this.swirlNeglectTimer = 0; // Track lack of swirling
  }

  // This MUST be called inside the p5.js draw() loop
  update() {
    const flask = Object.values(vessels).find(v => v.type === 'conical_flask');
    const burette = Object.values(vessels).find(v => v.type === 'burette');

    // --- 1. BURETTE TASKS ---
    if (burette) {
      // Check: Fill Burette (Minimum 20mL to start)
      if (burette.targetVolume > 24) {
        this.completeMilestone("fill_burette");
      }

      // Check: Zero Burette (Meniscus at 0.00)
      let reading = abs(burette.capacity - burette.volume);
      if (this.completedIds.has("fill_burette") && reading < 0.2) {
        this.completeMilestone("zero_burette");
      }

      // Penalty: Titrating without Zeroing
      if (keyIsDown(32) && flask && dist(flask.x, flask.y, burette.x - 45, burette.y + 120) < 80) {
        if (!this.completedIds.has("zero_burette") && reading > 0.5) {
          this.addPenalty("no_zeroing", 15, "Titrating without zeroing the burette first.");
        }
      }

      // Penalty: Titrating without removing funnel
      if (keyIsDown(32) && !burette.hasFunnel) {
        this.addPenalty("no_funnel", 5, "Started titration without using a funnel (or funnel is missing).");
      }

      // Penalty: Titrating without Swirling (Lack of Agitation)
      // If Space is held (titrating) but W is NOT held (no swirl)
      if (keyIsDown(32) && !keyIsDown(87)) {
        this.swirlNeglectTimer++;
        if (this.swirlNeglectTimer > 180) { // ~3 seconds of neglect
          this.addPenalty("no_swirl", 10, "Titrating without swirling the flask regularly.");
        }
      } else {
        // Reset timer if they swirl
        if (keyIsDown(87)) this.swirlNeglectTimer = 0;
      }
    }

    // --- 2. FLASK TASKS ---
    if (flask) {
      // Check: Pipette 20mL Analyte into Flask
      if (flask.contents.mixture_vol >= 19.5) {
        this.completeMilestone("pipette_mixture");
      }

      // Check: Add Phenolphthalein
      if (this.completedIds.has("pipette_mixture") && flask.contents.pp_drops >= 1) {
        this.completeMilestone("add_pp");
      }

      // Penalty: Adding Methyl Orange too early
      if (flask.contents.mo_drops > 0 && !this.completedIds.has("reach_v1")) {
        this.addPenalty("wrong_sequence", 15, "Added Methyl Orange before V1 endpoint.");
      }

      // Check: Add Methyl Orange (Only after V1 is finished)
      if (this.completedIds.has("reach_v1") && flask.contents.mo_drops >= 1) {
        this.completeMilestone("add_mo");
      }
    }
  }

  completeMilestone(id) {
    if (this.completedIds.has(id)) return;
    let m = this.milestones.find(item => item.id === id);
    if (m) {
      this.completedIds.add(id);
      sessionMarks += m.points;
      currentStepIndex = Math.min(this.milestones.length - 1, this.completedIds.size);
      console.log("Milestone Achieved:", m.desc);
    }
  }

  addPenalty(id, points, reason) {
    if (this.mistakesMade.has(id)) return;
    this.mistakesMade.add(id);
    sessionMarks -= points;
    penalties.push(`-${points}: ${reason}`);
  }

  // --- MANUAL ENTRY: V1 ---
  openV1Input() {
    let val = window.prompt("LAB OBSERVATION:\nEnter the Phenolphthalein endpoint (V1) reading in mL:");
    if (val !== null && val !== "") {
      let userV1 = parseFloat(val);
      const flask = Object.values(vessels).find(v => v.type === 'conical_flask');
      let trueV1 = flask.contents.hcl_vol; // The real volume added in simulation

      // Mark accuracy of observation (within 0.2 mL tolerance)
      if (abs(userV1 - trueV1) > 0.2) {
        this.addPenalty("obs_v1", 10, `Inaccurate V1 observation. Entered: ${userV1}, Actual: ${trueV1.toFixed(2)}`);
      }
      this.recordedV1 = userV1;
      this.completeMilestone("reach_v1");
    }
  }

  // --- MANUAL ENTRY: V2 ---
  openV2Input() {
    let val = window.prompt("LAB OBSERVATION:\nEnter the Methyl Orange endpoint (V2) reading in mL:");
    if (val !== null && val !== "") {
      let userV2 = parseFloat(val);
      const flask = Object.values(vessels).find(v => v.type === 'conical_flask');
      let trueV2 = flask.contents.hcl_vol;

      // Mark accuracy of observation (within 0.2 mL tolerance)
      if (abs(userV2 - trueV2) > 0.2) {
        this.addPenalty("obs_v2", 10, `Inaccurate V2 observation. Entered: ${userV2}, Actual: ${trueV2.toFixed(2)}`);
      }
      this.recordedV2 = userV2;
      this.completeMilestone("reach_v2");
    }
  }

  // --- FINAL CHECKPOINT: CALCULATIONS ---
  openCalculationModal() {
    // Brief delay ensures the click event is finished before browser prompts open
    setTimeout(() => {
      const confirmed = confirm("TITRATION COMPLETE\n\nAre you ready to submit your final mass calculations based on your V1 and V2 observations?");
      if (!confirmed) return;

      let m1 = window.prompt(`Step 1: Use your V1 (${this.recordedV1} mL) to calculate:\nMass of Na2CO3 in grams:`);
      let m2 = window.prompt(`Step 2: Use your V2 (${this.recordedV2} mL) to calculate:\nMass of NaHCO3 in grams:`);

      if (m1 !== null && m2 !== null && m1 !== "" && m2 !== "") {
        this.verifyCalculations(parseFloat(m1), parseFloat(m2));
      } else {
        alert("Submission cancelled. Please calculate and enter both values.");
      }
    }, 100);
  }

  verifyCalculations(massNa2CO3, massNaHCO3) {
    // --- Chemistry Formulae ---
    // Vol for Na2CO3 = 2 * V1
    // Vol for NaHCO3 = V2 - 2*V1
    // Mass = (Volume * Molarity * Eq.Wt) / 1000

    const M = 0.1;
    const trueV1 = TARGET_V1; // Using simulated targets for absolute marking
    const trueV2 = TARGET_V2;

    let expectedNa2CO3 = (2 * trueV1 * M * 53) / 1000;
    let expectedNaHCO3 = ((trueV2 - (2 * trueV1)) * M * 84) / 1000;

    let mathErrors = [];

    // Mark Na2CO3 Math (within 0.05g tolerance)
    if (abs(massNa2CO3 - expectedNa2CO3) < 0.05) {
      console.log("Carbonate math correct");
    } else {
      this.addPenalty("calc_na2co3", 12, "Incorrect Mass calculation for Sodium Carbonate.");
    }

    // Mark NaHCO3 Math (within 0.05g tolerance)
    if (abs(massNaHCO3 - expectedNaHCO3) < 0.05) {
      console.log("Bicarbonate math correct");
    } else {
      this.addPenalty("calc_nahco3", 13, "Incorrect Mass calculation for Sodium Bicarbonate.");
    }

    this.completeMilestone("submit_calc");
    this.saveResults(massNa2CO3, massNaHCO3);
  }

  saveResults(m1, m2) {
    const payload = {
      name: experimentData.name,
      totalScore: sessionMarks,
      v1_observed: this.recordedV1,
      v2_observed: this.recordedV2,
      calc_na2co3: m1,
      calc_nahco3: m2,
      log: penalties.join(" | ")
    };

    fetch("/save_lab_report/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        alert(`Assessment Complete!\nFinal Score: ${sessionMarks}/100\nYour report has been submitted to the instructor.`);
      })
      .catch(err => console.error("Save error:", err));
  }
}

function drawEndpointButtons(x, y, w) {
  const flask = Object.values(vessels).find(v => v.type === 'conical_flask');
  if (!flask || flask.contents.mixture_vol < 1) return;


  if (idIsDone("add_pp") && !idIsDone("reach_v1")) {
    drawButton(x, y, w, 40, "ENTER V1 READING", [255, 105, 180]);
  }
  if (idIsDone("add_mo") && !idIsDone("reach_v2")) {
    drawButton(x, y, w, 40, "ENTER V2 READING", [255, 160, 0]);
  }
  if (idIsDone("reach_v2") && !idIsDone("submit_calc")) {
    drawButton(x, y, w, 40, "SUBMIT CALCULATIONS", [0, 200, 100]);
  }
}

// --- FIX 2: Initialize only ONE manager ---
const manager = new MarkingManager(experimentData);
function idIsDone(id) { return manager.completedIds.has(id); }

function getLabSurfaces() {
  const scaleX = width / 1200;
  const scaleY = height / 700;
  return {
    shelfTop: {
      y: 85 * scaleY,
      minX: 280 * scaleX,
      maxX: 950 * scaleX,
      shadowAlpha: 30
    },
    shelfBottom: {
      y: 175 * scaleY,
      minX: 280 * scaleX,
      maxX: 950 * scaleX,
      shadowAlpha: 30
    },
    table: {
      y: 335 * scaleY,
      minX: 50 * scaleX,      // Wider coverage
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
  'liebig_condensor', 'separatory_funnel', 'pH_meter', 'meltingpoint_apparatus',
  'common_stand'
];

const SMALL_APPARATUS = [
  'beaker', 'pipette', 'bottle', 'funnel', 'conical_flask',
  'volumetric_flask', 'crucible', 'TLC_plate', 'burette_tube'
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
      bunsen_burner: { w: 120 * scale * sizeMultiplier, h: 180 * sizeMultiplier * scale },
      burette_tube: { w: 100 * scale * sizeMultiplier, h: 360 * scale * sizeMultiplier },
      common_stand: { w: 180 * scale * sizeMultiplier, h: 560 * scale * sizeMultiplier }
    }
  };
}

// ======================================================
// PRELOAD
// ======================================================
function preload() {
  imgLabBg = loadImage('/static/images/new-lab-bg-1.png');
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
  imgStand = loadImage('/static/img/catalog/stand.png');
  imgBuretteTube = loadImage('/static/img/catalog/burette-single.png');
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
    separatory_funnel: imgSepFunnel, TLC_plate: imgTLC,
    burette_tube: imgBuretteTube, common_stand: imgStand
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
  if (!labSurfaces) return { x: width / 2, y: height / 2 };

  // ALL items spawn on specific surfaces now
  const isBig = BIG_APPARATUS.includes(type);

  let spawnSurface;
  if (isBig) {
    spawnSurface = labSurfaces.table;
  } else {
    spawnSurface = Math.random() > 0.5 ? labSurfaces.shelfTop : labSurfaces.shelfBottom;
  }

  // Spawn range
  const minX = spawnSurface.minX + 50;
  const range = (spawnSurface.maxX - spawnSurface.minX) * 0.8;
  const targetX = minX + random(0, range);

  // PREDICT HEIGHT to spawn ABOVE the surface (so logic/physics snaps it down)
  let size = currentPositions?.sizes[type] || { h: 100, w: 100 };
  let verticalSize = (type === 'burette_tube') ? size.w : size.h; // Tube lays flat on spawn
  const targetY = spawnSurface.y - (verticalSize / 2) - 5; // Spawn 5px above snap point

  return findCollisionFreePosition(targetX, targetY, type);
}


function findCollisionFreePosition(targetX, targetY, type) {
  let attempts = 0;
  const scaleX = width / 1200;
  const scaleY = height / 700;

  while (attempts < 20) {
    let testX = targetX + random(-100, 100);
    let testY = targetY; // Keep Y fixed to surface level

    // Keep within lab surface bounds
    /*
    const isBig = BIG_APPARATUS.includes(type);
    const bounds = isBig ? labSurfaces.table : labSurfaces.shelf;

    if (testX < bounds.minX || testX > bounds.maxX || testY > bounds.y + 20) {
      attempts++;
      continue;
    }
    */

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

  // Turbulence Decay (Ripples settle down)
  if (v.turbulence > 0) {
    v.turbulence = lerp(v.turbulence, 0, 0.05);
    if (v.turbulence < 0.01) v.turbulence = 0;
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
    chem: chem,
    chemicalId: null,
    x: x, y: y, w: w, h: h,
    vx: 0, vy: 0,
    lastX: x, tilt: 0, tiltVel: 0,
    turbulence: 0, // NEW: For liquid surface ripples
    surface: null,

    // --- INDEPENDENT VOLUME LOGIC ---
    volume: vol,           // Visual volume (animated)
    targetVolume: vol,     // Actual volume (logic)
    capacity: cap,

    hasFunnel: false,
    tiltAngle: 0,
    isDraining: false,
    dragging: false,
    isOnBalance: false,
    vanish: 1.0, // 1.0 = normal, 0.0 = gone (for animations)
    color: [200, 220, 255, 150],

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
  // Ensure we use the randomized target from your student_views.py
  // Fallback to 10.0 if for some reason the config didn't load
  const targetV1 = (typeof THEORETICAL_V1 !== 'undefined') ? THEORETICAL_V1 : 10.0;
  const targetV2 = (typeof THEORETICAL_V2 !== 'undefined') ? THEORETICAL_V2 : 25.0;

  // 1. If flask is basically empty, show water
  if (c.mixture_vol < 0.5) return [200, 220, 255, 100];

  // 2. Stage 1: Phenolphthalein (Analyte + PP = PINK)
  if (c.pp_drops > 0 && c.mo_drops === 0) {
    if (c.hcl_vol < targetV1) {
      // Fade intensity near the endpoint
      let intensity = map(c.hcl_vol, targetV1 - 1.5, targetV1, 220, 30, true);
      return [255, 105, 180, intensity];
    } else {
      return [245, 245, 255, 100]; // Endpoint reached: Colorless
    }
  }

  // 3. Stage 2: Methyl Orange (After V1 + MO = YELLOW)
  if (c.mo_drops > 0) {
    if (c.hcl_vol < targetV2) return [255, 210, 0, 180]; // Yellow
    else return [255, 80, 0, 220]; // Red/Orange Endpoint
  }

  // 4. Default Analyte color (Amber/Tan)
  return [235, 215, 160, 160];
}


// ======================================================
// PROXIMITY & GLOW SYSTEM
// ======================================================
function proximityCheck() {
  Object.values(vessels).forEach(v => {
    v.glow = 0;
    v.hint = '';

    if (v.type === 'pipette') {
      const bottle = Object.values(vessels).find(b => b.type === 'bottle' || b.type === 'chemical_bottle');
      // Fix: Find any receiver (beaker OR conical flask)
      const receiver = Object.values(vessels).find(r =>
        (r.type === 'beaker' || r.type === 'conical_flask') && near(v, r, 60)
      );

      if (bottle && near(v, bottle, 50)) {
        v.glow = 1;
        v.hint = 'SHIFT = Suck';
      } else if (receiver) {
        v.glow = 1;
        v.hint = 'SHIFT = Pour'; // This now works for conical flasks too
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
      v.x = parent.x + (parent.type === 'burette' ? BURETTE_GLASS_X_OFFSET : 0);
      v.y = parent.y - (parent.h * 0.46);
      v.vy = 0; // Disable gravity for attached items
      return;
    } else {
      v.isAttachedTo = null; // Parent was deleted
    }
  }
  if (v.mountedTo) {
    const stand = vessels[v.mountedTo];
    if (stand) {
      v.x = stand.x - stand.w * 0.18; // Shifted further left (0.18 instead of 0.12)
      v.y = stand.y + v.clampOffset;   // Apply vertical offset
      v.vy = 0;
      return;
    } else {
      v.mountedTo = null; // Stand was deleted
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

  // 1.5 Check Titration Snapping (Magnetic snap under burette)
  const burette = Object.values(vessels).find(b => b.type === 'burette');
  let snappedToTitration = false;

  if (burette && (v.type === 'conical_flask' || v.type === 'beaker')) {
    const snapX = burette.x + BURETTE_GLASS_X_OFFSET;
    // snapY should be the surface the burette is sitting on
    const snapY = burette.surface ? burette.surface.y : (burette.y + burette.h / 2);

    if (dist(v.x, v.y + v.h / 2, snapX, snapY) < 50) {
      v.x = lerp(v.x, snapX, 0.3);
      v.y = lerp(v.y, snapY - v.h / 2, 0.3);
      v.vy = 0;
      v.surface = burette.surface; // Share the same surface
      snappedToTitration = true;
    }
  }

  if (snappedToTitration) return;

  // 2. Standard Gravity and Surface logic
  const gravity = 1.2;
  v.vy += gravity;
  v.y += v.vy;

  let closestSurface = null;
  let minDist = Infinity;

  if (labSurfaces) {
    const isBig = BIG_APPARATUS.includes(v.type);

    Object.entries(labSurfaces).forEach(([name, surf]) => {
      // 1. BIG APPARATUS CONSTRAINT: Big items can ONLY snap to the table (bench)
      if (isBig && name !== 'table') return;

      // 2. HORIZONTAL CHECK: Must be within surface width
      if (v.x < surf.minX || v.x > surf.maxX) return;

      const d = abs((v.y + v.h / 2) - surf.y);
      // Increased snap range for smoother "magnet" feel
      if (d < minDist && d < 80) {
        minDist = d;
        closestSurface = surf;
      }
    });
  }

  if (closestSurface && (v.y + v.h / 2) >= closestSurface.y - 10) {
    v.y = closestSurface.y - v.h / 2;
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
    if (v.targetVolume !== undefined) {
      // Allow burette to overfill by 2mL logically
      let maxCap = (v.type === 'burette') ? v.capacity + 4 : v.capacity;
      v.targetVolume = constrain(v.targetVolume, 0, maxCap);

      v.volume = lerp(v.volume, v.targetVolume, 0.15);
      if (abs(v.volume - v.targetVolume) < 0.01) v.volume = v.targetVolume;
    }
  });
}

function near(a, b, radius) {
  return dist(a.x, a.y, b.x, b.y) < radius;
}
function handleIndicatorDrops() {
  if (!isDragging || !mouseIsPressed) return;

  const flask = Object.values(vessels).find(v => v.type === 'conical_flask' && near(isDragging, v, 70));
  if (flask && (isDragging.chemicalId === 'phenolphthalein' || isDragging.chemicalId === 'methyl_orange')) {

    // Slow down drop rate
    if (frameCount % 30 === 0) {
      if (isDragging.chemicalId === 'phenolphthalein') flask.contents.pp_drops++;
      if (isDragging.chemicalId === 'methyl_orange') flask.contents.mo_drops++;
      createParticles(isDragging.x, isDragging.y + 30, 2, 'drip');
      console.log("Indicator mixed into flask");
    }
  }
}

function handlePipetteInteraction() {
  if (!isDragging || isDragging.type !== 'pipette') return;
  const pipette = isDragging;

  const source = Object.values(vessels).find(v =>
    (v.type === 'bottle' || v.type === 'chemical_bottle' || v.type === 'beaker') && v.targetVolume > 0.01 && near(pipette, v, 60));

  const receiver = Object.values(vessels).find(v =>
    (v.type === 'beaker' || v.type === 'conical_flask') && near(pipette, v, 60));

  if (source && keyIsDown(SHIFT)) {
    let rate = 0.5 * (deltaTime / 50);
    if (pipette.targetVolume < pipette.capacity && source.targetVolume > 0) {
      let amt = min(rate, source.targetVolume, pipette.capacity - pipette.targetVolume);
      source.targetVolume -= amt;
      pipette.targetVolume += amt;
      // Transfer identity to pipette
      pipette.color = source.color;
      pipette.chemicalId = source.chemicalId;
      pipette.chem = source.chem;
    }
  }

  if (receiver && keyIsDown(SHIFT)) {
    let rate = 0.5 * (deltaTime / 50);
    if (pipette.targetVolume > 0.01 && receiver.targetVolume < receiver.capacity) {
      let amt = min(rate, pipette.targetVolume, receiver.capacity - receiver.targetVolume);
      pipette.targetVolume -= amt;
      receiver.targetVolume += amt;

      // --- MIXING LOGIC: Don't overwrite the flask if it's already an Analyte ---
      const isIndicator = pipette.chemicalId === 'phenolphthalein' || pipette.chemicalId === 'methyl_orange';

      if (pipette.chemicalId === 'na2co3_nahco3') {
        receiver.contents.mixture_vol += amt;
        receiver.chemicalId = pipette.chemicalId;
        receiver.chem = "Analyte Mixture";
        receiver.color = pipette.color;
      } else if (isIndicator) {
        // Update the "Brain" counts only
        if (pipette.chemicalId === 'phenolphthalein') receiver.contents.pp_drops += (amt * 10);
        if (pipette.chemicalId === 'methyl_orange') receiver.contents.mo_drops += (amt * 10);
        // Note: We DO NOT change receiver.chem or receiver.color here
      }

      // ADD TURBULENCE (Ripples) - MORE SUBTLE
      receiver.turbulence = min((receiver.turbulence || 0) + 0.5, 3);

      // Thinner stream for pipette - ORIGIN AT TIP (v.h/2)
      drawPouringStream(pipette.x, pipette.y + pipette.h / 2 - 5, receiver.x, receiver.y - 15, color(...(pipette.color || [255, 255, 255])), 2);
    }
  }
}

function drawSnapGuides() {

}

function drawTitrationZone() {
  const burette = Object.values(vessels).find(v => (v.type === 'burette' || (v.type === 'burette_tube' && v.mountedTo)));
  if (!burette || isDragging) return;

  const snapX = burette.type === 'burette' ? (burette.x + BURETTE_GLASS_X_OFFSET) : burette.x;
  const dripTipY = burette.type === 'burette' ? (burette.y + 120) : (burette.y + burette.h * 0.4);

  // FIXED: Reference the correct tabletop coordinate (72% height)
  const snapY = height * 0.72;

  const receiver = Object.values(vessels).find(v =>
    (v.type === 'beaker' || v.type === 'conical_flask') && dist(v.x, v.y + v.h / 2, snapX, snapY) < 70
  );

  const isTooLow = dripTipY > snapY - 80; // Clearance check (~80px from bench)

  if (!receiver) {
    if (isTooLow) {
      push();
      fill(255, 100, 100); noStroke(); textAlign(CENTER); textSize(12); textStyle(BOLD);
      text('⚠️ BURETTE TOO LOW', snapX, dripTipY - 30);
      pop();
    } else {
      push();
      noFill();
      stroke(100, 255, 100, 150);
      strokeWeight(2);
      // Draw the circle exactly on the bench surface
      ellipse(snapX, snapY - 5, 60, 20);

      fill(100, 255, 100); noStroke(); textAlign(CENTER); textSize(10);
      text('PLACE FLASK', snapX, snapY - 20);
      pop();
    }
  } else {
    // Check if the tip is too high
    const distY = abs(dripTipY - receiver.y + receiver.h / 2); // Distance from tip to flask top
    if (distY > 150) { // Very forgiving gap of 150px
      push();
      fill(255, 50, 50); noStroke(); textAlign(CENTER); textSize(12); textStyle(BOLD);
      text('⚠️ TIP TOO HIGH - WILL SPILL', snapX, dripTipY - 30);
      pop();
    }
  }
}

// ======================================================
// MAIN DRAW LOOP
// ======================================================
function draw() {
  // Background
  imageMode(CORNER);
  image(imgLabBg, 0, 0, width, height);
  manager.update();

  updateLabSurfaces();

  hoverVessel = null;

  // Core systems
  proximityCheck();
  Object.values(vessels).forEach(v => applyLabPhysics(v));
  easeVolumes();
  handlePipetteInteraction();
  handleBuretteFilling();
  handleBuretteDrainage();  // Draining from the bottom
  handleIndicatorDrops();
  instrumentReadings();

  // --- NEW: SWIRL FLASK (W Key) ---
  if (keyIsDown(87)) { // 'W' Key
    const flask = Object.values(vessels).find(v => v.type === 'conical_flask');
    if (flask && flask.volume > 0) {
      flask.turbulence = 6; // High turbulence
      flask.tilt = sin(frameCount * 0.1) * 0.10; // Tilt (Slower)

      // PHYSICAL ORBITAL SWIRL
      //temporary render offset to simulate circular motion
      flask.renderOffsetX = cos(frameCount * 0.4) * 4; // Slower orbit
      flask.renderOffsetY = sin(frameCount * 0.4) * 2;

      flask.hint = "Swirling...";
    }
  } else {
    // Reset offsets when not swirling
    const flask = Object.values(vessels).find(v => v.type === 'conical_flask');
    if (flask) {
      flask.renderOffsetX = 0;
      flask.renderOffsetY = 0;
    }
  }

  // Draw shadows first, then vessels
  Object.values(vessels).forEach(v => drawShadow(v));

  Object.values(vessels).forEach(v => {
    drawVessel(v);
    if (v.type === 'burette' || (v.type === 'burette_tube' && v.mountedTo)) drawBuretteZoom(v); // Call the zoom here
  });

  // FIXED: Handle Keyboard Vertical Sliding AFTER drawVessel has set hoverVessel
  if (hoverVessel && hoverVessel.type === 'burette_tube' && hoverVessel.mountedTo) {
    const stand = vessels[hoverVessel.mountedTo];
    // CONFLICT PREVENTION: Only slide if not currently pouring from a bottle
    const isPouring = isDragging && isDragging.type === 'bottle';
    if (stand && !isPouring) {
      let moved = false;
      if (keyIsDown(UP_ARROW)) {
        hoverVessel.clampOffset = constrain(hoverVessel.clampOffset - 3, -stand.h * 0.55, stand.h * 0.35);
        moved = true;
      }
      if (keyIsDown(DOWN_ARROW)) {
        hoverVessel.clampOffset = constrain(hoverVessel.clampOffset + 3, -stand.h * 0.55, stand.h * 0.35);
        moved = true;
      }

      if (moved) {
        // AUTO-UNSNAP: If sliding down pushes tip into the flask
        const dripTipY = hoverVessel.y + hoverVessel.h * 0.4;
        Object.values(vessels).forEach(v => {
          if ((v.type === 'beaker' || v.type === 'conical_flask') && abs(v.x - hoverVessel.x) < 10) {
            const flaskTopY = v.y - v.h / 2;
            if (dripTipY > flaskTopY + 10) { // Must actually overlap by 10px to eject
              // Unsnap: nudge the flask away from the center alignment
              v.x += 100; // Move far enough to break the snap
              v.vy = 0;
              console.log("Flask pushed away to avoid collision");
            }
          }
        });
      }
    }
  }

  drawTitrationZone();
  drawSnapGuides();  // ✨ Visual feedback!

  // Particles
  drawParticles();

  // UI

  if (hoverVessel) drawTooltip(hoverVessel);
  if (catalogVisible) drawCatalogPanel();
  if (assistantVisible) drawDataPanel();
  drawControlsPanel();
  drawClearShelfButton(); // Magic button on the shelf
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
  // If vanishing, scale down
  if (v.vanish < 1.0) {
    v.vanish -= 0.1;
    if (v.vanish <= 0) {
      delete vessels[v.id];
      return;
    }
  }

  // REVERT: Entire item is now hoverable again
  const over = mouseX > v.x - v.w / 2 && mouseX < v.x + v.w / 2 &&
    mouseY > v.y - v.h / 2 && mouseY < v.y + v.h / 2;

  if (over && !isDragging) {
    // PRIORITIZE TUBE OVER STAND: If we were already hovering a stand and now find a tube, take the tube.
    if (!hoverVessel || (v.type === 'burette_tube' && hoverVessel.type === 'common_stand') || v.type !== 'common_stand') {
      hoverVessel = v;
    }
  }

  push();
  // Apply render offsets if they exist (for Swirling)
  let rx = v.x + (v.renderOffsetX || 0);
  let ry = v.y + (v.renderOffsetY || 0);

  translate(rx, ry);
  if (v.vanish < 1.0) scale(max(0, v.vanish)); // Apply "Poof" scale

  imageMode(CENTER);

  // Proximity glow effect
  if (v.glow > 0) {
    drawingContext.shadowColor = 'rgba(0, 255, 0, 0.6)';
    drawingContext.shadowBlur = 30 * v.glow;
  }

  if (v.type === 'bottle' || v.type === 'chemical_bottle') {
    push();
    if (v.dragging && v.tiltAngle) {
      translate(0, -v.h * 0.4); // Pivot at neck
      rotate(radians(v.tiltAngle));
      translate(0, v.h * 0.4);
    }
    image(imgBottle, 0, 0, v.w, v.h);
    drawRealisticLiquid(v, v.color || color(100, 200, 255));

    if (v.chemicalId) {
      push(); translate(-1, 8);
      const chemInfo = getChemicalInfo(v.chemicalId);
      fill(0); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(8);
      text(chemInfo.name, 0, -7);
      text(chemInfo.formula, 0, 5);
      pop();
    }
    pop();
  }
  // --- SPRITE RENDERING ---
  else if (v.type === 'beaker') {
    image(imgBeaker, 0, 0, v.w, v.h);
    drawRealisticLiquid(v, color(100, 200, 255));
  }
  else if (v.type === 'burette') {
    image(imgBurette, 0, 0, v.w, v.h);

    // --- STOPCOCK ANIMATION ---
    if (keyIsDown(83)) { // If 'S' is pressed
      push();
      fill(255, 0, 0); noStroke();
      // Draw a small red "valve" indicator near the stopcock
      circle(0, v.h * 0.35, 5);
      pop();
      v.hint = "Stopcock Open";
    }

    drawRealisticLiquid(v, v.color || color(255, 160, 100));
  }
  else if (v.type === 'burette_tube') {
    push();
    if (!v.mountedTo && !v.dragging) {
      rotate(PI / 2); // Lay flat on shelf
    }
    image(imgBuretteTube, 0, 0, v.w, v.h);
    // Same stopcock check
    if (keyIsDown(83)) {
      push(); fill(255, 0, 0); noStroke(); circle(0, v.h * 0.35, 5); pop();
      v.hint = "Stopcock Open";
    } else if (v.mountedTo) {
      v.hint = "Hover & Press ↑ / ↓ to Adjust Height";
    }
    drawRealisticLiquid(v, v.color || color(255, 160, 100));
    pop();
  }
  else if (v.type === 'common_stand') {
    image(imgStand, 0, 0, v.w, v.h);
  }
  else if (v.type === 'pipette') {
    image(imgPipette, 0, 0, v.w, v.h);
    // FIX: Use v.color if available, otherwise default grey
    drawRealisticLiquid(v, v.color ? color(...v.color) : color(200, 200, 200));
  }

  else if (v.type === 'balance') {
    image(imgBalance, 0, 0, v.w, v.h);
    drawBalanceDisplay(v); // Integrated realistic meter
  }
  else if (v.type === 'conical_flask') {
    image(imgConical, 0, 0, v.w, v.h);

    // NEW: Calculate dynamic titration color
    drawRealisticLiquid(v, color(...getTitrationColor(v)));
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
    rect(-v.w / 2, -v.h / 2, v.w, v.h, 8);
    fill(0); textAlign(CENTER, CENTER); textSize(12); text(v.type, 0, 0);
  }

  drawingContext.shadowBlur = 0;
  drawingContext.shadowColor = 'transparent';

  // --- LABEL LOGIC: Hide if it's a bottle, the balance, or an item ON the balance ---
  const shouldHideLabel = v.type === 'bottle' || v.type === 'balance' || v.isOnBalance;

  if (!shouldHideLabel) {
    textAlign(CENTER);
    textSize(11); fill(30);
    text(v.title || v.type, 0, v.h / 2 + 15);
    textSize(10);
    text(v.chem || 'Empty', 0, v.h / 2 + 28);
  }

  // --- INSTRUMENT OVERLAYS ---
  if (v.type === 'pH_meter' && v.reading) {
    drawDigitalDisplay(20, -30, `pH: ${nf(v.reading, 1, 2)}`);
  }
  // Note: The green balance display was removed from here to fix the duplication issue.

  if (v.hint) {
    drawHintBubble(0, -v.h / 2 - 25, v.hint);
  }

  pop();
}

function drawPouringStream(startX, startY, endX, endY, col, thickness = 3) {
  push();
  const r = red(col), g = green(col), b = blue(col);

  // Dynamic Stream fluctuations - SUBTLE now
  const time = frameCount * 0.2;
  const wiggle = sin(time) * 1.5; // Reduced from 3 to 1.5
  const midX = (startX + endX) / 2 + wiggle;
  const midY = (startY + endY) / 2;

  // Outer Glow (Wider & Dynamic)
  stroke(r, g, b, 60); // Less opaque
  strokeWeight(thickness + 2 + sin(time * 2)); // Slight pulse
  noFill();

  beginShape();
  vertex(startX, startY);
  bezierVertex(startX, startY + 20, midX, midY, endX, endY);
  endShape();

  // Inner Core
  stroke(r, g, b, 240);
  strokeWeight(thickness);
  beginShape();
  vertex(startX, startY);
  bezierVertex(startX, startY + 20, midX, midY, endX, endY);
  endShape();

  // Splash particles (Reduced frequency)
  if (frameCount % 4 === 0) {
    createParticles(endX + random(-2, 2), endY, 1, 'drip');
  }
  pop();
}

// NEW: Droplet animation for titration
function drawDroplets(startX, startY, endX, endY, col) {
  push();
  const r = red(col), g = green(col), b = blue(col);

  // Create a predictable "droplet" path
  const t = (frameCount % 20) / 20; // 0 to 1 loop every 20 frames
  const dropX = startX;
  const dropY = lerp(startY, endY, t * t); // Gravity acceleration simulation

  fill(r, g, b, 240);
  noStroke();

  // Draw the main drop - LARGER & OPAQUE
  if (t < 0.95) {
    ellipse(dropX, dropY, 6, 9); // Bigger Teardrop
  }

  // Splash when it hits
  if (t > 0.9) {
    stroke(r, g, b, 200); // More visible splash
    noFill();
    ellipse(endX, endY, 6 * (t - 0.9) * 15, 3); // Wider ring
  }

  pop();
}

// APPARATUS-SPECIFIC REALISTIC LIQUIDS
function drawRealisticLiquid(v, col) {
  // --- BUG FIX: Prioritize the dynamic 'col' argument (the Titration Color) ---
  // If 'col' is passed, it means the chemistry engine is overriding the visual property.
  let activeCol;
  if (col) {
    activeCol = col;
  } else if (v.color) {
    activeCol = color(...v.color);
  } else {
    activeCol = color(200, 220, 255, 100); // Default water look
  }

  // Visual safety: don't draw if basically empty
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

    // RIPPLE EFFECT
    let ripple = 0;
    if (v.turbulence > 0) {
      ripple = sin(frameCount * 0.8) * v.turbulence * 0.4; // Dampened
    }
    const topY = bottomY - (hMax * fillRatio) + ripple;

    fill(r, g, b, 180);
    noStroke();
    beginShape();
    vertex(-w / 2, bottomY);
    vertex(w / 2, bottomY);
    vertex(w / 2, topY - slosh);
    bezierVertex(w / 4, topY - slosh + 5, -w / 4, topY + slosh + 5, -w / 2, topY + slosh);
    endShape(CLOSE);

    // Meniscus Highlight
    stroke(255, 100); strokeWeight(1); noFill();
    arc(0, topY, w, 6 + abs(slosh), PI, 0);

  }
  else if (v.type === 'conical_flask') {
    // --- CONICAL FLASK LIQUID (TRAPEZOID) ---
    const hMax = v.h * 0.65;
    const bottomY = v.h * 0.42;

    // RIPPLE EFFECT
    let ripple = 0;
    if (v.turbulence > 0) {
      ripple = sin(frameCount * 0.8) * v.turbulence * 0.4; // Dampened
    }
    const topY = bottomY - (hMax * fillRatio) + ripple;

    // Geometry: bottom is wider than the neck
    const bottomW = v.w * 0.8;
    const neckW = v.w * 0.25;
    const currentTopW = lerp(bottomW, neckW, fillRatio);

    fill(r, g, b, 180); noStroke();
    beginShape();
    vertex(-bottomW / 2, bottomY);
    vertex(bottomW / 2, bottomY);
    vertex(currentTopW / 2, topY - slosh);
    vertex(-currentTopW / 2, topY + slosh);
    endShape(CLOSE);

    // Meniscus
    stroke(255, 120); strokeWeight(1); noFill();
    ellipse(0, topY, currentTopW, 4 + abs(slosh));

  }
  else if (v.type === 'pipette') {
    const w = v.w * 0.105;
    const tipY = v.h * 0.40;
    const neckHeight = v.h * 0.85;
    const topY = tipY - (neckHeight * fillRatio);

    fill(r, g, b, 220); // More opaque for thin tube
    noStroke();
    rect(-w / 2, topY, w, tipY - topY, 1);

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
    vertex(-w / 2, bottomY);
    vertex(w / 2, bottomY);
    vertex(w / 2, topY - slosh);
    bezierVertex(0, topY + 4, -w / 4, topY + 4, -w / 2, topY + slosh);
    endShape(CLOSE);
  }
  else if (v.type === 'burette' || v.type === 'burette_tube') {
    const tubeWidth = v.type === 'burette' ? v.w * 0.10 : v.w * 0.20; // Narrower (0.2 instead of 0.35)
    const bottomLimit = v.type === 'burette' ? v.h * 0.25 : v.h * 0.40;
    const hMax = v.type === 'burette' ? v.h * 0.70 : v.h * 0.85;
    const topRim = bottomLimit - hMax;
    const topY = bottomLimit - (hMax * fillRatio);

    push();
    if (v.type === 'burette') translate(BURETTE_GLASS_X_OFFSET, 0);

    // Main Column (Capped at top rim)
    fill(r, g, b, 160);
    noStroke();
    let renderTopY = max(topY, topRim);
    rect(-tubeWidth / 2, renderTopY, tubeWidth, bottomLimit - renderTopY);

    // Tapered Bottom Tip
    beginShape();
    vertex(-tubeWidth / 2, bottomLimit);
    vertex(tubeWidth / 2, bottomLimit);
    vertex(0, bottomLimit + 10);
    endShape(CLOSE);

    // Surface Meniscus
    if (topY > topRim) {
      fill(r, g, b, 255);
      ellipse(0, topY, tubeWidth, 3);
    }
    pop();
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
  rect(-v.w * 0.28, liquidTop, v.w * 0.56, 70, v.w * 0.22);

  drawingContext.restore();

  // 2. MENISCUS CURVE (highlight)
  fill(red(col), green(col), blue(col), 240);
  arc(0, liquidTop, v.w * 0.48, v.w * 0.48 + 6, PI, 0);
}


function drawBuretteRealistic(v, col, fillRatio) {
  const tubeHeight = 180 * fillRatio;
  const tubeTop = -110 + (180 - tubeHeight);  // DROPS FROM TOP

  drawingContext.save();
  // Narrow tube mask (center 15% width)
  rect(-v.w * 0.075, tubeTop, v.w * 0.15, tubeHeight);
  drawingContext.clip();

  fill(red(col), green(col), blue(col), 230);
  rect(-v.w * 0.075, tubeTop, v.w * 0.15, tubeHeight);
  drawingContext.restore();

  // Meniscus
  fill(red(col), green(col), blue(col), 255);
  arc(0, tubeTop, v.w * 0.2, v.w * 0.2 + 3, PI, 0);
}


function drawBottleRealistic(v, col, fillRatio) {
  const liquidHeight = 55 * fillRatio;
  const liquidTop = 35 + (55 - liquidHeight);  // BOTTOM UP

  // Curved base liquid
  fill(red(col), green(col), blue(col), 200);
  noStroke();
  rect(-v.w * 0.22, liquidTop, v.w * 0.44, liquidHeight,
    v.w * 0.18, v.w * 0.18, 0, v.w * 0.18);

  // Shine highlight
  fill(255, 255, 255, 80);
  arc(-v.w * 0.12, liquidTop + 8, v.w * 0.15, v.w * 0.15, 0, PI);
}


function drawGenericLiquid(v, col, fillRatio) {
  // Fallback for other vessels
  const h = 60 * fillRatio;
  fill(red(col), green(col), blue(col), 180);
  rect(-v.w * 0.3, 20, v.w * 0.6, h, v.w * 0.2);
}


function drawDigitalDisplay(x, y, label) { // Change 'text' to 'label' here
  // Digital display background
  fill(0, 50);
  stroke(100);
  strokeWeight(1);
  rect(x - 5, y - 5, 80, 22, 4);

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
  const panelW = 280, margin = 20, panelX = width - panelW - margin;

  // 1. Dynamic Background Panel (Increased height slightly to accommodate)
  fill(15, 25, 45, 240); stroke(255, 30);
  rect(panelX, 30, panelW, 580, 15);

  // 2. Header
  fill(255); textAlign(LEFT); textStyle(BOLD); textSize(16);
  text("🧪 LAB ASSISTANT", panelX + 20, 60);
  fill(100, 200, 255); textSize(14);
  text(`Total Marks: ${sessionMarks}/100`, panelX + 20, 85);

  // 3. Current Task Box
  let currentTask = manager.milestones[currentStepIndex];
  if (currentTask) {
    fill(255, 230, 100); textSize(13);
    text("CURRENT TASK:", panelX + 20, 115);

    fill(255); textStyle(NORMAL);
    rect(panelX + 20, 125, panelW - 40, 50, 8);
    fill(0); textAlign(CENTER, CENTER);
    text(currentTask.desc, panelX + panelW / 2, 150);

    // 4. Instructions Box (Cleanly positioned)
    fill(40, 180, 255, 40); noStroke();
    rect(panelX + 20, 185, panelW - 40, 100, 8);
    fill(140, 220, 255); textAlign(LEFT, TOP); textSize(11);

    let hints = {
      "fill_burette": "From the catalog spawn the burette, funnel and the HCl. Fill the burette by dragging the HCl bottle on top of the burette and use UP/DOWN arrow keys to pour.",
      "zero_burette": "Excess HCl is in the burette. Hold the 'S' key to open the stopcock and drain the liquid until the meniscus is exactly at 0.00.",
      "pipette_mixture": "Spawn the Pipette and the 25% Mixture bottle. Suck 20mL from the amber bottle (SHIFT) and pour into the Conical Flask.",
      "add_pp": "Spawn Phenolphthalein. Drag it over your flask and press the 'D' key twice to add 2 drops.",
      "reach_v1": "Titrate until the pink color disappears. Then click the PINK button below to enter your reading.",
      "add_mo": "Now add Methyl Orange indicator (D key). The solution will turn Yellow.",
      "reach_v2": "Titrate until the yellow turns Red. Click the ORANGE button to enter your final reading.",
      "submit_calc": "Titration complete! Click the GREEN button below. You must calculate the mass of Carbonate/Bicarbonate using your readings."
    };
    let hintText = hints[currentTask.id] || "Follow the laboratory manual steps.";
    text("💡 INSTRUCTION:\n" + hintText, panelX + 30, 195, panelW - 60);
  }

  // 5. Mistakes Log (Moved lower and limited to avoid overlap)
  if (penalties.length > 0) {
    fill(255, 100, 100); textStyle(BOLD); textSize(13);
    text("⚠️ MISTAKES:", panelX + 20, 310);

    // Use a smaller font and limit display to last 4 mistakes
    textSize(10); textStyle(NORMAL);
    let displayList = penalties.slice(-4);
    displayList.forEach((p, i) => {
      text(p, panelX + 20, 335 + (i * 18));
    });
  }

  // 6. Action Buttons are drawn by drawEndpointButtons at Y=500
  drawEndpointButtons(panelX + 20, 510, panelW - 40);
}

function drawEndpointButtons(x, y, w) {
  const flask = Object.values(vessels).find(v => v.type === 'conical_flask');
  // Allow button even if volume is small to avoid logic traps
  if (!flask) return;

  if (idIsDone("add_pp") && !idIsDone("reach_v1")) {
    drawButton(x, y, w, 45, "ENTER V1 READING", [255, 105, 180]);
  }
  else if (idIsDone("add_mo") && !idIsDone("reach_v2")) {
    drawButton(x, y, w, 45, "ENTER V2 READING", [255, 160, 0]);
  }
  else if (idIsDone("reach_v2") && !idIsDone("submit_calc")) {
    // Vibrant green to ensure it's noticed
    drawButton(x, y, w, 45, "SUBMIT CALCULATIONS", [0, 200, 100]);
  }
}

function drawButton(x, y, w, h, label, col) {
  fill(...col); rect(x, y, w, h, 8);
  fill(255); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(12);
  text(label, x + w / 2, y + h / 2);
}


function drawControlsPanel() {
  if (!controlsVisible) return;

  const panelW = 220, panelH = 175; // Increased height
  // POSITION: Bottom-Center (Shifted right of the catalog)
  const x = 380;
  const y = height - panelH - 20;

  fill(15, 25, 45, 230);
  stroke(255, 50);
  rect(x, y, panelW, panelH, 12);

  fill(255); noStroke(); textAlign(LEFT);
  textSize(14); textStyle(BOLD);
  text('⌨️ CONTROLS', x + 15, y + 25);

  textSize(11); textStyle(NORMAL);
  fill(200, 220, 255);

  let startY = y + 50;
  text('↑ / ↓      : Tilt Bottle', x + 15, startY);
  text('S (Hold)   : Drain / Zeroing', x + 15, startY + 22);
  text('SPACE      : Titrate into Flask', x + 15, startY + 44);
  text('D Key      : Add Indicator Drop', x + 15, startY + 66);
  text('R / T      : Remove / Tare', x + 15, startY + 88);
  text('W (Hold)   : Swirl Flask', x + 15, startY + 110);
  text('↑ / ↓      : Tilt / Adjust Height', x + 15, startY + 132);
}

function drawClearShelfButton() {
  if (!labSurfaces) return;

  const shelf = labSurfaces.shelfTop;
  const x = shelf.maxX - 25;
  const y = shelf.y - 35;
  const r = 24;

  clearShelfButton = { x, y, r };

  // Only show if there are items on shelves
  const itemsOnShelves = Object.values(vessels).some(v =>
    v.surface && (v.surface === labSurfaces.shelfTop || v.surface === labSurfaces.shelfBottom)
  );

  if (!itemsOnShelves) return;

  const hover = dist(mouseX, mouseY, x, y) < r;

  push();
  // Glassmorphic background
  fill(hover ? [100, 200, 255, 180] : [255, 255, 255, 120]);
  stroke(255, 150);
  strokeWeight(2);
  if (hover) {
    drawingContext.shadowColor = 'rgba(100, 200, 255, 0.8)';
    drawingContext.shadowBlur = 15;
  }
  circle(x, y, r * 2);

  // Icon (Broom/Sweep)
  textAlign(CENTER, CENTER);
  textSize(20);
  text('🧹', x, y);

  if (hover) {
    drawHintBubble(x - 60, y, "Sweep shelves clean");
  }
  pop();
}

function clearShelves() {
  if (!labSurfaces) return;
  let clearedCount = 0;

  Object.values(vessels).forEach(v => {
    const isOnShelf = v.surface && (
      v.surface === labSurfaces.shelfTop ||
      v.surface === labSurfaces.shelfBottom
    );

    if (isOnShelf) {
      // Start the "Poof" animation
      v.vanish = 0.99;
      // Add particles
      createParticles(v.x, v.y, 10, 'bubble');
      clearedCount++;
    }
  });

  if (clearedCount > 0) {
    console.log(`Magically cleared ${clearedCount} items from shelves.`);
  }
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
    text(tab.label, panelX + i * tabW + tabW / 2, tabY + tabH / 2);
  });

  // Active catalog content
  const innerX = panelX + 20, innerY = panelY + 55;
  const activeCatalog = currentCatalogTab === 'apparatus' ? apparatusCatalog : chemicalCatalog;
  activeCatalog.drawPanel(innerX, innerY, 300, height - 160);
}


// ======================================================
// EVENTS
// ======================================================
function mousePressed() {
  // --- CLICK: CLEAR SHELF BUTTON ---
  if (clearShelfButton) {
    if (dist(mouseX, mouseY, clearShelfButton.x, clearShelfButton.y) < clearShelfButton.r) {
      clearShelves();
      return;
    }
  }

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
  // --- CHECK CLOSE ZOOM BUTTON (Synced with new Top-Right position) ---
  const burette = Object.values(vessels).find(v => v.type === 'burette');

  if (burette) {
    if (userClosedZoom) {
      // --- LOGIC TO OPEN (Circular Detection) ---
      const iconX = burette.x + 35;
      const iconY = burette.y - 120;

      if (dist(mouseX, mouseY, iconX, iconY) < 18) {
        userClosedZoom = false;
        console.log("Zoom View Restored");
        return;
      }
    } else {
      // --- LOGIC TO CLOSE (Matches Draw Function) ---
      const zoomX = burette.x + 180;
      const zoomY = burette.y - 140;
      const closeBtnX = zoomX + 65;
      const closeBtnY = zoomY - 65;

      if (dist(mouseX, mouseY, closeBtnX, closeBtnY) < 15) {
        userClosedZoom = true;
        return;
      }
    }
  }
  const panelW = 280, margin = 20, btnX = width - panelW - margin + 20;
  // We check Y=510 to 560 now to match the new DataPanel layout
  if (mouseX > btnX && mouseX < btnX + (panelW - 40) && mouseY > 510 && mouseY < 560) {
    if (idIsDone("add_pp") && !idIsDone("reach_v1")) {
      manager.openV1Input();
    } else if (idIsDone("add_mo") && !idIsDone("reach_v2")) {
      manager.openV2Input();
    } else if (idIsDone("reach_v2") && !idIsDone("submit_calc")) {
      console.log("Opening Calculation Modal...");
      manager.openCalculationModal();
    }
    return;
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
    if (mouseX > v.x - v.w / 2 && mouseX < v.x + v.w / 2 &&
      mouseY > v.y - v.h / 2 && mouseY < v.y + v.h / 2) {
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
    if (isDragging.mountedTo) {
      // Manual sliding removed for keyboard keys: [ and ]
      // isDragging.clampOffset = constrain(mouseY - stand.y, -stand.h * 0.5, stand.h * 0.3);
      // isDragging.y = stand.y + isDragging.clampOffset;
      // isDragging.x = stand.x - stand.w * 0.12; 
    } else {
      isDragging.x = mouseX;
      isDragging.y = mouseY;
    }
    isDragging.vy = 0;
  }
}

function mouseReleased() {
  if (isDragging) {
    const burette = Object.values(vessels).find(v => v.type === 'burette');

    if (burette) {
      // 1. PRECISION FUNNEL SNAP (TOP)
      if (isDragging.type === 'funnel') {
        const snapDist = dist(isDragging.x, isDragging.y, burette.x + BURETTE_GLASS_X_OFFSET, burette.y - burette.h * 0.46);
        if (snapDist < 50) {
          isDragging.x = burette.x + BURETTE_GLASS_X_OFFSET; // Snaps to glass
          isDragging.y = burette.y - burette.h * 0.58; // Higher (0.58 instead of 0.51)
          isDragging.isAttachedTo = burette.id;
          burette.hasFunnel = true;
          return;
        }
      }

      // 2. PRECISION BEAKER/FLASK SNAP (BOTTOM)
      if (isDragging.type === 'beaker' || isDragging.type === 'conical_flask') {
        // ALIGNMENT FIX: Snaps exactly under the glass tube offset
        const snapX = burette.x + BURETTE_GLASS_X_OFFSET;
        const dripTipY = burette.y + 120;
        const snapY = height * 0.72;

        if (dist(isDragging.x, isDragging.y, snapX, dripTipY) < 70 && dripTipY <= snapY - 80) {
          isDragging.x = snapX;
          isDragging.y = snapY - isDragging.h / 2;
          isDragging.vy = 0;
          isDragging.surface = { y: snapY };
          console.log("Receiver locked below tube");
        }
      }
    }

    isDragging.dragging = false;

    // 3. COMMON STAND MOUNTING
    if (isDragging.type === 'burette_tube') {
      const stand = Object.values(vessels).find(s => s.type === 'common_stand' && dist(isDragging.x, isDragging.y, s.x - s.w * 0.18, s.y) < 60);
      if (stand) {
        isDragging.mountedTo = stand.id;
        isDragging.clampOffset = constrain(isDragging.y - stand.y, -stand.h * 0.5, stand.h * 0.3);
        isDragging.x = stand.x - stand.w * 0.18;
        console.log("Tube mounted to stand");
      }
    }

    // 4. BURETTE TUBE SNAPPING (Funnel/Flask)
    if (isDragging.type === 'funnel' || isDragging.type === 'beaker' || isDragging.type === 'conical_flask') {
      const tube = Object.values(vessels).find(v => v.type === 'burette_tube' && v.mountedTo);
      if (tube) {
        if (isDragging.type === 'funnel') {
          const snapDist = dist(isDragging.x, isDragging.y, tube.x, tube.y - tube.h * 0.46);
          if (snapDist < 50) {
            isDragging.x = tube.x;
            isDragging.y = tube.y - tube.h * 0.58; // Higher (0.58 instead of 0.51)
            isDragging.isAttachedTo = tube.id;
            tube.hasFunnel = true;
            return;
          }
        } else {
          const snapY = height * 0.72;
          const snapDist = dist(isDragging.x, isDragging.y, tube.x, tube.y + tube.h * 0.4);
          const dripTipY = tube.y + tube.h * 0.4;

          if (snapDist < 70 && dripTipY <= snapY - 80) {
            isDragging.x = tube.x;
            isDragging.y = snapY - isDragging.h / 2;
            isDragging.vy = 0;
            isDragging.surface = { y: snapY };
          }
        }
      }
    }

    isDragging = null;
  }
}

function handleBuretteDrainage() {
  if (!keyIsDown(83)) return;
  const b = Object.values(vessels).find(v => (v.type === 'burette' || (v.type === 'burette_tube' && v.mountedTo)));
  if (!b || b.targetVolume <= 0) return;

  const snapX = b.type === 'burette' ? (b.x + BURETTE_GLASS_X_OFFSET) : b.x;
  const dripTipY = b.type === 'burette' ? (b.y + 120) : (b.y + b.h * 0.4);

  const waste = Object.values(vessels).find(v => (v.type === 'beaker' || v.type === 'conical_flask') && dist(v.x, v.y, snapX, dripTipY) < 80);
  let rate = keyIsDown(SHIFT) ? 0.2 : 0.01;
  let amt = rate * (deltaTime / 100);

  b.targetVolume = max(0, b.targetVolume - amt);
  if (waste && waste.targetVolume < waste.capacity) {
    waste.targetVolume += amt;
    waste.turbulence = min((waste.turbulence || 0) + 1, 3); // Ripples in waste beaker
    b.hint = "Draining into Beaker";
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
  // Inside keyPressed()
  if (keyL === 'd' && isDragging) {
    // Use a wider distance (120) because students drag bottles loosely
    const target = Object.values(vessels).find(v =>
      (v.type === 'conical_flask' || v.type === 'beaker') && dist(isDragging.x, isDragging.y, v.x, v.y) < 120
    );

    if (target) {
      if (isDragging.chemicalId === 'phenolphthalein') {
        target.contents.pp_drops += 1;
        createParticles(isDragging.x, isDragging.y + 30, 2, 'drip');
        console.log("SUCCESS: PP drops added to Brain. Count:", target.contents.pp_drops);
      } else if (isDragging.chemicalId === 'methyl_orange') {
        target.contents.mo_drops += 1;
        createParticles(isDragging.x, isDragging.y + 30, 2, 'drip');
        console.log("SUCCESS: MO drops added to Brain. Count:", target.contents.mo_drops);
      }
    } else {
      console.log("HINT: Move bottle closer to the flask center to drop.");
    }
  }


  // 5. TITRATION (SPACE BAR)
  // Note: In p5.js, keyPressed only fires ONCE per press. 
  // For continuous titration, the logic below is better placed in the draw() loop 
  // using keyIsDown(32), but here is the corrected logic for Phase 1:
  if (key === ' ' || keyCode === 32) {
    const burette = Object.values(vessels).find(v => (v.type === 'burette' || (v.type === 'burette_tube' && v.mountedTo)));
    if (!burette) return;
    const snapX = burette.type === 'burette' ? (burette.x + BURETTE_GLASS_X_OFFSET) : burette.x;
    const dripTipY = burette.type === 'burette' ? (burette.y + 120) : (burette.y + burette.h * 0.4);

    const receiver = Object.values(vessels).find(v =>
      (v.type === 'conical_flask' || v.type === 'beaker') &&
      dist(v.x, v.y, snapX, dripTipY) < 80
    );

    if (burette && receiver) {
      const distY = abs(dripTipY - receiver.y + receiver.h / 2); // Distance from tip to flask top
      const isTooHigh = distY > 150; // Very forgiving gap of 150px

      const flow = keyIsDown(SHIFT) ? 0.4 : 0.1; // Slower for precision
      if (burette.targetVolume >= flow && receiver.targetVolume < receiver.capacity) {
        burette.targetVolume -= flow;

        if (isTooHigh) {
          // Spilling logic
          manager.addPenalty("spilling", 5, "Burette tip is too high above the flask, causing liquid spill.");
          createParticles(snapX, dripTipY, 2, 'drip');
          // Liquid is lost, not added to receiver
        } else {
          receiver.targetVolume += flow;
          studentVolume += flow;
          receiver.contents.hcl_vol += flow;
          receiver.turbulence = min((receiver.turbulence || 0) + 0.3, 2);
        }

        // USE DROPLETS INSTEAD OF STREAM
        drawDroplets(snapX, dripTipY - 10, receiver.x, receiver.y - 15, color(255, 160, 100));
      }
    }
  }
}

//Burette filling logic
function handleBuretteFilling() {
  if (!isDragging || isDragging.type !== 'bottle') return;

  const burette = Object.values(vessels).find(v => (v.type === 'burette' || (v.type === 'burette_tube' && v.mountedTo)));
  if (!burette) return;

  // Align target with the glass tube instead of the stand rod
  const buretteTopX = burette.type === 'burette' ? (burette.x + BURETTE_GLASS_X_OFFSET) : burette.x;
  const buretteTopY = burette.y - (burette.h * 0.46);
  const distance = dist(mouseX, mouseY, buretteTopX, buretteTopY);

  if (distance < 70) {
    // 1. Requirement Check
    if (!burette.hasFunnel) {
      isDragging.hint = "⚠️ Needs Funnel";
      return;
    }

    // 2. Hint Logic (Dynamic based on volume)
    if (burette.targetVolume > burette.capacity) {
      isDragging.hint = "⚠️ OVERFILLED! Drain to 0.00 using 'S'";
    } else {
      isDragging.hint = "Arrows ↑/↓ to Tilt & Pour";
    }

    // 3. Tilt Physics Logic
    if (keyIsDown(UP_ARROW)) {
      isDragging.tiltAngle = constrain((isDragging.tiltAngle || 0) + 1.5, 0, 85);
    } else if (keyIsDown(DOWN_ARROW)) {
      isDragging.tiltAngle = constrain((isDragging.tiltAngle || 0) - 4, 0, 85);
    } else {
      isDragging.tiltAngle = lerp(isDragging.tiltAngle || 0, 0, 0.1);
    }

    // 4. Flow Calculation
    // Max flow is capped for precision; actualFlow uses deltaTime for frame-rate independence
    let flowRate = map(isDragging.tiltAngle || 0, 30, 85, 0, 0.25, true);
    let actualFlow = flowRate * (deltaTime / 60);

    if (flowRate > 0 && isDragging.targetVolume > 0) {
      // NEW: Allow filling up to 2mL past capacity so student can make mistakes
      if (burette.targetVolume < burette.capacity + 2) {

        burette.targetVolume += actualFlow;
        isDragging.targetVolume -= actualFlow;

        // Sync Chemical Metadata to the Burette
        burette.color = isDragging.color;
        burette.chemicalId = isDragging.chemicalId;
        burette.chem = isDragging.chem;

        // Visual Feedback - Thinner stream for filling
        drawPouringStream(isDragging.x, isDragging.y, buretteTopX, buretteTopY - 5, color(...isDragging.color), 3);

        // Auto-reopen zoom so the student can see the level relative to the 0.00 mark
        userClosedZoom = false;
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
  // Common coordinates relative to burette
  const snapX = v.type === 'burette' ? (v.x + BURETTE_GLASS_X_OFFSET) : v.x;
  const zoomX = snapX + 180;
  const zoomY = v.y - 140;
  const zoomSize = 140;

  // --- MINIMIZED STATE: Show "Open Zoom" Button ---
  if (userClosedZoom) {
    push();
    // Positioned right next to the burette tube for easy access
    const iconX = snapX + 35;
    const iconY = v.y - 120;
    translate(iconX, iconY);

    // 1. Subtle Shadow
    noStroke(); fill(0, 50);
    circle(2, 2, 36);

    // 2. Icon Body (Matches your professional dark blue theme)
    fill(40, 80, 150);
    stroke(255, 200);
    strokeWeight(2);
    circle(0, 0, 36);

    // 3. Magnifying Glass Icon
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(18);
    text("🔍", 0, 0);

    // 4. Hover effect
    if (dist(mouseX, mouseY, iconX, iconY) < 18) {
      fill(255, 50);
      circle(0, 0, 36);
    }
    pop();
    return;
  }

  // --- OPEN STATE: The full precision view ---
  push();
  // 1. Label Background
  fill(15, 25, 45, 200); noStroke();
  rect(zoomX - 75, zoomY + zoomSize / 2 + 5, 150, 45, 8);

  // 2. Zoom Circle & Masking
  fill(255); stroke(40); strokeWeight(3);
  circle(zoomX, zoomY, zoomSize);
  drawingContext.save();
  noFill(); circle(zoomX, zoomY, zoomSize);
  drawingContext.clip();

  translate(zoomX, zoomY);
  scale(6);

  // Tube & Scale
  const reading = v.capacity - v.volume;
  noFill(); stroke(100, 100); strokeWeight(0.4);
  rect(-10, -50, 20, 100);

  const spacing = 20;
  let startML = max(0, floor(reading) - 2);
  let endML = min(v.capacity, ceil(reading) + 2);

  for (let i = startML * 10; i <= endML * 10; i++) {
    let val = i / 10;
    let lineY = (val - reading) * spacing;
    stroke(0, 180);
    if (i % 10 === 0) {
      line(-10, lineY, 0, lineY); fill(0); noStroke(); textSize(3); text(nf(val, 1, 0), 2, lineY + 1);
    } else if (i % 5 === 0) line(-10, lineY, -4, lineY);
    else line(-10, lineY, -7, lineY);
  }

  // Liquid
  let c = v.color ? color(...v.color) : color(255, 120, 80);
  fill(red(c), green(c), blue(c), 140); noStroke();
  rect(-10, 0, 20, 100);
  fill(red(c), green(c), blue(c), 200); arc(0, 0, 20, 5, 0, PI);

  drawingContext.restore();
  pop();

  // 3. DRAW CLOSE BUTTON ('X')
  fill(200, 0, 0); stroke(255); strokeWeight(1.5);
  circle(zoomX + 65, zoomY - 65, 18);
  fill(255); noStroke(); textAlign(CENTER, CENTER); textSize(10); text("X", zoomX + 65, zoomY - 65);

  // 4. Reading Text
  fill(255); textAlign(CENTER); textSize(11);
  text(`V: ${nf(reading, 1, 2)} mL`, zoomX, zoomY + zoomSize / 2 + 22);

  if (v.volume > v.capacity) {
    fill(255, 50, 50); textStyle(BOLD);
    text("⚠️ OVERFILLED", zoomX, zoomY + zoomSize / 2 + 54);
    textStyle(NORMAL);
  }

  textSize(9); fill(180); text("Read bottom of meniscus", zoomX, zoomY + zoomSize / 2 + 38);
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
      v.targetVolume = 0;
    }
  }
  else if (type === 'pipette') {
    const cap = askCapacity('pipette');
    if (!cap) return;
    v = makeResponsiveVessel(nextId('pipette'), 'pipette');
    if (v) {
      v.capacity = cap;
      v.title = `${cap} mL Pipette`;
      v.targetVolume = 0;
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

    v.targetVolume = 0; // Target is now 0
    v.contents.hcl_vol = 0;
  }
  else if (type === 'conical_flask') {
    v = makeResponsiveVessel(nextId('conical_flask'), 'conical_flask');
    if (v) v.title = 'Conical Flask';
  }
  else if (type === 'burette_tube') {
    const cap = askCapacity('burette') || 50;
    v = makeResponsiveVessel(nextId('burette_tube'), 'burette_tube');
    if (v) {
      v.capacity = cap;
      v.title = `${cap} mL Burette Tube`;
      v.targetVolume = 0;
      v.isBurette = true; // Flag for shared logic
      v.mountedTo = null;
      v.clampOffset = 0; // Vertical offset from clamp
    }
  }
  else if (type === 'common_stand') {
    v = makeResponsiveVessel(nextId('common_stand'), 'common_stand');
    if (v) {
      v.title = 'Common Stand';
      v.y -= 40; // Spawn slightly higher on the table
    }
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

function drawHintBubble(x, y, txt) {
  if (!txt) return;

  push();
  translate(x, y);

  // 1. Calculate breathing effect for scale and glow
  let pulse = sin(frameCount * 0.1) * 5;

  // 2. Measure text width for dynamic bubble sizing
  textSize(12);
  let txtW = textWidth(txt) + 24;
  let txtH = 24;

  // 3. Draw Shadow
  noStroke();
  fill(0, 40);
  rect(-txtW / 2 + 2, -txtH / 2 + 2, txtW, txtH, 12);

  // 4. Draw Bubble (Dark Slate Blue looks very professional)
  fill(40, 60, 100, 230);
  stroke(255, 100);
  strokeWeight(1);
  rect(-txtW / 2, -txtH / 2, txtW, txtH, 12);

  // 5. Draw Text
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);

  // Replace standard arrows with cleaner symbols if they exist in string
  let cleanTxt = txt.replace('UP', '↑').replace('DOWN', '↓');
  text(cleanTxt, 0, 0);

  pop();
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
  bottle.targetVolume = 100;
  bottle.capacity = 250;
  bottle.isChemical = true;

  switch (chem.id) {
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
