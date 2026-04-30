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
// Try finding the global variable first, then fallback to the script tag (json_script)
var experimentData = typeof EXPERIMENT_CONFIG !== 'undefined' ? EXPERIMENT_CONFIG : null;
if (!experimentData) {
  const configEl = document.getElementById('experiment-config-data');
  if (configEl) {
    try {
      experimentData = JSON.parse(configEl.textContent);
      console.log("Config loaded from script element.");
    } catch (e) {
      console.error("Failed to parse experiment-config-data element:", e);
    }
  }
}

const TARGET_V1 = experimentData?.targets?.v1 || 10.0;
const TARGET_V2 = experimentData?.targets?.v2 || 25.0;

// Wire up the dynamic catalogs so getApparatusProps() works
window.APPARATUS_CATALOG = experimentData?.catalogs?.apparatus || [];
window.CHEMICAL_CATALOG  = experimentData?.catalogs?.chemicals || [];
window.REACTION_CATALOG  = experimentData?.catalogs?.reactions || [];

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
    this.buretteProperlyZeroed = false;
    this.recordedV1 = 0;
    this.recordedV2 = 0;
    this.swirlNeglectTimer = 0;
    this.rulesValidated = false;
    this.currentStepHint = "";

    this.currentStepHint = "";
  }

  // This MUST be called inside the p5.js draw() loop
  update() {
    const flask = Object.values(vessels).find(v => v.type === 'conical_flask');
    const burette = Object.values(vessels).find(v => (v.type === 'burette' || (v.type === 'burette_tube' && v.mountedTo)));

    // GENERIC BURETTE PENALTIES
    if (burette && (this.config?.type === 'double_indicator' || this.config?.type === 'simple_titration')) {
      let reading = abs(burette.capacity - burette.targetVolume);
      if (reading <= 0.3) this.buretteProperlyZeroed = true;

      if (keyIsDown(32)) {
        const snapX = burette.type === 'burette' ? (burette.x + BURETTE_GLASS_X_OFFSET) : burette.x;
        const dripTipY = burette.type === 'burette' ? (burette.y + 120) : (burette.y + burette.h * 0.4);

        let flaskUnderneath = false;
        if (flask && dist(flask.x, flask.y, snapX, dripTipY) < 100) {
            flaskUnderneath = true;
        }

        if (flaskUnderneath) {
          if (!this.buretteProperlyZeroed && reading > 0.3) {
            this.addPenalty("no_zeroing", 15, "Titrating without zeroing the burette first.");
          }
        } else {
            this.addPenalty("spill_titrant", 5, "Titrating without a flask underneath. Titrant spilled.");
        }
        
        let funnelNear = Object.values(vessels).find(v => v.type === 'funnel' && dist(v.x, v.y, burette.x, burette.y - burette.h/2) < 80);
        if (funnelNear) {
            this.addPenalty("funnel_in_burette", 5, "Titrating with funnel still attached to burette.");
        }
      }

      if (keyIsDown(32) && !keyIsDown(87)) {
        this.swirlNeglectTimer++;
        if (this.swirlNeglectTimer > 300) { // ~5 seconds
          this.addPenalty("no_swirl", 10, "Titrating without swirling the flask (Hold 'W').");
        }
      } else {
        if (keyIsDown(87)) this.swirlNeglectTimer = 0;
      }
    }

    // CHECK INDICATOR ADDED BEFORE ANALYTE
    if (flask && flask.contents && flask.contents.indicatorsAdded && flask.contents.indicatorsAdded.length > 0) {
        if ((flask.contents.mixture_vol || 0) < 1) {
            this.addPenalty("indicator_empty_flask", 5, "Added indicator before analyte. Always add analyte first.");
        }
    }

    // EVALUATE DYNAMIC RULES - SEQUENTIAL LOCK
    let m = this.milestones[currentStepIndex];
    if (m && !this.completedIds.has(m.id)) {
      let allRulesPassed = true;
      this.currentStepHint = ""; // Reset hint for current frame

      if (m.rules && m.rules.length > 0) {
        for (let rule of m.rules) {
          let targetVessel = Object.values(vessels).find(v => 
            v.type === rule.target_vessel || v.chem === rule.target_vessel ||
            (rule.target_vessel === "burette" && (v.type === "burette_tube" || v.type === "burette")) ||
            (rule.target_vessel === "burette_tube" && (v.type === "burette_tube" || v.type === "burette"))
          );
          
          if (!targetVessel) {
            allRulesPassed = false;
            this.currentStepHint = `X Missing: ${rule.target_vessel.replace('_',' ')}`;
            break;
          }

          // Extract the property value to check generically
          let propValue = 0;
          if (rule.target_property === "reading") { 
            propValue = targetVessel.capacity - targetVessel.targetVolume;
          } else if (rule.target_property === "volume") {
            propValue = targetVessel.targetVolume; 
          } else if (rule.target_property === "pH") {
            propValue = targetVessel.contents ? (targetVessel.contents.pH || 7.0) : 7.0;
          } else if (targetVessel.contents) {
            // Check if property is a chemical name or a special indicator tag
            const chemRef = targetVessel.contents.chemicals ? targetVessel.contents.chemicals[rule.target_property] : null;
            if (chemRef) {
              propValue = chemRef.volume;
            } else if (targetVessel.contents.indicators && targetVessel.contents.indicators[rule.target_property] !== undefined) {
              // Indicators stored as drop counts
              propValue = targetVessel.contents.indicators[rule.target_property];
            } else {
              propValue = 0;
              if (rule.operator !== "<" && rule.operator !== "<=") {
                  this.currentStepHint = `X Missing chemical: ${rule.target_property}`;
              }
            }
          }

          // Evaluate generic operator string
          let rulePassed = false;
          switch (rule.operator) {
            case ">=": rulePassed = (propValue >= rule.value); break;
            case ">":  rulePassed = (propValue > rule.value); break;
            case "<=": rulePassed = (propValue <= rule.value); break;
            case "<":  rulePassed = (propValue < rule.value); break;
            case "==": rulePassed = (abs(propValue - rule.value) < 0.2); break; // 0.2 tolerance for vol
            case "!=": rulePassed = (abs(propValue - rule.value) > 0.2); break;
            case "CONTAINS": rulePassed = (propValue > 0.01); break;
          }

          if (!rulePassed) {
            allRulesPassed = false;
            if (!this.currentStepHint) {
                let opLabel = rule.operator === "==" ? "exactly" : (rule.operator === ">=" ? "at least" : rule.operator);
                this.currentStepHint = `X ${rule.target_property} should be ${opLabel} ${rule.value}`;
            }
            break;
          }
        }
      } else {
        allRulesPassed = true;
      }

      // GLOBAL PENALTIES: Physical Mistakes
      Object.values(vessels).forEach(v => {
          // Overfill check
          if (v.targetVolume > v.capacity * 1.05 && v.type !== 'burette' && v.type !== 'burette_tube') {
              this.addPenalty("overfill_" + v.type, 10, `Overfilled ${v.type.replace('_',' ')}. Liquid spilled on workbench!`);
          }
      });

      // --- ASSESSMENT PROGRESSION ---
      const hasPrompts = (m.observation_prompts && m.observation_prompts.length > 0) || 
                         (m.calculation_prompts && m.calculation_prompts.length > 0);

      if (hasPrompts) {
          this.rulesValidated = allRulesPassed;
      } else {
          if (allRulesPassed) {
            console.log(`[MarkingManager] Auto-advancing milestone: ${m.id}`);
            this.completeMilestone(m.id);
          }
      }
    }
  }

  handleManualSubmit() {
    let m = this.milestones[currentStepIndex];
    if (!m) return;

    // RULE PENALTY: If student submits before validation rules are met (e.g. premature endpoint)
    if (!this.rulesValidated) {
        this.addPenalty("premature_submit_" + m.id, 15, `Premature assessment: Rules for ${m.desc} were not met.`);
    }

    // Proceed with assessment prompts regardless of penalty
    this.completeMilestone(m.id);
  }

  completeMilestone(id) {
    console.log(`[MarkingManager] Attempting to complete milestone: ${id}`);
    if (this.completedIds.has(id)) {
        console.warn(`[MarkingManager] Milestone ${id} already completed.`);
        return;
    }
    let m = this.milestones.find(item => item.id === id);
    if (!m) return;

    // Trigger Generic Observation Prompts Sequentially
    if (m.observation_prompts && m.observation_prompts.length > 0) {
      for (let p of m.observation_prompts) {
        let val = window.prompt(`LAB OBSERVATION:\n${p.description}`);
        if (val !== null && val.trim() !== "") {
          let userVal = parseFloat(val);
          let trueVal = 0;
          if (p.title.toLowerCase() === 'v1' && experimentData?.targets?.v1) {
             trueVal = experimentData.targets.v1;
          } else if (p.title.toLowerCase() === 'v2' && experimentData?.targets?.v2) {
             trueVal = experimentData.targets.v2;
          } else {
             let targetVessel = Object.values(vessels).find(v => v.type === p.target_vessel || (p.target_vessel === "burette" && (v.type === "burette" || (v.type === "burette_tube" && v.mountedTo))));
             if (targetVessel) {
                if (p.target_property === "reading") trueVal = targetVessel.capacity - targetVessel.targetVolume;
                else if (p.target_property === "capacity") trueVal = targetVessel.targetVolume;
                else if (targetVessel.contents && targetVessel.contents.chemicals && targetVessel.contents.chemicals[p.target_property]) {
                   trueVal = targetVessel.contents.chemicals[p.target_property].volume;
                }
             }
          }
          if (abs(userVal - trueVal) > p.tolerance) {
             this.addPenalty(`obs_${p.title}`, p.penalty_points, `Inaccurate observation for ${p.title}. Expected approx: ${trueVal.toFixed(2)}`);
          }
          this.studentObservations = this.studentObservations || {};
          this.studentObservations[p.title] = userVal;
        }
      }
    }

    // Trigger Generic Calculation Prompts Sequentially
    if (m.calculation_prompts && m.calculation_prompts.length > 0) {
      for (let c of m.calculation_prompts) {
        let val = window.prompt(`CALCULATION:\n${c.description}`);
        if (val !== null && val.trim() !== "") {
          let userVal = parseFloat(val);
          let parsedFormula = c.formula;
          if (this.studentObservations) {
             for (let key in this.studentObservations) {
                // simple variable substitution loop (replace var name with float)
                let re = new RegExp(`\\b${key}\\b`, 'g');
                parsedFormula = parsedFormula.replace(re, this.studentObservations[key]);
             }
          }
          let trueVal = NaN;
          try { trueVal = eval(parsedFormula); } catch(e) { console.error("Formula eval failed due to missing/invalid variables:", e); }
          
          if (isNaN(trueVal)) {
             console.error("Formula misconfigured by instructor. Skipping penalty for " + c.title);
          } else if (abs(userVal - trueVal) > c.tolerance) {
             this.addPenalty(`calc_${c.title}`, c.points, `Incorrect calculation for ${c.title}. The correct derived value was roughly ${trueVal.toFixed(3)}.`);
          }
          this.studentCalculations = this.studentCalculations || {};
          this.studentCalculations[c.title] = userVal;
        }
      }
    }

    this.completedIds.add(id);
    sessionMarks += (m.points || 0);
    currentStepIndex = Math.min(this.milestones.length - 1, this.completedIds.size);
    console.log(`[MarkingManager] SUCCESS: Completed ${m.title}. Next index: ${currentStepIndex}`);
    
    // Check if this was the last milestone in the sequence
    if (this.completedIds.size >= this.milestones.length && this.milestones.length > 0) {
      alert("All milestones complete! Committing final experiment results.");
      this.saveResults(); // Autonomous generic dispatch
    }
  }

  addPenalty(id, points, reason) {
    if (this.mistakesMade.has(id)) return;
    this.mistakesMade.add(id);
    sessionMarks = Math.max(0, sessionMarks - (points || 0));
    if (typeof penalties !== 'undefined') penalties.push(`${id}: ${reason} (-${points} pts)`);
    console.warn(`[MarkingManager] PENALTY: -${points} pts. Reason: ${reason}`);
    
    if (typeof showToast !== 'undefined') showToast(`Mistake: ${reason} (-${points} pts)`, "warning");
  }

  saveResults() {
    const payload = {
      name: experimentData.name,
      totalScore: sessionMarks,
      observations: this.studentObservations || {},
      calculations: this.studentCalculations || {},
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
        if (data.module_id) {
          window.location.href = `/student/report/download/${data.module_id}/`;
        } else {
          window.location.href = "/student/lab/";
        }
      })
      .catch(err => console.error("Save error:", err));
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

  // Dynamic Apparatus Loading
  let dynamicApparatus = [];
  if (experimentData && experimentData.catalogs && experimentData.catalogs.apparatus) {
    dynamicApparatus = experimentData.catalogs.apparatus;
  }
  apparatusCatalog = new LabCatalog({ scale: 0.75, apparatus: dynamicApparatus });
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

  // Dynamic Chemical Loading
  let dynamicChemicals = [];
  if (experimentData && experimentData.catalogs && experimentData.catalogs.chemicals) {
    dynamicChemicals = experimentData.catalogs.chemicals.map(c => {
      // Parse hex color "#RRGGBB" to [R, G, B]
      let r = 200, g = 200, b = 200;
      if (c.color && c.color.startsWith('#')) {
        let hex = c.color.replace('#', '');
        if (hex.length >= 6) {
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
        }
      }
      return {
        id: c.name, // Use name as ID for matching rules
        label: c.name,
        name: c.name,
        formula: c.formula,
        conc: c.molarity ? c.molarity + 'M' : '',
        color: [r, g, b],
        is_indicator: c.is_indicator,
        low_ph_color: c.low_ph_color,
        high_ph_color: c.high_ph_color,
        transition_ph_range: c.transition_ph_range
      };
    });
  } else {
    // Fallback if no DB catalogs present
    dynamicChemicals = [
      { id: 'Sodium Carbonate + Bicarbonate', label: '25% Na₂CO₃+NaHCO₃', name: 'Sodium Carbonate + Bicarbonate', formula: 'Na₂CO₃ + NaHCO₃', conc: '25%', color: [220, 180, 100], is_indicator: false },
      { id: 'Hydrochloric Acid', label: '0.1M HCl (Burette)', name: 'Hydrochloric Acid', formula: 'HCl', conc: '0.1M', color: [255, 120, 80], is_indicator: false },
      { id: 'Phenolphthalein', label: 'Phenolphthalein', name: 'Phenolphthalein', formula: 'C₂₀H₁₄O₄', conc: '', color: [255, 180, 220], is_indicator: true },
      { id: 'Methyl Orange', label: 'Methyl Orange', name: 'Methyl Orange', formula: 'C₁₄H₁₄N₃NaO₃S', conc: '', color: [255, 160, 60], is_indicator: true },
      { id: 'Distilled Water', label: 'Distilled Water', name: 'Distilled Water', formula: 'H₂O', conc: '', color: [200, 220, 255] }
    ];
  }

  chemicalCatalog = new ChemicalCatalog(dynamicChemicals);

  // Expose global physics reactions from dynamic payload
  window.CHEMICAL_REACTIONS = (experimentData && experimentData.catalogs) ? experimentData.catalogs.reactions : [];

  // AUTO-SPAWN from Scene Builder initial_state
  spawnFromInitialState();
}

