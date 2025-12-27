// --- GLOBAL STATE ---

let vessels = {};          // id -> vessel
let bench, shelf;
let isDragging = null;
let hoverVessel = null;

let studentVolume = 0;
let phStage = 0;           // 0: clear, 1: light pink, 2: deep pink

// easing targets
let beakerTargetVol = 0;
let pipetteTargetVol = 0;
let buretteTargetVol = 0;

// catalogue & sprites
let catalog;
let imgBench, imgShelf;

let imgBeaker, imgBottle, imgBurette, imgPipette;
let imgConical, imgVolumetric, imgFunnel, imgWash, imgBunsen;

// catalogue UI (no scroll now)
let catalogVisible = true;
let catalogToggleButton = null;
let catalogPanelBounds = null;

// simple list of chemicals for bottles
const CHEMICALS = {
  acid: [
    { id: 'hcl_0_1M', label: '0.1 M HCl' },
    { id: 'h2so4_0_1M', label: '0.1 M H2SO4' }
  ],
  base: [
    { id: 'naoh_0_1M', label: '0.1 M NaOH' },
    { id: 'koh_0_1M',  label: '0.1 M KOH' }
  ],
  indicator: [
    { id: 'phenolphthalein', label: 'Phenolphthalein' }
  ]
};

// --- PRELOAD ---

function preload() {
  imgBench = loadImage('/static/images3/titration/bench.png');
  imgShelf = loadImage('/static/images3/titration/Shelf.jpg');

  imgBeaker     = loadImage('/static/img/catalog/beaker.png');
  imgBottle     = loadImage('/static/img/catalog/bottle.png');
  imgBurette    = loadImage('/static/img/catalog/burette.png');
  imgPipette    = loadImage('/static/img/catalog/pipette.png');
  imgConical    = loadImage('/static/img/catalog/conical_flask.png');
  imgVolumetric = loadImage('/static/img/catalog/volumetric_flask.png');
  imgFunnel     = loadImage('/static/img/catalog/funnel.png');
  imgWash       = loadImage('/static/img/catalog/wash_bottle.png');
  imgBunsen     = loadImage('/static/img/catalog/bunsen_burner.png');
}

// --- SETUP ---

function setup() {
  let canvas = createCanvas(900, 1000);
  canvas.parent('simulation-canvas');

  // shelf moved right to leave space for catalog
  shelf = { x: 260, y: 60, w: 300, h: 350 };
  bench = { x: 360, y: 260, w: 520, h: 340 };

  vessels = {};
  studentVolume = 0;
  phStage = 0;

  beakerTargetVol  = 0;
  pipetteTargetVol = 0;
  buretteTargetVol = 0;

  const catalogConfig = {
    visible_apparatus: [
      'beaker',
      'conical_flask',
      'volumetric_flask',
      'pipette',
      'burette',
      'bottle',
      'funnel',
      'wash_bottle',
      'bunsen_burner'
    ]
  };

  catalog = new LabCatalog(catalogConfig);
  catalog.initSprites({
    beaker:           imgBeaker,
    pipette:          imgPipette,
    bottle:           imgBottle,
    burette:          imgBurette,
    conical_flask:    imgConical,
    volumetric_flask: imgVolumetric,
    funnel:           imgFunnel,
    wash_bottle:      imgWash,
    bunsen_burner:    imgBunsen
  });
}

// --- HELPERS: CAPACITY / CHEMICAL ---

function askCapacity(type) {
  let options;
  if (type === 'beaker')              options = [50, 100, 250, 500];
  else if (type === 'pipette')       options = [10, 25];
  else if (type === 'burette')       options = [25, 50];
  else if (type === 'volumetric_flask') options = [100, 250, 500];
  else return null;

  const input = window.prompt(`Choose ${type} capacity (mL): ` + options.join(', '));
  if (input === null) return null;
  const value = parseFloat(input);
  if (!options.includes(value)) return null;
  return value;
}

function askChemical(kind) {
  const list = CHEMICALS[kind];
  if (!list || !list.length) return null;

  const text = list.map((c, i) => `${i + 1}. ${c.label}`).join('\n');
  const choice = window.prompt(`Choose a ${kind}:\n${text}`);
  if (choice === null) return null;
  const idx = parseInt(choice, 10) - 1;
  if (idx < 0 || idx >= list.length) return null;
  return list[idx];
}

// --- VESSEL MODEL ---

function makeVessel(id, x, y, w, h, title, chem, vtype, vol, cap) {
  return {
    id,
    x, y, w, h,
    snapX: x,
    snapY: y,
    title,
    chem,
    type: vtype,
    volume: vol,
    capacity: cap,
    dragging: false,
    isUnderBurette: false,
    chemicalId: null
  };
}

// --- MAIN DRAW LOOP ---

function draw() {
  background(240, 242, 248);

  drawEnvironment();
  easeVolumes();
  handleInteraction();

  drawShelfAndBench();

  hoverVessel = null;
  Object.values(vessels).forEach(v => drawVessel(v));

  if (hoverVessel) drawTooltip(hoverVessel);

  if (catalogVisible) drawCatalogPanel();

  drawDataPanel();
}

// --- DRAWING ---

function drawEnvironment() {
  noStroke();
  fill(232, 236, 245);
  rect(0, 0, width, height);
}

function drawShelfAndBench() {
  imageMode(CORNER);
  image(imgShelf, shelf.x, shelf.y, shelf.w, shelf.h);
  image(imgBench, bench.x, bench.y, bench.w, bench.h);

  fill(0, 0, 0, 35);
  noStroke();
  Object.values(vessels).forEach(v => {
    if (v.y > bench.y - 40) {
      ellipse(v.x, bench.y + 10, 70, 10);
    }
  });
}

function drawVessel(v) {
  let over = mouseX > v.x - v.w/2 && mouseX < v.x + v.w/2 &&
             mouseY > v.y - v.h/2 && mouseY < v.y + v.h/2;

  if (over && !isDragging) hoverVessel = v;

  push();
  translate(v.x, v.y);
  imageMode(CENTER);

  if (v.type === 'beaker') {
    image(imgBeaker, 0, 0, v.w, v.h);
  } else if (v.type === 'burette') {
    image(imgBurette, 0, 0, v.w, v.h);
    let tubeTop    = -v.h/2 + 80;
    let tubeBottom =  v.h/2 - 120;
    let frac   = constrain(v.volume / v.capacity, 0, 1);
    let liqTop = lerp(tubeTop, tubeBottom, 1 - frac);
    noStroke();
    fill(70, 150, 240, 200);
    rect(-v.w * 0.03, liqTop, v.w * 0.05, tubeBottom - liqTop);
  } else if (v.type === 'pipette') {
    image(imgPipette, 0, 0, v.w, v.h);
  } else if (v.type === 'bottle') {
    image(imgBottle, 0, 0, v.w, v.h);
    push();
    textAlign(CENTER, CENTER);
    textSize(11);
    fill(0);
    let labelY = -5;
    text(v.chem, 0, labelY);
    pop();
  } else if (v.type === 'conical_flask') {
    image(imgConical, 0, 0, v.w, v.h);
  } else if (v.type === 'volumetric_flask') {
    image(imgVolumetric, 0, 0, v.w, v.h);
  } else if (v.type === 'funnel') {
    image(imgFunnel, 0, 0, v.w, v.h);
  } else if (v.type === 'wash_bottle') {
    image(imgWash, 0, 0, v.w, v.h);
  } else if (v.type === 'bunsen_burner') {
    image(imgBunsen, 0, 0, v.w, v.h);
  }

  textAlign(CENTER);
  textSize(11);
  fill(30);
  text(v.title, 0, v.h/2 + 15);
  textSize(10);
  text(v.chem, 0, v.h/2 + 28);

  pop();
}

function drawTooltip(v) {
  let boxW = 210;
  let boxH = 70;
  let x = constrain(mouseX + 15, 10, width - boxW - 10);
  let y = constrain(mouseY + 15, 10, height - boxH - 10);

  fill(255, 255, 255, 240);
  stroke(180);
  rect(x, y, boxW, boxH, 8);
  noStroke();
  fill(0);
  textAlign(LEFT);
  textSize(13);
  text(v.title, x + 10, y + 20);
  textSize(12);
  text('Chemical: ' + v.chem, x + 10, y + 38);
  text('Volume: ' + nf(v.volume, 1, 2) + ' mL', x + 10, y + 56);
}