// ======================================================
// INITIAL STATE SPAWNER (From Scene Builder JSON)
// ======================================================
function spawnFromInitialState() {
  if (!experimentData || !experimentData.initial_state || !experimentData.initial_state.length) {
    console.log("No initial_state defined for this experiment.");
    return;
  }

  console.log("Spawning initial state:", experimentData.initial_state);

  experimentData.initial_state.forEach((item, index) => {
    const type = item.type;
    if (!type) return;

    // 1. Determine spawn location based on Scene Builder selection
    let spawnSurface = labSurfaces.table; // default
    if (item.location === 'shelfTop') spawnSurface = labSurfaces.shelfTop;
    else if (item.location === 'shelfBottom') spawnSurface = labSurfaces.shelfBottom;

    // 2. Calculate position
    // NEW: Prioritize item.x if provided by the builder, otherwise auto-arrange
    let targetX;
    if (item.x !== undefined && item.x !== null) {
      targetX = item.x;
    } else {
      const surfaceWidth = spawnSurface.maxX - spawnSurface.minX;
      const spacing = surfaceWidth / (experimentData.initial_state.length + 1);
      targetX = spawnSurface.minX + spacing * (index + 1);
    }

    const size = currentPositions.sizes[type] || currentPositions.sizes.beaker;
    const targetY = spawnSurface.y - (size.h / 2) - 5;
    const pos = findCollisionFreePosition(targetX, targetY, type);

    // 3. Create the vessel
    const id = nextId(type);
    let v = makeVessel(id, pos.x, pos.y, size.w, size.h, type, 'Empty', type, 0, 100);

    // 4. Set type-specific defaults
    if (type === 'beaker') {
      v.capacity = 250;
      v.title = '250 mL Beaker';
    } else if (type === 'conical_flask') {
      v.capacity = 250;
      v.title = 'Conical Flask';
    } else if (type === 'pipette') {
      v.capacity = 25;
      v.title = '25 mL Pipette';
    } else if (type === 'burette_tube') {
      v.capacity = 50;
      v.title = '50 mL Burette Tube';
      v.isBurette = true;
      v.mountedTo = null;
      v.clampOffset = 0;
    } else if (type === 'common_stand') {
      v.title = 'Common Stand';
    } else if (type === 'funnel') {
      v.title = 'Filter Funnel';
    } else if (type === 'wash_bottle') {
      v.chem = 'Distilled Water';
      v.capacity = 250;
      v.title = 'Wash Bottle';
    } else if (type === 'bottle') {
      v.capacity = 250;
      v.title = 'Empty Bottle';
    } else if (type === 'volumetric_flask') {
      v.capacity = 250;
      v.title = '250 mL Volumetric Flask';
    } else if (type === 'burette') {
      v.capacity = 50;
      v.title = '50 mL Burette';
      v.targetVolume = 0;
      v.contents.hcl_vol = 0;
    } else if (type === 'bunsen_burner') {
      v.title = 'Bunsen Burner';
    } else if (type === 'balance') {
      v.title = 'Analytical Balance';
      v.tareOffset = 0;
      v.rawWeight = 0;
      v.displayWeight = 0;
      v.mass = 0;
    } else if (type === 'crucible') {
      v.capacity = 20;
      v.title = 'Porcelain Crucible';
    } else if (type === 'hotplate') {
      v.title = 'Digital Hotplate';
      v.temperature = 25;
      v.heating = false;
    } else if (type === 'pH_meter') {
      v.title = 'Digital pH Meter';
      v.reading = 7.0;
    } else if (type === 'dropper') {
      v.capacity = 5;
      v.title = 'Glass Dropper';
    } else {
      v.title = type.replace(/_/g, ' ');
    }

    // 5. Fill with chemical - Support both new nested (initialContents) and old flat (chem/vol) structure
    let chemName = null;
    let chemVol = 0;

    if (item.initialContents && item.initialContents.type) {
      chemName = item.initialContents.type;
      chemVol = item.initialContents.volume || 0;
    } else if (item.chem) {
      // Fallback for flat structure
      chemName = item.chem;
      chemVol = item.vol || 0;
    }

    if (chemName) {
      // Look up color from the chemical catalog
      let chemColor = [200, 220, 255];
      if (chemicalCatalog && chemicalCatalog.chemicals) {
        const found = chemicalCatalog.chemicals.find(c => c.name === chemName || c.id === chemName);
        if (found && found.color) {
          chemColor = found.color;
        }
      }

      v.chem = chemName;
      v.chemicalId = chemName;
      v.color = chemColor;
      v.volume = chemVol;
      v.targetVolume = chemVol;

      // For bottles, mark as chemical bottle
      if (type === 'bottle') {
        v.isChemical = true;
        v.title = chemName;
      }

      // Initialize dynamic chemical dictionary
      v.contents.chemicals[chemName] = { volume: chemVol, color: chemColor };
      
      // TRIGGER Reaction Engine for initial state
      computeReaction(v);
    }

    vessels[v.id] = v;
    console.log(`Auto-spawned: ${v.title} at (${Math.round(pos.x)}, ${Math.round(pos.y)}) on ${item.location || 'table'}`);
  });

  // NEW: Auto-Mount Sweep - Link tubes to stands if they are near each other on spawn
  const stands = Object.values(vessels).filter(v => v.type === 'common_stand');
  const tubes = Object.values(vessels).filter(v => v.type === 'burette_tube');

  tubes.forEach(tube => {
    // Find a stand that is horizontally aligned (within 40px)
    const matchingStand = stands.find(s => Math.abs(s.x - tube.x) < 40);
    if (matchingStand) {
      tube.mountedTo = matchingStand.id;
      // Snap tube to stand position
      tube.x = matchingStand.x; 
      tube.y = matchingStand.y - (matchingStand.h * 0.1); 
      console.log(`Auto-mounted ${tube.id} to stand ${matchingStand.id}`);
    }
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
    // THE CHEMICAL BRAIN (Generic Liquid Matrix)
    // ======================================================
    contents: {
      chemicals: {},       // e.g. {'HCl': { volume: 20.0, color: [255,0,0] } }
      indicators: {},      // e.g. {'Phenolphthalein': 2} (drop count)
      indicatorsAdded: [], // Sequence of unique indicators added [e.g. 'Phenolphthalein', 'Methyl Orange']
      isRinsed: false,
      isContaminated: false,
      titrant_vol: 0,      // Tracking cumulative titrant added
      mixture_vol: 0,      // Tracking initial analyte volume
      pH: 7.0,
      temperature: 25.0,
      solidMass: 0
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
  if (!c) return v.color || [200, 220, 255, 100];
  
  if (frameCount % 120 === 0) console.log(`getTitrationColor for ${v.type}: pH=${c.pH}, indicators=${c.indicatorsAdded}`);

  // ABORT: If no mixture detected via tracking or chemical search
  let hasAnalyte = (c.mixture_vol > 0.1);
  if (!hasAnalyte && c.chemicals) {
      // Fallback: check chemical dictionary for common analyte terms
      hasAnalyte = Object.keys(c.chemicals).some(name => 
         name.toLowerCase().includes('mixture') || name.toLowerCase().includes('analyte') || name.toLowerCase().includes('carbonate')
      );
  }
  
  if (!hasAnalyte) return v.color || [200, 220, 255, 100];

  // --- 1. DYNAMIC UI-DRIVEN ENDPOINTS ---
  let v1_ph = 8.3; 
  let v2_ph = 4.0;
  let v1_color = experimentData?.targets?.v1_color || "#FFFFFF00"; 
  let v2_color = experimentData?.targets?.v2_color || "#FF4500";
  
  // Extract pH thresholds from milestone rules
  if (experimentData && experimentData.milestones) {
      const m1 = experimentData.milestones.find(m => m.id === "reach_v1" || m.id === "endpoint_1");
      if (m1 && m1.rules) {
          const r = m1.rules.find(rule => rule.target_property === "pH");
          if (r) v1_ph = r.value;
      }
      const m2 = experimentData.milestones.find(m => m.id === "reach_v2" || m.id === "endpoint_2");
      if (m2 && m2.rules) {
          const r = m2.rules.find(rule => rule.target_property === "pH");
          if (r) v2_ph = r.value;
      }
  }

  const isDouble = experimentData?.type === 'double_indicator' || (c.indicatorsAdded && c.indicatorsAdded.length > 1);

  // --- 2. Centralized pH (Calculated by computeReaction) ---
  let currentPH = c.pH || 7.0;

  // --- 3. UI-DRIVEN COLOR INTERPOLATION ---
  let baseCol = [230, 230, 250, 100]; // Base liquid
  // --- 3. UI-DRIVEN COLOR INTERPOLATION ---
  let r=baseCol[0], g=baseCol[1], b=baseCol[2], a=baseCol[3];
  
  let totalR=0, totalG=0, totalB=0, totalA=0, count=0;

  for (let chemName in c.chemicals) {
    const chemInfo = getChemicalInfo(chemName);
    if (!chemInfo || !chemInfo.is_indicator) continue;

    const lowTheme = hexToRgba(chemInfo.low_ph_color || "#FFFFFF00");
    const highTheme = hexToRgba(chemInfo.high_ph_color || "#FFFFFF00");
    
    // Logic: Indicators use their own internal colors by default.
    // We only use experiment v1_color/v2_color if they are explicitly set to something else.
    let targetRGB = lowTheme;
    let thresholdPH = v1_ph;
    
    const lowerName = chemName.toLowerCase();
    if (lowerName.includes('orange') || lowerName.includes('methyl') || lowerName.includes('brom')) {
        thresholdPH = v2_ph;
    }

    // Calculate factor (1.0 = Basic/Starting, 0.0 = Acidic/Endpoint)
    let factor = map(currentPH, thresholdPH - 0.5, thresholdPH + 1.5, 0, 1, true);
    if (isNaN(factor)) factor = 0;
    
    // Accumulate weighted color (Blending High/Low of the indicator)
    totalR += lerp(targetRGB[0], highTheme[0], factor);
    totalG += lerp(targetRGB[1], highTheme[1], factor);
    totalB += lerp(targetRGB[2], highTheme[2], factor);
    totalA += lerp(targetRGB[3], highTheme[3], factor);
    count++;
  }

  if (count > 0) {
      r = totalR / count;
      g = totalG / count;
      b = totalB / count;
      a = totalA / count;
  }

  // Final Safety Check for NaN
  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
      return [230, 230, 250, 100];
  }

  return [r, g, b, a];
}

function hexToRgba(hex) {
  hex = hex.replace('#', '');
  let r = 255, g = 255, b = 255, a = 180;
  if (hex.length >= 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
    if (hex.length >= 8) a = parseInt(hex.substring(6, 8), 16);
  }
  return [r, g, b, a];
}


// ======================================================
// DYNAMIC PROPERTIES HELPER
// ======================================================
function getApparatusProps(typeStr) {
    if (typeStr === 'chemical_bottle') {
        return { can_pour: true, can_measure_vol: false };
    }
    if (window.APPARATUS_CATALOG) {
        return window.APPARATUS_CATALOG.find(a => a.type === typeStr) || {};
    }
    return {};
}

// ======================================================
// PROXIMITY & GLOW SYSTEM
// ======================================================
function proximityCheck() {
  Object.values(vessels).forEach(v => {
    v.glow = 0;
    v.hint = '';

    if (v.type === 'pipette') {
      const bottle = Object.values(vessels).find(b => getApparatusProps(b.type).can_pour && !getApparatusProps(b.type).can_measure_vol && b.id !== v.id && near(v, b, 50));
      const receiver = Object.values(vessels).find(r => getApparatusProps(r.type).can_measure_vol && r.id !== v.id && near(v, r, 60));

      if (bottle) {
        v.glow = 1;
        v.hint = 'SHIFT = Suck';
      } else if (receiver) {
        v.glow = 1;
        v.hint = 'SHIFT = Pour'; 
      }
    }

    if (v.type === 'dropper') {
        const source = Object.values(vessels).find(b => (b.type === 'bottle' || b.type === 'chemical_bottle' || b.type === 'beaker') && b.id !== v.id && near(v, b, 45));
        const receiver = Object.values(vessels).find(r => (r.type === 'beaker' || r.type === 'conical_flask') && r.id !== v.id && near(v, r, 55));
        
        if (source) {
            v.glow = 1;
            v.hint = 'PRESS D = Fill Bulb';
        } else if (receiver && v.volume > 0.01) {
            v.glow = 1;
            v.hint = 'PRESS D = Add Drop';
        }
    }

    if (v.type === 'pH_meter') {
        const beaker = Object.values(vessels).find(b => getApparatusProps(b.type).can_measure_vol && b.id !== v.id && near(v, b, 50));
        if (beaker) {
            v.glow = 1;
            v.hint = 'Hover to read pH';
            v.reading = beaker.contents ? (beaker.contents.pH || 7.0) : 7.0;
        } else {
            v.reading = 7.0;
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
    const snapY = burette.surface ? burette.surface.y : (labSurfaces?.table?.y || 335);

    if (!v.dragging && dist(v.x, v.y + v.h / 2, snapX, snapY) < 50) {
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
      // Allow burette to overfill by 5mL realistically
      let maxCap = (v.type === 'burette' || v.type === 'burette_tube') ? v.capacity + 5 : v.capacity;
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

  const flask = Object.values(vessels).find(v => (v.type === 'conical_flask' || v.type === 'beaker') && near(isDragging, v, 70));
  if (flask && isDragging.type === 'bottle') {
    // Treat as generic dropper bottle: any bottle drops liquid into flask below it
    if (frameCount % 30 === 0) {
      if (typeof transferLiquid === "function") {
          transferLiquid(isDragging, flask, 0.05); // 1 drop = 0.05 mL
      }
      createParticles(isDragging.x, isDragging.y + 30, 2, 'drip');
    }
  }
}

function handleDropperInteraction() {
  if (!isDragging || isDragging.type !== 'dropper') return;
  const dropper = isDragging;

  // 1. FILLING: If tip is inside a bottle (with volume)
  const source = Object.values(vessels).find(v => 
    (v.type === 'bottle' || v.type === 'chemical_bottle' || v.type === 'beaker') && 
    v.targetVolume > 0.01 && 
    near(dropper, v, 40)
  );

  // 2. DISPENSING: If tip is over a conical flask/beaker
  const receiver = Object.values(vessels).find(v => 
    (v.type === 'beaker' || v.type === 'conical_flask') && 
    near(dropper, v, 50)
  );

  if (source) {
      dropper.hint = "Click Bulb to Fill";
  } else if (receiver && dropper.volume > 0.01) {
      dropper.hint = "Click Bulb to Drop";
  } else {
      dropper.hint = "";
  }
}

function dropperAction() {
    if (!isDragging || isDragging.type !== 'dropper') return;
    const dropper = isDragging;
    
    // Check if in bottle
    const source = Object.values(vessels).find(v => 
      (v.type === 'bottle' || v.type === 'chemical_bottle' || v.type === 'beaker') && 
      v.targetVolume > 0.01 && 
      near(dropper, v, 40)
    );
    
    if (source) {
        // Fill to capacity (1.0 mL)
        if (typeof transferLiquid === "function") {
            transferLiquid(source, dropper, 1.0);
        }
        
        // Ensure dropper identifies the chemical correctly
        dropper.chemicalId = source.chemicalId || source.chem || source.title;
        dropper.chem = source.chem || source.title;
        if (source.color) dropper.color = source.color;
        
        createParticles(dropper.x, dropper.y + 20, 5, 'bubble');
        console.log("Dropper filled with " + dropper.chem);
        return;
    }
    
    // Check if over flask
    const receiver = Object.values(vessels).find(v => 
      (v.type === 'beaker' || v.type === 'conical_flask') && 
      near(dropper, v, 50)
    );
    
    if (receiver && dropper.volume > 0.01) {
        // Drop exactly 0.05 mL
        if (typeof transferLiquid === "function") {
            transferLiquid(dropper, receiver, 0.05);
        }
        
        // Manual Indicator logic: ensure it counts as "drops" for the MarkingManager
        if (engineIsIndicator(dropper.chemicalId)) {
            if (!receiver.contents.indicators) receiver.contents.indicators = {};
            receiver.contents.indicators[dropper.chemicalId] = (receiver.contents.indicators[dropper.chemicalId] || 0) + 1;
            
            // Critical fix: Ensure indicatorsAdded is populated for getTitrationColor
            if (!receiver.contents.indicatorsAdded.includes(dropper.chemicalId)) {
                receiver.contents.indicatorsAdded.push(dropper.chemicalId);
            }
        }
        
        // Visual drop animation
        drawDroplets(dropper.x, dropper.y + 20, receiver.x, receiver.y - 15, dropper.color ? color(...dropper.color) : color(255));
        createParticles(dropper.x, dropper.y + 25, 2, 'drip');
        console.log("Dropper dispensed 1 drop into " + receiver.type);

        // Trigger reaction engine
        if (typeof computeReaction === "function") {
            computeReaction(receiver);
        }
    }
}

function engineIsIndicator(id) {
  if (!id || !window.chemicalCatalog) return false;
  const searchId = String(id).toLowerCase();
  const chem = chemicalCatalog.chemicals.find(ch => 
    String(ch.name).toLowerCase() === searchId || 
    String(ch.id).toLowerCase() === searchId
  );
  return chem ? (chem.is_indicator || false) : false;
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
    if (typeof transferLiquid === "function") {
        transferLiquid(source, pipette, rate);
    }
  }

  if (receiver && keyIsDown(SHIFT)) {
    let rate = 0.5 * (deltaTime / 50);
    if (pipette.targetVolume > 0.01 && receiver.targetVolume < receiver.capacity) {
      if (typeof transferLiquid === "function") {
          transferLiquid(pipette, receiver, rate);
      }
      receiver.turbulence = min((receiver.turbulence || 0) + 0.5, 3);
      drawPouringStream(pipette.x, pipette.y + pipette.h / 2 - 5, receiver.x, receiver.y - 15, color(...(pipette.color || [255, 255, 255])), 2);
    }
  }
}

function drawSnapGuides() {

}

// Helper to determine if burette is correctly positioned
function getBuretteHeightStatus(burette) {
  if (!burette) return { isTooLow: false, isTooHigh: false, receiver: null };

  const snapX = burette.type === 'burette' ? (burette.x + BURETTE_GLASS_X_OFFSET) : burette.x;
  const dripTipY = burette.type === 'burette' ? (burette.y + 120) : (burette.y + burette.h * 0.4);

  // Use official tabletop surface
  const snapY = labSurfaces?.table?.y || (height * 0.48);

  const receiver = Object.values(vessels).find(v =>
    (v.type === 'beaker' || v.type === 'conical_flask') && dist(v.x, v.y + v.h / 2, snapX, snapY) < 70
  );

  if (!receiver) {
    // Basic clearance against bench
    return { isTooLow: dripTipY > snapY - 40, isTooHigh: false, receiver: null, snapX, snapY, dripTipY };
  } else {
    const receiverTopY = receiver.y - receiver.h / 2;
    return {
      isTooLow: dripTipY > receiverTopY - 5,    // Less than 5px above rim
      isTooHigh: dripTipY < receiverTopY - 80, // More than 80px above rim
      receiver: receiver,
      snapX, snapY, dripTipY
    };
  }
}

function drawTitrationZone() {
  const burette = Object.values(vessels).find(v => (v.type === 'burette' || (v.type === 'burette_tube' && v.mountedTo)));
  if (!burette || isDragging) return;

  const status = getBuretteHeightStatus(burette);
  const { isTooLow, isTooHigh, receiver, snapX, snapY, dripTipY } = status;

  if (!receiver) {
    if (isTooLow) {
      push();
      fill(255, 100, 100); noStroke(); textAlign(CENTER); textSize(12); textStyle(BOLD);
      text('⚠️ BURETTE TOO LOW', snapX, dripTipY - 30);
      pop();
    } else {
      push();
      noFill(); stroke(100, 255, 100, 150); strokeWeight(2);
      // Draw the guide on the actual bench surface
      ellipse(snapX, snapY - 2, 60, 15);
      fill(100, 255, 100); noStroke(); textAlign(CENTER); textSize(10);
      text('PLACE FLASK', snapX, snapY - 15);
      pop();
    }
  } else {
    if (isTooLow) {
      push();
      fill(255, 100, 100); noStroke(); textAlign(CENTER); textSize(12); textStyle(BOLD);
      text('⚠️ TOO LOW - MOVE UP', snapX, dripTipY - 30);
      pop();
    } else if (isTooHigh) {
      push();
      fill(255, 50, 50); noStroke(); textAlign(CENTER); textSize(12); textStyle(BOLD);
      text('⚠️ TOO HIGH - WILL SPILL', snapX, dripTipY - 40);
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
  try {
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
    handleDropperInteraction();
    instrumentReadings();

    // --- NEW: SWIRL FLASK (W Key) ---
    if (keyIsDown(87)) { // 'W' Key
      const flask = Object.values(vessels).find(v => v.type === 'conical_flask');
      if (flask && flask.volume > 0) {
        flask.turbulence = 6; // High turbulence
        flask.tilt = sin(frameCount * 0.1) * 0.10; // Tilt (Slower)
        flask.renderOffsetX = cos(frameCount * 0.4) * 4; // Slower orbit
        flask.renderOffsetY = sin(frameCount * 0.4) * 2;
        flask.hint = "Swirling...";
      }
    } else {
      const flask = Object.values(vessels).find(v => v.type === 'conical_flask');
      if (flask) { flask.renderOffsetX = 0; flask.renderOffsetY = 0; }
    }

    // Draw shadows first, then vessels
    Object.values(vessels).forEach(v => {
      try { drawShadow(v); } catch(e) {}
    });

    Object.values(vessels).forEach(v => {
      try {
        drawVessel(v);
        if (v.type === 'burette' || (v.type === 'burette_tube' && v.mountedTo)) drawBuretteZoom(v);
      } catch (e) {
        if (frameCount % 120 === 0) console.error("Crash in drawVessel for " + v.id, e);
      }
    });

    // FIXED: Handle Keyboard Vertical Sliding
    if (hoverVessel && hoverVessel.type === 'burette_tube' && hoverVessel.mountedTo) {
      const stand = vessels[hoverVessel.mountedTo];
      const isPouring = isDragging && isDragging.type === 'bottle';
      if (stand && !isPouring) {
        let moved = false;
        if (keyIsDown(UP_ARROW)) {
          hoverVessel.clampOffset = constrain(hoverVessel.clampOffset - 3, -stand.h * 0.45, stand.h * 0.25);
          moved = true;
        }
        if (keyIsDown(DOWN_ARROW)) {
          hoverVessel.clampOffset = constrain(hoverVessel.clampOffset + 3, -stand.h * 0.45, stand.h * 0.25);
          moved = true;
        }
        if (moved) {
          const dripTipY = hoverVessel.y + hoverVessel.h * 0.4;
          Object.values(vessels).forEach(v => {
            if ((v.type === 'beaker' || v.type === 'conical_flask') && abs(v.x - hoverVessel.x) < 10) {
              const flaskTopY = v.y - v.h / 2;
              if (dripTipY > flaskTopY + 10) { v.x += 100; v.vy = 0; }
            }
          });
        }
      }
    }

    drawTitrationZone();
    drawSnapGuides();  
    drawParticles();

    if (hoverVessel) drawTooltip(hoverVessel);
  } catch (e) {
    if (frameCount % 60 === 0) console.error("GLOBAL DRAW CRASH:", e);
  }
  if (catalogVisible) drawCatalogPanel();
  if (assistantVisible) drawAssistant();
  drawControlsPanel();
  drawClearShelfButton(); // Magic button on the shelf
}
function getChemicalInfo(chemicalId) {
  const searchId = String(chemicalId).toLowerCase();
  
  // 1. Search DB-Driven Chemicals First
  if (typeof chemicalCatalog !== 'undefined' && chemicalCatalog && chemicalCatalog.chemicals) {
    let found = chemicalCatalog.chemicals.find(c => 
      String(c.id).toLowerCase() === searchId || 
      String(c.name).toLowerCase() === searchId
    );
    if (found) return found;
  }

  // 2. Fallback to hardcoded list
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
    
    // NEW: Calculate dynamic titration color (Fallback to v.color or blue)
    let titrationCol = getTitrationColor(v);
    drawRealisticLiquid(v, color(...titrationCol));
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
      // CONTEXTUAL HINT: Only show if adjustment is needed
      const status = getBuretteHeightStatus(v);
      if (status.isTooLow || status.isTooHigh) {
        v.hint = "Press ↑ / ↓ to Adjust Height";
      } else {
        v.hint = ""; // Hide hint if in good position
      }
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
  else if (v.type === 'dropper') {
    drawDropper(v);
  }
  else if (v.type === 'balance') {
    image(imgBalance, 0, 0, v.w, v.h);
    drawBalanceDisplay(v); // Integrated realistic meter
  }
  else if (v.type === 'conical_flask') {
    image(imgConical, 0, 0, v.w, v.h);

    // NEW: Calculate dynamic titration color
    let titrationCol = getTitrationColor(v);
    drawRealisticLiquid(v, color(...titrationCol));
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
  const shouldHideLabel = v.type === 'bottle' || v.type === 'balance' || v.isOnBalance || v.type === 'dropper';

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

function drawDropper(v) {
    push();
    const w = 15, h = 80;
    const bulbH = 25;
    const tubeH = h - bulbH;
    
    // 1. Rubber Bulb (Top)
    fill(200, 50, 50); noStroke();
    rect(-w/2, -h/2, w, bulbH, 8, 8, 2, 2);
    
    // 2. Glass Tube
    fill(255, 255, 255, 60); stroke(200, 150); strokeWeight(1);
    rect(-w/4, -h/2 + bulbH, w/2, tubeH, 0, 0, 4, 4);
    
    // 3. Liquid inside
    if (v.volume > 0.01) {
        drawRealisticLiquid(v, null); // Will use v.color
    }
    
    // 4. Gloss shine
    fill(255, 100); noStroke();
    rect(-w/6, -h/2 + bulbH + 5, 2, tubeH - 10, 1);
    
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
  if (!v.volume || v.volume < 0.1 || !col) return;
  
  // --- BUG FIX: Handle both p5.js color objects and raw arrays ---
  let activeCol;
  if (col && col.levels) {
    activeCol = col;
  } else if (Array.isArray(col)) {
    activeCol = color(...col);
  } else if (v.color) {
    activeCol = Array.isArray(v.color) ? color(...v.color) : color(v.color);
  } else {
    activeCol = color(200, 220, 255, 100); // Default water look
  }

  // Safety: If p5.js color object creation failed
  if (!activeCol.levels) return;

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

    // Main Column (Realistically uncapped so it can rise above 0 mark)
    fill(r, g, b, 160);
    noStroke();
    rect(-tubeWidth / 2, topY, tubeWidth, bottomLimit - topY);

    // Tapered Bottom Tip
    beginShape();
    vertex(-tubeWidth / 2, bottomLimit);
    vertex(tubeWidth / 2, bottomLimit);
    vertex(0, bottomLimit + 10);
    endShape(CLOSE);

    // Surface Meniscus (Always show if above bottom)
    if (topY < bottomLimit) {
      fill(r, g, b, 255);
      ellipse(0, topY, tubeWidth, 3);
    }
    pop();
  }
  else if (v.type === 'dropper') {
    const w = 15 * 0.5; // Half of tube width
    const bulbH = 25;
    const totalH = 80;
    const tubeH = totalH - bulbH;
    const bottomLimit = totalH/2;
    const hMax = tubeH;
    const topY = bottomLimit - (hMax * fillRatio);

    fill(r, g, b, 240); noStroke();
    rect(-w/2, topY, w, bottomLimit - topY, 0, 0, 2, 2);
    
    // Meniscus
    if (fillRatio > 0.05) {
        ellipse(0, topY, w, 2);
    }
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
  const boxW = 280;
  // Dynamic height based on number of chemicals
  let chemCount = 0;
  if (v.contents && v.contents.chemicals) {
    for (let c in v.contents.chemicals) {
      if (v.contents.chemicals[c].volume > 0.005) chemCount++;
    }
  }
  
  const boxH = 120 + (chemCount > 1 ? (chemCount * 18) : 40); 
  const x = constrain(mouseX + 15, 10, width - boxW - 10);
  const y = constrain(mouseY + 15, 10, height - boxH - 10);

  fill(255, 255, 255, 245); stroke(180); strokeWeight(1);
  rect(x, y, boxW, boxH, 12);

  // Header
  noStroke(); fill(20, 40, 80); textAlign(LEFT);
  textSize(14); textStyle(BOLD);
  text(v.title || v.type, x + 12, y + 25);

  // Content Section
  textSize(11); textStyle(BOLD); fill(100);
  text("CONTENTS:", x + 12, y + 45);
  
  let currentY = y + 62;
  let hasItems = false;

  if (v.contents && v.contents.chemicals) {
    for (let c in v.contents.chemicals) {
      let data = v.contents.chemicals[c];
      if (data.volume > 0.005) {
        hasItems = true;
        const info = getChemicalInfo(c);
        
        // Color dot
        fill(data.color ? color(...data.color) : [200, 200, 200]);
        ellipse(x + 18, currentY - 4, 10, 10);
        
        // Name & Vol
        fill(40); textStyle(BOLD); textSize(11);
        text(info.name, x + 32, currentY);
        fill(80); textStyle(NORMAL); textSize(10);
        text(`${nf(data.volume, 1, 2)} mL`, x + boxW - 60, currentY);
        
        currentY += 18;
      }
    }
  }

  if (!hasItems) {
    fill(150); textStyle(ITALIC);
    text("Empty", x + 12, currentY);
    currentY += 20;
  }

  // Stats Footer
  stroke(240); line(x + 10, currentY, x + boxW - 10, currentY);
  noStroke(); fill(60); textStyle(NORMAL); textSize(11);
  currentY += 18;
  text(`Total Volume: ${nf(v.volume || 0, 1, 2)} mL`, x + 12, currentY);
  if (v.capacity) {
    text(`Capacity: ${v.capacity} mL`, x + 150, currentY);
  }

  if (v.contents && v.contents.pH !== undefined) {
    currentY += 18;
    fill(0, 100, 200); textStyle(BOLD);
    text(`Solution pH: ${v.contents.pH.toFixed(2)}`, x + 12, currentY);
  }

  if (v.hint) {
    currentY += 20;
    fill(0, 150, 0); textStyle(NORMAL); textSize(11);
    text('💡 ' + v.hint, x + 12, currentY);
  }
}


function drawAssistant() {
  if (!assistantVisible) return;

  push();
  let x = width - 230;
  let y = 100; 
  let w = 210;
  let h = 480;

  // Glass background
  fill(30, 45, 60, 230);
  stroke(0, 120, 255, 120);
  strokeWeight(2);
  rect(x, y, w, h, 15);

  // Header
  noStroke();
  fill(0, 190, 255);
  textAlign(CENTER);
  textSize(15);
  textStyle(BOLD);
  text("LAB ASSISTANT", x + w/2, y + 25);
  
  stroke(0, 120, 255, 80);
  line(x + 20, y + 35, x + w - 20, y + 35);

  // Marks
  noStroke();
  fill(255);
  textSize(13);
  text(`Total Marks: ${sessionMarks}/100`, x + w/2, y + 55);

  let currentY = y + 75;
  let m = experimentData?.milestones?.[currentStepIndex];

  if (m) {
    // Current Step Box
    fill(255, 255, 255, 25);
    rect(x + 10, currentY, w - 20, 130, 10);
    
    fill(255, 255, 0);
    textSize(11);
    textAlign(LEFT);
    text(`STEP ${currentStepIndex + 1}/${experimentData.milestones.length}:`, x + 20, currentY + 18);
    
    fill(255);
    textSize(12);
    textStyle(BOLD);
    let desc = m.description ? m.description.toUpperCase() : "";
    let instrY = currentY + 70;
    
    if (desc) {
        text(desc, x + 20, currentY + 38, w - 40);
    } else {
        instrY = currentY + 38; // Shift instruction up if no description is present
    }
    
    textStyle(NORMAL);
    fill(180, 220, 255);
    textSize(11);
    let instr = m.instruction || "Continue following procedure.";
    
    // Prevent duplicate prefix: only add it if the raw instruction doesn't already have it
    let displayInstr = instr;
    if (!displayInstr.includes("💡") && !displayInstr.toUpperCase().includes("INSTRUCTION")) {
        displayInstr = "💡 INSTRUCTION: " + instr;
    }
    
    text(displayInstr, x + 20, instrY, w - 40);
    
    currentY += 140;

    // Diagnostic Feedback / Status
    if (manager.currentStepHint) {
        fill(255, 120, 120);
        textSize(10);
        textStyle(BOLD);
        text(manager.currentStepHint, x + 20, currentY + 10, w - 40);
        currentY += 45;
    } else if (manager.rulesValidated) {
        fill(100, 255, 100);
        textSize(11);
        textStyle(BOLD);
        text("✓ READY TO SUBMIT", x + 20, currentY + 15);
        currentY += 35;
    } else {
        currentY += 15;
    }

    // Action Button (Stored globally for mousePressed)
    const hasPrompts = (m.observation_prompts && m.observation_prompts.length > 0) || 
                       (m.calculation_prompts && m.calculation_prompts.length > 0);
    if (hasPrompts) {
        let btnX = x + 20, btnY = currentY + 10, btnW = w - 40, btnH = 35;
        window.assistantButtonBounds = { x: btnX, y: btnY, w: btnW, h: btnH };

        fill(0, 150, 255);
        if (manager.rulesValidated) fill(0, 200, 80);
        rect(btnX, btnY, btnW, btnH, 8);
        
        fill(255);
        textAlign(CENTER);
        textSize(13);
        textStyle(BOLD);
        text("Enter Readings", x + w/2, btnY + 22);
        
        textAlign(CENTER);
        fill(180, 220, 255, 150);
        textSize(10);
        textStyle(NORMAL);
        text("(Click Button to Submit)", x + w/2, btnY + 48);
    }

    // Penalties Section
    if (penalties.length > 0) {
        let penaltyY = y + h - 90;
        fill(255, 80, 80);
        textSize(11);
        textStyle(BOLD);
        textAlign(LEFT);
        text("⚠️ PENALTIES:", x + 20, penaltyY);
        
        textSize(10);
        textStyle(NORMAL);
        fill(255, 150, 150);
        let recentPenalties = penalties.slice(-2);
        let penYOffset = penaltyY + 15;
        recentPenalties.forEach((p) => {
            let displayMsg = p.includes(":") ? p.split(":")[1].trim() : p;
            text("- " + displayMsg, x + 20, penYOffset, w - 40);
            penYOffset += 32; // More space for potential 2-line descriptions
        });
    }
  } else {
    fill(100, 255, 100);
    textAlign(CENTER);
    textSize(14);
    textStyle(BOLD);
    text("EXPERIMENT COMPLETE!", x + w/2, y + 150);
    fill(255);
    textSize(12);
    textStyle(NORMAL);
    text("You may exit the lab.", x + w/2, y + 175);
  }

  pop();
}






function drawButton(x, y, w, h, label, col) {
  fill(...col); rect(x, y, w, h, 8);
  fill(255); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(12);
  text(label, x + w / 2, y + h / 2);
}


function drawControlsPanel() {
  if (!controlsVisible) return;

  const panelW = 340, panelH = 220;
  // Positioned at bottom center
  const x = (width - panelW) / 2;
  const y = height - panelH - 30;

  push();
  // 1. Premium Glassmorphism Background
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.4)';
  fill(15, 25, 45, 230); // Deep dark blue
  stroke(255, 40);
  strokeWeight(1.5);
  rect(x, y, panelW, panelH, 16);
  drawingContext.shadowBlur = 0;

  // 2. Translucent "Glass" Shine
  noStroke();
  fill(255, 255, 255, 10);
  rect(x, y, panelW, 40, 16, 16, 0, 0);

  // 3. Header
  textAlign(LEFT, CENTER);
  textSize(14);
  textStyle(BOLD);
  fill(255);
  text("⌨️ LAB CONTROLS", x + 20, y + 20);
  
  // Separation line
  stroke(255, 20);
  line(x + 20, y + 42, x + panelW - 20, y + 42);

  // 4. Shortcut Grid
  noStroke();
  const list = [
    { key: "D KEY", desc: "Fill / Drop (Glass Dropper)" },
    { key: "SPACE", desc: "Titrate from Burette" },
    { key: "S KEY (Hold)", desc: "Zero / Drain Burette" },
    { key: "W KEY (Hold)", desc: "Swirl Conical Flask" },
    { key: "↑ / ↓ ARROWS", desc: "Adjust Tilt / Height" },
    { key: "R / T KEYS", desc: "Remove / Tare Instrument" },
    { key: "SHIFT + CLICK", desc: "Suck / Pour (Pipette)" }
  ];

  let startY = y + 65;
  list.forEach((item, i) => {
    // Key Background (Small pill)
    fill(255, 255, 255, 30);
    rect(x + 20, startY + (i * 20) - 8, 90, 16, 4);
    
    // Key Text
    fill(100, 200, 255);
    textAlign(CENTER, CENTER);
    textSize(9);
    textStyle(BOLD);
    text(item.key, x + 65, startY + (i * 20));
    
    // Description
    fill(230);
    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
    textSize(11);
    text(item.desc, x + 120, startY + (i * 20));
  });
  pop();
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
    console.log(`Cleared ${clearedCount} items from shelves.`);
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
  if (manager.activeModal) return;

  // --- CLICK: MANUAL ASSESSMENT BUTTON ---
  let currentTask = manager.milestones[currentStepIndex];
  if (currentTask) {
    const hasPrompts = (currentTask.observation_prompts && currentTask.observation_prompts.length > 0) || 
                       (currentTask.calculation_prompts && currentTask.calculation_prompts.length > 0);
    if (hasPrompts && assistantVisible && window.assistantButtonBounds) {
      const { x: btnX, y: btnY, w: btnW, h: btnH } = window.assistantButtonBounds;
      if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH) {
          manager.handleManualSubmit();
          return;
      }
    }
  }

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
  const burette = Object.values(vessels).find(v => (v.type === 'burette' || (v.type === 'burette_tube' && v.mountedTo)));

  if (burette) {
    const snapX = burette.type === 'burette' ? (burette.x + BURETTE_GLASS_X_OFFSET) : burette.x;
    const fixedZoomY = height * 0.25; // FIXED HEIGHT

    if (userClosedZoom) {
      // --- LOGIC TO OPEN (Circular Detection) ---
      const iconX = snapX + 60;
      const iconY = fixedZoomY + 20; // Fixed relative to zoom region

      if (dist(mouseX, mouseY, iconX, iconY) < 18) {
        userClosedZoom = false;
        console.log("Zoom View Restored");
        return;
      }
    } else {
      // --- LOGIC TO CLOSE (Matches Fixed Draw Function) ---
      const zoomX = snapX + 180;
      const zoomY = fixedZoomY;
      const closeBtnX = zoomX + 65;
      const closeBtnY = zoomY - 65;

      if (dist(mouseX, mouseY, closeBtnX, closeBtnY) < 15) {
        userClosedZoom = true;
        return;
      }
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
        const snapY = labSurfaces?.table?.y || (height * 0.72);

        if (dist(isDragging.x, isDragging.y, snapX, dripTipY) < 70 && dripTipY <= snapY - 80) {
          isDragging.x = snapX;
          isDragging.y = snapY - isDragging.h / 2;
          isDragging.vy = 0;
          isDragging.surface = { y: snapY };
          console.log("Receiver locked below tube");
        } else if (dist(isDragging.x, isDragging.y, snapX, dripTipY) < 70) {
          // FALLBACK: If near but too low, still snap to bench surface
          isDragging.y = snapY - isDragging.h / 2;
          isDragging.vy = 0;
          isDragging.surface = { y: snapY };
          console.log("Burette too low: Receiver forced to bench");
        }
      }
    }

    isDragging.dragging = false;

    // 3. COMMON STAND MOUNTING
    if (isDragging.type === 'burette_tube') {
      const stand = Object.values(vessels).find(s => s.type === 'common_stand' && dist(isDragging.x, isDragging.y, s.x - s.w * 0.18, s.y) < 60);
      if (stand) {
        isDragging.mountedTo = stand.id;
        isDragging.clampOffset = constrain(isDragging.y - stand.y, -stand.h * 0.45, stand.h * 0.25);
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
          const snapY = labSurfaces?.table?.y || (height * 0.72);
          const snapDist = dist(isDragging.x, isDragging.y, tube.x, tube.y + tube.h * 0.4);
          const dripTipY = tube.y + tube.h * 0.4;

          if (snapDist < 70 && dripTipY <= snapY - 80) {
            isDragging.x = tube.x;
            isDragging.y = snapY - isDragging.h / 2;
            isDragging.vy = 0;
            isDragging.surface = { y: snapY };
          } else if (snapDist < 70) {
            // FALLBACK: If near but too low, still snap to bench surface
            isDragging.y = snapY - isDragging.h / 2;
            isDragging.vy = 0;
            isDragging.surface = { y: snapY };
            console.log("Burette tube too low: Receiver forced to bench");
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

  if (waste && waste.targetVolume < waste.capacity) {
    b.hint = "Draining (Waste)";
    transferLiquid(b, waste, amt);
  } else {
    b.hint = "Draining (Sink)";
    b.targetVolume = max(0, b.targetVolume - amt);
  }
  createParticles(snapX, dripTipY + 20, 1, 'drop');
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

  // 4. ADD INDICATOR DROP / DROPPER ACTION
  if (keyL === 'd' && isDragging) {
    // Priority: If holding a dropper, use dropper logic
    if (isDragging.type === 'dropper') {
        dropperAction();
        return;
    }

    // Fallback: Legacy bottle drop logic
    const target = Object.values(vessels).find(v =>
      getApparatusProps(v.type).can_measure_vol && dist(isDragging.x, isDragging.y, v.x, v.y) < 120
    );

    if (target) {
      if (isDragging.isChemical) {
        if (!target.contents.indicators) target.contents.indicators = {};
        if (!target.contents.indicatorsAdded) target.contents.indicatorsAdded = [];
        
        // SYNC FIX: Use name/title as the key, consistent with marking logic
        const chemName = isDragging.title || isDragging.chem || isDragging.chemicalId;
        target.contents.indicators[chemName] = (target.contents.indicators[chemName] || 0) + 1;
        
        if (!target.contents.indicatorsAdded.includes(chemName)) {
          target.contents.indicatorsAdded.push(chemName);
        }

        // Add to main chemical list too so computeReaction sees it
        if (!target.contents.chemicals[chemName]) {
            target.contents.chemicals[chemName] = { 
                volume: 0, 
                color: isDragging.color || [255, 180, 220] 
            };
        }
        target.contents.chemicals[chemName].volume += 0.05; // 1 drop ~ 0.05mL
        target.targetVolume += 0.05;

        createParticles(isDragging.x, isDragging.y + 30, 2, 'drip');
        console.log("SUCCESS: " + chemName + " drops added. Content sync'd.");
        
        // REACTION ENGINE TRIGGER
        computeReaction(target);
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

    const status = getBuretteHeightStatus(burette);
    const { isTooHigh, isTooLow, snapX, dripTipY, receiver } = status;

    if (receiver) {
      if (isTooLow) {
        // PERMIT BUT PENALIZE: Submerged tip mistake
        manager.addPenalty("submerged_tip", 5, "Burette tip is submerged in the flask liquid, which is poor technique.");
      }

      const flow = keyIsDown(SHIFT) ? 0.4 : 0.1; // Slower for precision
      if (burette.targetVolume >= flow && receiver.targetVolume < receiver.capacity) {

        if (isTooHigh) {
          // Spilling logic
          burette.targetVolume -= flow;
          manager.addPenalty("spilling", 5, "Burette tip is too high above the flask, causing liquid spill.");
          createParticles(snapX, dripTipY, 2, 'drip');
          // Liquid is lost, not added to receiver
        } else {
          if (typeof transferLiquid === "function") {
              transferLiquid(burette, receiver, flow);
          }
          studentVolume += flow;
          receiver.turbulence = min((receiver.turbulence || 0) + 0.3, 2);
        }

        // USE DROPLETS INSTEAD OF STREAM
        drawDroplets(snapX, dripTipY - 10, receiver.x, receiver.y - 15, burette.color ? color(...burette.color) : color(255, 160, 100));
      }
    }
  }
}

//Burette filling logic
function handleBuretteFilling() {
  if (!isDragging || !getApparatusProps(isDragging.type).can_pour || getApparatusProps(isDragging.type).can_measure_vol) return;

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
    if (burette.targetVolume > burette.capacity + 0.05) {
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
      // NEW: Allow filling up to 5mL past capacity (Realistic mistake zone)
      if (burette.targetVolume < burette.capacity + 5) {
        if (typeof transferLiquid === "function") {
            transferLiquid(isDragging, burette, actualFlow);
        }

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
  // FIXED COORDINATES: Zoom view stays at top section of the screen
  const snapX = v.type === 'burette' ? (v.x + BURETTE_GLASS_X_OFFSET) : v.x;
  const zoomX = snapX + 180;
  const zoomY = height * 0.25; // FIXED VERTICAL POSITION
  const zoomSize = 140;

  // --- MINIMIZED STATE: Show "Open Zoom" Button ---
  if (userClosedZoom) {
    push();
    // Positioned to the right of the burette tube
    const iconX = snapX + 60;
    const iconY = zoomY + 20; // Fixed relative to zoom region
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

  if (v.volume > v.capacity + 0.1) {
    // DRAMATIC FLASHING WARNING
    let flash = sin(frameCount * 0.2) > 0;
    fill(255, flash ? 50 : 0, flash ? 50 : 0);
    textStyle(BOLD); textSize(13);
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
    v = makeResponsiveVessel(nextId('bottle'), 'bottle');
    if (v) {
      v.title = 'Empty Bottle';
      v.volume = 0;
      v.capacity = 250;
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
  bottle.chemicalId = chem.label || chem.id; // IDENTITY FIX: Use label/name as primary ID
  bottle.color = chem.color;
  bottle.volume = 100;
  bottle.targetVolume = 100;
  bottle.capacity = 250;
  bottle.isChemical = true;
  bottle.title = chem.label;

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

// ======================================================
// GENERIC LIQUID TRANSFER & STOICHIOMETRY ENGINE
// ======================================================
function transferLiquid(source, target, transferVol) {
  if (transferVol <= 0 || source.targetVolume <= 0) return;
  const isBurette = target.type === 'burette' || target.type === 'burette_tube';
  if (!isBurette && target.targetVolume >= target.capacity) return; 

  let actualVol = min(transferVol, source.targetVolume);
  if (!isBurette) {
      actualVol = min(actualVol, target.capacity - target.targetVolume);
  }
  if (actualVol <= 0.001) return;

  let totalSourceVol = 0;
  for (let c in source.contents.chemicals) totalSourceVol += source.contents.chemicals[c].volume;

  // Initial State Fallback: if dictionary empty but has volume
  if (totalSourceVol <= 0.01 && source.chemicalId) {
    // SYNC FIX: Use name/title/chemicalId consistently
    let chemRef = source.chemicalId || source.title || source.chem;
    source.contents.chemicals[chemRef] = { volume: source.targetVolume, color: source.color || [200, 220, 255] };
    totalSourceVol = source.targetVolume;
  }

  for (let c in source.contents.chemicals) {
    let transferAmount = (source.contents.chemicals[c].volume / totalSourceVol) * actualVol;
    
    // Remove from source
    source.contents.chemicals[c].volume -= transferAmount;
    if (source.contents.chemicals[c].volume <= 0.001) delete source.contents.chemicals[c];
    
    // Add to target
    if (!target.contents.chemicals[c]) {
      target.contents.chemicals[c] = { volume: 0, color: source.contents.chemicals[c].color };
    }
    target.contents.chemicals[c].volume += transferAmount;
  }
  
  source.targetVolume -= actualVol;
  target.targetVolume += actualVol;

  // Titration Tracking Logic (UI-Driven: detects by vessel TYPE or NAME for robustness)
  const isTitrant = (source.type === 'burette' || (source.type === 'burette_tube' && source.mountedTo) || 
                     (source.title && source.title.toLowerCase().includes('titrant')) ||
                     (source.chem && source.chem.toLowerCase().includes('titrant')));

  const isAnalyte = (source.type === 'pipette' || 
                     (source.title && (source.title.toLowerCase().includes('mixture') || source.title.toLowerCase().includes('analyte'))) ||
                     (source.chem && (source.chem.toLowerCase().includes('mixture') || source.chem.toLowerCase().includes('analyte'))));

  if (isTitrant) {
    target.contents.titrant_vol = (target.contents.titrant_vol || 0) + actualVol;
  } else if (isAnalyte) {
    target.contents.mixture_vol = (target.contents.mixture_vol || 0) + actualVol;
  }
  
  // Generic Indicator Tracking for UI-driven color logic
  if (engineIsIndicator(source.chemicalId)) {
      if (!target.contents.indicatorsAdded.includes(source.chemicalId)) {
          target.contents.indicatorsAdded.push(source.chemicalId);
      }
  }
  
  // Mix visual identities
  if (!target.chemicalId) target.chemicalId = source.chemicalId || source.chem;
  
  computeReaction(target);
}

function computeReaction(vessel) {
    if (!window.CHEMICAL_REACTIONS || !experimentData) return;

    // 1. DYNAMIC pH TRACKING (Based on Stoichiometric Linkages)
    // Find if the latest added chemical has a pH effect
    let totalPHChange = 0;
    
    // Simple iterative solver for multi-chemical mixtures
    window.CHEMICAL_REACTIONS.forEach(rxn => {
        // Find matching chemicals in the vessel using robust lookup
        let volA = 0;
        let volB = 0;
        
        for (let chemName in vessel.contents.chemicals) {
            const lowerChem = chemName.toLowerCase();
            if (lowerChem.includes(String(rxn.chemical_a_label).toLowerCase()) || String(rxn.chemical_a_label).toLowerCase().includes(lowerChem)) {
                volA += vessel.contents.chemicals[chemName].volume;
            }
            if (lowerChem.includes(String(rxn.chemical_b_label).toLowerCase()) || String(rxn.chemical_b_label).toLowerCase().includes(lowerChem)) {
                volB += vessel.contents.chemicals[chemName].volume;
            }
        }
        
        // If both reactants are present, calculate the effect
        if (volA > 0.05 && volB > 0.05) {
            // Apply ph_change periodically based on titrant volume
            totalPHChange += rxn.ph_change * (Math.min(volA, volB) / 10); 
        }
    });

    // Update vessel pH
    let basePH = 7.0;
    // Analyte detection (Find chemical with highest volume that isn't a titrant)
    let maxV = 0;
    let hasAnalyte = false;
    for (let c in vessel.contents.chemicals) {
        if (vessel.contents.chemicals[c].volume > maxV) {
            maxV = vessel.contents.chemicals[c].volume;
            // High level logic: Carbonates start at pH 11.5
            if (c.toLowerCase().includes('carbonate') || c.toLowerCase().includes('mixture')) {
                basePH = 11.5;
                hasAnalyte = true;
            }
            else if (c.toLowerCase().includes('acid')) basePH = 2.0;
        }
    }

    // --- TITRATION OVERRIDE ---
    const isTitration = experimentData?.type === 'double_indicator' || experimentData?.type === 'simple_titration';
    if (isTitration && (hasAnalyte || vessel.contents.mixture_vol > 0.1)) {
        const targetV1 = experimentData?.targets?.v1 || 10.0;
        const targetV2 = experimentData?.targets?.v2 || 25.0;
        const isDouble = experimentData?.type === 'double_indicator';
        const titrantVol = vessel.contents.titrant_vol || 0;
        const safeV1 = Math.max(0.1, targetV1);
        const safeV2 = Math.max(safeV1 + 0.1, targetV2);

        // Smooth Transition: Target the calculated pH but move towards it gradually
        let targetPH = 7.0;
        if (titrantVol < safeV1) {
            targetPH = map(titrantVol, 0, safeV1, basePH, 8.3);
        } else if (!isDouble) {
            targetPH = map(titrantVol, safeV1, safeV1 + 2.0, 7.3, 2.0, true);
        } else if (titrantVol < safeV2) {
            targetPH = map(titrantVol, safeV1, safeV2, 8.0, 4.0);
        } else {
            targetPH = map(titrantVol, safeV2, safeV2 + 2.0, 3.8, 1.5, true);
        }
        
        if (isNaN(targetPH)) targetPH = 7.0;
        vessel.contents.pH = lerp(vessel.contents.pH || basePH, targetPH, 0.1);
    } else {
        let finalPH = basePH + totalPHChange;
        if (isNaN(finalPH)) finalPH = 7.0;
        vessel.contents.pH = lerp(vessel.contents.pH || basePH, Math.max(1.0, Math.min(14.0, finalPH)), 0.05);
    }

    // 2. GENERIC INDICATOR COLOR SOLVER
    let indicatorColors = [];
    for (let c in vessel.contents.chemicals) {
        const info = getChemicalInfo(c);
        if (info && info.is_indicator) {
            const indColor = getIndicatorColor(info, vessel.contents.pH);
            if (indColor) indicatorColors.push({ color: indColor, vol: vessel.contents.chemicals[c].volume });
        }
    }

    // 3. COLOR BLENDING
    if (indicatorColors.length > 0) {
        // If indicators are present, they dominate the visual result
        let r=0, g=0, b=0, a=0, totalVolIdx = 0;
        indicatorColors.forEach(ic => {
            r += ic.color[0]; g += ic.color[1]; b += ic.color[2]; a += ic.color[3];
            totalVolIdx++;
        });
        vessel.color = [r/totalVolIdx, g/totalVolIdx, b/totalVolIdx, a/totalVolIdx];
    } else {
        // Fallback to average of chemical base colors or reaction product color
        let r=0, g=0, b=0, total=0;
        let reactedHex = null;
        
        // Check for specific reaction product color
        window.CHEMICAL_REACTIONS.forEach(rxn => {
            if (vessel.contents.chemicals[rxn.chemical_a_label] && vessel.contents.chemicals[rxn.chemical_b_label]) {
                reactedHex = rxn.reaction_color_hex;
            }
        });

        if (reactedHex) {
            vessel.color = hexToRgba(reactedHex);
        } else {
            for (let c in vessel.contents.chemicals) {
                let chem = vessel.contents.chemicals[c];
                if (chem.volume > 0.01) {
                    let cCol = chem.color || [200, 220, 255, 180];
                    r += cCol[0] * chem.volume;
                    g += cCol[1] * chem.volume;
                    b += cCol[2] * chem.volume;
                    total += chem.volume;
                }
            }
            if (total > 0) vessel.color = [r/total, g/total, b/total, 180];
        }
    }
}

// Helper: Calculate indicator color based on pH
function getIndicatorColor(chemInfo, currentPH) {
    if (!chemInfo.low_ph_color || !chemInfo.high_ph_color || !chemInfo.transition_ph_range) return null;
    
    const range = chemInfo.transition_ph_range.split('-').map(v => parseFloat(v));
    const lowBound = range[0];
    const highBound = range[1];
    
    const lowCol = hexToRgba(chemInfo.low_ph_color);
    const highCol = hexToRgba(chemInfo.high_ph_color);
    
    if (currentPH <= lowBound) return lowCol;
    if (currentPH >= highBound) return highCol;
    
    // Interpolate in the transition zone
    const t = (currentPH - lowBound) / (highBound - lowBound);
    return [
        lerp(lowCol[0], highCol[0], t),
        lerp(lowCol[1], highCol[1], t),
        lerp(lowCol[2], highCol[2], t),
        lerp(lowCol[3], highCol[3], t)
    ];
}
function hexToRgba(hex) {
  if (!hex) return [255, 255, 255, 255];
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  if (hex.length === 6) {
    return [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
      255
    ];
  } else if (hex.length === 8) {
    return [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
      parseInt(hex.substring(6, 8), 16)
    ];
  }
  return [255, 255, 255, 255];
}