function drawDataPanel() {
  const panelW = 220;
  const panelH = 150;
  const margin = 40;
  const panelX = width - panelW - margin;

  fill(255, 255, 255, 235);
  stroke(210);
  rect(panelX, 30, panelW, panelH, 12);

  noStroke();
  fill(0);
  textAlign(LEFT);
  textSize(15);
  textStyle(BOLD);
  text('Live Data', panelX + 15, 55);

  textStyle(NORMAL);
  textSize(13);
  text('Base added: ' + nf(studentVolume, 1, 2) + ' mL', panelX + 15, 80);

  if (studentVolume > 0) {
    let diff = abs(studentVolume - 25.0);
    if (diff < 0.25) {
      fill(0, 150, 0);
      text('Perfect endpoint ✔', panelX + 15, 105);
      phStage = 2;
    } else if (studentVolume > 26) {
      fill(200, 0, 0);
      text('Overshot endpoint ✖', panelX + 15, 105);
      phStage = 2;
    } else {
      fill(120, 120, 0);
      text('Approaching endpoint…', panelX + 15, 105);
      phStage = 1;
    }
  } else {
    phStage = 0;
  }

  let btnX = 40;
  let btnY = height - 50;
  let btnW = 200;
  let btnH = 32;

  fill(255, 255, 255, 235);
  stroke(180);
  rect(btnX, btnY, btnW, btnH, 8);
  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(13);
  text(catalogVisible ? 'Hide Apparatus Catalog' : 'Show Apparatus Catalog',
       btnX + btnW / 2, btnY + btnH / 2);

  catalogToggleButton = { x: btnX, y: btnY, w: btnW, h: btnH };
}

// --- CATALOG PANEL (NO SCROLL) ---

function drawCatalogPanel() {
  // single panel left of shelf
  const panelX = 20;
  const panelY = 30;
  const panelW = shelf.x - 40;   // space between left edge and shelf
  const panelH = height - 80;

  catalogPanelBounds = { x: panelX, y: panelY, w: panelW, h: panelH };

  // outer white panel
  fill(255, 255, 255, 235);
  stroke(170);
  rect(panelX, panelY, panelW, panelH, 10);

  // heading text
  noStroke();
  fill(0);
  textAlign(LEFT);
  textSize(15);
  textStyle(BOLD);
  text('Apparatus Catalog', panelX + 12, panelY + 24);

  // let LabCatalog draw ONLY the list, no extra card
  const innerY = panelY + 40;          // list starts just under heading
  catalog.drawPanel(
    panelX,        // x = left edge of panel
    innerY,        // y = where list should start
    panelW,        // use full width
    panelH - 50    // height for list
  );
}




// --- EASING ---

function easeVolumes() {
  Object.values(vessels).forEach(v => {
    if (v.type === 'beaker') {
      v.volume += (beakerTargetVol - v.volume) * 0.2;
    } else if (v.type === 'burette') {
      v.volume += (buretteTargetVol - v.volume) * 0.2;
    } else if (v.type === 'pipette') {
      v.volume += (pipetteTargetVol - v.volume) * 0.2;
    }
  });
}

// --- INTERACTION / PHYSICS ---

function handleInteraction() {
  if (!isDragging) return;

  if (isDragging.type === 'pipette') {
    const bottle = Object.values(vessels).find(v => v.type === 'bottle');
    const beaker = Object.values(vessels).find(v => v.type === 'beaker');
    if (bottle && near(isDragging, bottle, 40)) {
      let step = 0.8;
      if (bottle.volume >= step && pipetteTargetVol < isDragging.capacity) {
        bottle.volume -= step;
        pipetteTargetVol = min(isDragging.capacity, pipetteTargetVol + step);
      }
    }
    if (beaker && near(isDragging, beaker, 40)) {
      let step = 0.8;
      if (pipetteTargetVol >= step && beakerTargetVol < beaker.capacity) {
        pipetteTargetVol = max(0, pipetteTargetVol - step);
        beakerTargetVol  = min(beaker.capacity, beakerTargetVol + step);
      }
    }
  }
}

function near(a, b, radius) {
  if (!a || !b) return false;
  return dist(a.x, a.y, b.x, b.y) < radius;
}

// --- EVENTS ---

function mousePressed() {
  // toggle button
  if (catalogToggleButton) {
    const b = catalogToggleButton;
    if (mouseX > b.x && mouseX < b.x + b.w &&
        mouseY > b.y && mouseY < b.y + b.h) {
      catalogVisible = !catalogVisible;
      return;
    }
  }

  // catalogue click
  // --- FIXED CATALOGUE CLICK ---
// --- FIXED CATALOGUE CLICK LOGIC ---
if (catalogVisible && catalogPanelBounds &&
    mouseX > catalogPanelBounds.x && mouseX < catalogPanelBounds.x + catalogPanelBounds.w &&
    mouseY > catalogPanelBounds.y && mouseY < catalogPanelBounds.y + catalogPanelBounds.h) {

  // The 'Apparatus Catalog' title and padding take up about 40-50 pixels 
  // before the actual interactive buttons start.
  const listHeaderOffset = 100; 
  
  // Calculate the click position relative ONLY to the start of the item list
  const localX = mouseX - catalogPanelBounds.x;
  const localY = mouseY - (catalogPanelBounds.y + listHeaderOffset);

  // Use these local coordinates to determine which item was clicked
  const item = catalog.handleClick(localX, localY); 
  
  if (item) {
    spawnApparatusFromCatalog(item);
    return; // Stop further processing once an item is spawned
  }
}

  // drag-existing vessels (unchanged)
  const ids = Object.keys(vessels);
  for (let i = ids.length - 1; i >= 0; i--) {
    const v = vessels[ids[i]];
    if (mouseX > v.x - v.w/2 && mouseX < v.x + v.w/2 &&
        mouseY > v.y - v.h/2 && mouseY < v.y + v.h/2) {
      v.dragging = true;
      isDragging = v;
      break;
    }
  }
}



function mouseDragged() {
  if (isDragging) {
    isDragging.x = mouseX;
    isDragging.y = mouseY;
  }
}

function mouseReleased() {
  if (isDragging) {
    snapToZones(isDragging);
    isDragging.dragging = false;
    isDragging = null;
  }
}

// no mouseWheel handler – scrolling disabled

function mouseClicked() {
  if (mouseButton === RIGHT && hoverVessel) {
    delete vessels[hoverVessel.id];
    hoverVessel = null;
  }
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    if (hoverVessel) {
      delete vessels[hoverVessel.id];
      hoverVessel = null;
      return;
    }
  }

  if (key === ' ' || keyCode === 32) {
    const beaker = Object.values(vessels).find(v => v.type === 'beaker');
    const burette = Object.values(vessels).find(v => v.type === 'burette');
    if (!beaker || !burette) return;

    const benchY = bench.y - 35;
    const under =
      Math.abs(beaker.x - (burette.x - 40)) < 10 &&
      Math.abs(beaker.y - (benchY + 10)) < 15;

    if (!under && !beaker.isUnderBurette) {
      console.log('Place the beaker under the burette, then press SPACE to titrate.');
      return;
    }

    let flow = keyIsDown(SHIFT) ? 0.8 : 0.25;
    if (buretteTargetVol >= flow && beakerTargetVol < beaker.capacity) {
      buretteTargetVol = max(0, buretteTargetVol - flow);
      beakerTargetVol  = min(beaker.capacity, beakerTargetVol + flow);
      studentVolume   += flow;
    }
  }
}

// --- SNAP TO SHELF / BENCH ---

function snapToZones(v) {
  const benchY = bench.y - 35;
  const shelfCenterX = shelf.x + shelf.w / 2;

  const BURETTE_X = bench.x + bench.w - 120;
  const BURETTE_Y = 190;
  const beakerUnderBurette = { x: BURETTE_X - 40, y: benchY + 10 };

  const inShelf =
    mouseX > shelf.x && mouseX < shelf.x + shelf.w &&
    mouseY > shelf.y && mouseY < shelf.y + shelf.h + 40;

  if (v.type === 'burette') {
    v.x = BURETTE_X;
    v.y = BURETTE_Y;
  } else if (inShelf) {
    const topY    = shelf.y + 60;
    const midY    = shelf.y + shelf.h / 2;
    const bottomY = shelf.y + shelf.h - 60;

    if (v.type === 'bottle') {
      v.x = shelfCenterX;
      v.y = topY;
    } else if (v.type === 'pipette') {
      v.x = shelfCenterX;
      v.y = midY;
    } else {
      v.x = shelfCenterX;
      v.y = bottomY;
      if (v.type === 'beaker') v.isUnderBurette = false;
    }
  } else {
    if (v.type === 'bottle') {
      v.x = bench.x + 80;
      v.y = benchY;
    } else if (v.type === 'pipette') {
      v.x = bench.x + 160;
      v.y = benchY - 40;
    } else if (v.type === 'beaker') {
      const dx = mouseX - beakerUnderBurette.x;
      const dy = mouseY - beakerUnderBurette.y;
      const distToStand = Math.sqrt(dx * dx + dy * dy);
      if (distToStand < 80) {
        v.x = beakerUnderBurette.x;
        v.y = beakerUnderBurette.y;
        v.isUnderBurette = true;
      } else {
        v.x = bench.x + 260;
        v.y = benchY;
        v.isUnderBurette = false;
      }
    } else {
      v.x = bench.x + 260;
      v.y = benchY;
    }
  }

  v.snapX = v.x;
  v.snapY = v.y;
}

// --- SPAWN FROM CATALOG ---

let idCounter = 0;
function nextId(type) {
  idCounter += 1;
  return `${type}_${idCounter}`;
}

function spawnApparatusFromCatalog(item) {
  const type = item.id || item.type;
  if (!type) return;

  if (type === 'burette' || type === 'bunsen_burner') {
    if (Object.values(vessels).some(v => v.type === type)) return;
  }

  let v = null;

  if (type === 'beaker') {
    const cap = askCapacity('beaker');
    if (!cap) return;
    v = makeVessel(
      nextId('beaker'),
      shelf.x + shelf.w / 2,
      shelf.y + shelf.h - 60,
      120, 140,
      `${cap} mL Beaker`,
      'Empty',
      'beaker',
      0, cap
    );
    beakerTargetVol = 0;

  } else if (type === 'pipette') {
    const cap = askCapacity('pipette');
    if (!cap) return;
    v = makeVessel(
      nextId('pipette'),
      shelf.x + shelf.w / 2,
      shelf.y + shelf.h / 2,
      300, 130,
      `${cap} mL Pipette`,
      'Empty',
      'pipette',
      0, cap
    );
    pipetteTargetVol = 0;

  } else if (type === 'burette') {
    const cap = askCapacity('burette');
    if (!cap) return;
    v = makeVessel(
      nextId('burette'),
      bench.x + bench.w - 120,
      190,
      200, 360,
      `${cap} mL Burette`,
      '0.1 M NaOH',
      'burette',
      cap, cap
    );
    buretteTargetVol = cap;

  } else if (type === 'volumetric_flask') {
    const cap = askCapacity('volumetric_flask');
    if (!cap) return;
    v = makeVessel(
      nextId('volumetric_flask'),
      shelf.x + shelf.w / 2,
      shelf.y + shelf.h - 60,
      120, 160,
      `${cap} mL Volumetric Flask`,
      'Empty',
      'volumetric_flask',
      0, cap
    );

  } else if (type === 'conical_flask') {
    v = makeVessel(
      nextId('conical_flask'),
      shelf.x + shelf.w / 2,
      shelf.y + shelf.h - 60,
      120, 150,
      'Conical Flask',
      'Empty',
      'conical_flask',
      0, 250
    );

  } else if (type === 'bottle') {
    const chem = askChemical('acid');
    if (!chem) return;
    v = makeVessel(
      nextId('bottle'),
      shelf.x + shelf.w / 2,
      shelf.y + 60,
      120, 100,
      'Reagent Bottle',
      chem.label,
      'bottle',
      100, 100
    );
    v.chemicalId = chem.id;

  } else if (type === 'funnel') {
    v = makeVessel(
      nextId('funnel'),
      shelf.x + shelf.w / 2,
      shelf.y + shelf.h / 2,
      80, 80,
      'Funnel',
      '',
      'funnel',
      0, 0
    );

  } else if (type === 'wash_bottle') {
    v = makeVessel(
      nextId('wash_bottle'),
      shelf.x + shelf.w / 2,
      shelf.y + shelf.h / 2,
      100, 120,
      'Wash Bottle',
      'Distilled Water',
      'wash_bottle',
      0, 250
    );

  } else if (type === 'bunsen_burner') {
    v = makeVessel(
      nextId('bunsen_burner'),
      bench.x + 80,
      bench.y - 20,
      80, 120,
      'Bunsen Burner',
      '',
      'bunsen_burner',
      0, 0
    );
  }

  if (v) {
    vessels[v.id] = v;
  }
}

// --- RESET ---

function resetExperiment() {
  studentVolume    = 0;
  beakerTargetVol  = 0;
  pipetteTargetVol = 0;
  buretteTargetVol = 0;

  Object.values(vessels).forEach(v => {
    if (v.type === 'beaker' || v.type === 'pipette') v.volume = 0;
    if (v.type === 'burette') v.volume = v.capacity;
    if (v.type === 'bottle')  v.volume = 100;
  });

  phStage = 0;
}
