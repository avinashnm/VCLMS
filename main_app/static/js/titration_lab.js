// --- GLOBAL STATE ---

let vessels = {};
let bench, shelf;
let isDragging = null;
let hoverVessel = null;

let studentVolume = 0;
let phStage = 0; // 0: clear, 1: light pink, 2: deep pink

// targets for easing
let beakerTargetVol = 0;
let pipetteTargetVol = 25;
let buretteTargetVol = 50;

// images
let imgBench, imgShelf;
let imgBurette, imgPipette, imgBottle;
let imgBeakerEmpty, imgBeakerHcl, imgBeakerLight, imgBeakerHeavy;

function preload() {
  imgBench       = loadImage('/static/images3/titration/bench.png');
  imgShelf       = loadImage('/static/images3/titration/Shelf.jpg');
  imgBurette     = loadImage('/static/images3/titration/burette.png');
  imgPipette     = loadImage('/static/images3/titration/pipette.png');
  imgBottle      = loadImage('/static/images3/titration/stock-HCL.png');
  imgBeakerEmpty = loadImage('/static/images3/titration/beakerEmpty.png');
  imgBeakerHcl   = loadImage('/static/images3/titration/beakerWithHCL.png');
  imgBeakerLight = loadImage('/static/images3/titration/beakerLightTitration.png');
  imgBeakerHeavy = loadImage('/static/images3/titration/beakerHeavyTitration.png');
}

function setup() {
  let canvas = createCanvas(900, 500);
  canvas.parent('simulation-canvas');

  shelf = { x: 20, y: 60, w: 300, h: 350 };
  bench = { x: 300,  y: 260, w: 600, h: 340 };

  // define vessel objects with sprite, capacity, etc.
  vessels.beaker = makeVessel(
    'beaker',
    500, 325,                  // start on bench
    120, 140,
    '250 mL Beaker (Unknown Acid)',
    'Beaker with 25 mL HCl',
    'beaker',                  // type
    25, 250
  );

  vessels.burette = makeVessel(
    'burette',
    720, 190,
    200, 360,
    '50 mL Burette',
    '0.1 M NaOH',
    'burette',
    50, 50
  );

  vessels.pipette = makeVessel(
    'pipette',
    260, 220,
    300, 130,
    '25 mL Pipette',
    'HCl Pipette',
    'pipette',
    25, 25
  );

  vessels.bottle = makeVessel(
    'bottle',
    260, 330,
    120, 100,
    'Stock Bottle',
    'HCl Stock',
    'bottle',
    100, 100
  );

  // initial liquid volumes
  beakerTargetVol = 25;           // 25 mL acid
  pipetteTargetVol = 0;           // pipette empty visually
  buretteTargetVol = 50;
  vessels.beaker.volume = 25;
  vessels.pipette.volume = 0;
  vessels.burette.volume = 50;

  studentVolume = 0;
  phStage = 0;
}

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
    dragging: false
  };
}

function draw() {
  background(240, 242, 248);

  drawEnvironment();
  easeVolumes();

  handleInteraction();

  // draw in order: shelf, bench layer behind, then vessels
  drawShelfAndBench();

  hoverVessel = null;
  drawVessel(vessels.bottle);
  drawVessel(vessels.beaker);
  drawVessel(vessels.burette);
  drawVessel(vessels.pipette);

  if (hoverVessel) drawTooltip(hoverVessel);
  drawDataPanel();
}

// --------- DRAWING FUNCTIONS ----------

function drawEnvironment() {
  noStroke();
  fill(232, 236, 245);
  rect(0, 0, width, height);
}

function drawShelfAndBench() {
  // shelf
  imageMode(CORNER);
  image(imgShelf, shelf.x, shelf.y, shelf.w, shelf.h);

  // bench (at bottom)
  image(imgBench, bench.x, bench.y, bench.w, bench.h);

  // soft shadows on bench
  fill(0, 0, 0, 35);
  noStroke();
  ellipse(vessels.beaker.x, bench.y + 10, 90, 12);
  ellipse(vessels.bottle.x, bench.y + 10, 80, 12);
  ellipse(vessels.burette.x, bench.y + 10, 70, 12);
}

function drawVessel(v) {
  let over = mouseX > v.x - v.w/2 && mouseX < v.x + v.w/2 &&
             mouseY > v.y - v.h/2 && mouseY < v.y + v.h/2;

  if (over && !isDragging) hoverVessel = v;

  push();
  translate(v.x, v.y);
  imageMode(CENTER);

  if (v.type === 'beaker') {
    let img = imgBeakerEmpty;
    if (v.volume > 0 && phStage === 0) img = imgBeakerHcl;
    else if (phStage === 1) img = imgBeakerLight;
    else if (phStage === 2) img = imgBeakerHeavy;
    image(img, 0, 0, v.w, v.h);
  } else if (v.type === 'burette') {
    image(imgBurette, 0, 0, v.w, v.h);
    // overlay liquid level in tube: simple blue rect
    let tubeTop = -v.h/2 + 80;
    let tubeBottom = v.h/2 - 120;
    let tubeH = tubeBottom - tubeTop;
    let frac = constrain(v.volume / v.capacity, 0, 1);
    let liqTop = lerp(tubeTop, tubeBottom, 1 - frac);
    noStroke();
    fill(70, 150, 240, 200);
    rect(-v.w * 0.03, liqTop, v.w * 0.05, tubeBottom - liqTop);
  } else if (v.type === 'pipette') {
    image(imgPipette, 0, 0, v.w, v.h);
    let tubeTop = -v.h/2 + 100;
    let tubeBottom = v.h/2 - 120;
    let tubeH = tubeBottom - tubeTop;
    let frac = constrain(v.volume / v.capacity, 0, 1);
    let liqTop = lerp(tubeTop, tubeBottom, 1 - frac);
    noStroke();
    fill(70, 150, 240, 200);
    rect(-v.w * 0.02, liqTop, v.w * 0.04, tubeBottom - liqTop);
  } else if (v.type === 'bottle') {
    image(imgBottle, 0, 0, v.w, v.h);
  }

  // draw title below
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
  // instructions panel on left
  fill(255, 255, 255, 235);
  stroke(210);
  rect(30, 30, 280, 130, 12);
  noStroke(); fill(0);
  textAlign(LEFT);
  textSize(16); textStyle(BOLD);
  text('Titration Procedure', 45, 55);
  textStyle(NORMAL); textSize(13);
  text('1. Drag pipette near beaker to fill.', 45, 82);
  text('2. Drag burette tip over beaker mouth.', 45, 102);
  text('3. Release to titrate until pink.', 45, 122);

  // live data on right
  fill(255, 255, 255, 235);
  stroke(210);
  rect(width - 230, 30, 200, 140, 12);
  noStroke(); fill(0);
  textAlign(LEFT);
  textSize(15); textStyle(BOLD);
  text('Live Data', width - 215, 55);
  textStyle(NORMAL); textSize(13);
  text('Base added: ' + nf(studentVolume, 1, 2) + ' mL', width - 215, 80);

  if (studentVolume > 0) {
    let diff = abs(studentVolume - 25.0);
    if (diff < 0.25) {
      fill(0, 150, 0);
      text('Perfect endpoint ✔', width - 215, 105);
      phStage = 2;
    } else if (studentVolume > 26) {
      fill(200, 0, 0);
      text('Overshot endpoint ✖', width - 215, 105);
      phStage = 2;
    } else {
      fill(120, 120, 0);
      text('Approaching endpoint…', width - 215, 105);
      phStage = 1;
    }
  } else {
    phStage = 0;
  }
}

// --------- EASING VOLUMES ---------

function easeVolumes() {
  vessels.beaker.volume += (beakerTargetVol - vessels.beaker.volume) * 0.2;
  vessels.burette.volume += (buretteTargetVol - vessels.burette.volume) * 0.2;
  vessels.pipette.volume += (pipetteTargetVol - vessels.pipette.volume) * 0.2;
}

// --------- INTERACTION / PHYSICS ---------

function handleInteraction() {
  if (!isDragging) return;

  // pipette over bottle -> fill pipette
  if (isDragging.id === 'pipette') {
    if (near(isDragging, vessels.bottle, 40)) {
      let step = 0.8;
      if (vessels.bottle.volume >= step && pipetteTargetVol < vessels.pipette.capacity) {
        vessels.bottle.volume -= step;
        pipetteTargetVol = min(vessels.pipette.capacity, pipetteTargetVol + step);
      }
    }
    // pipette over beaker -> pour HCl
    if (near(isDragging, vessels.beaker, 40)) {
      let step = 0.8;
      if (pipetteTargetVol >= step && beakerTargetVol < vessels.beaker.capacity) {
        pipetteTargetVol = max(0, pipetteTargetVol - step);
        beakerTargetVol = min(vessels.beaker.capacity, beakerTargetVol + step);
      }
    }
  }

  // burette over beaker -> titrate NaOH
  
}

function near(a, b, radius) {
  return dist(a.x, a.y, b.x, b.y) < radius;
}

function buretteTipOverBeaker() {
  let tipX = vessels.burette.x;
  let tipY = vessels.burette.y + vessels.burette.h/2 - 10;
  return (abs(tipX - vessels.beaker.x) < 35 &&
          tipY < vessels.beaker.y &&
          tipY > vessels.beaker.y - vessels.beaker.h/2);
}

// --------- EVENTS ---------

function mousePressed() {
  // choose vessel to drag (topmost first)
  let order = ['pipette', 'burette', 'beaker', 'bottle'];
  for (let id of order) {
    let v = vessels[id];
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
    // snap to nearest slot on bench or shelf
    snapToZones(isDragging);
    isDragging.dragging = false;
    isDragging = null;
  }
}

function snapToZones(v) {
  // Fixed burette position on right side of bench
  const BURETTE_X = 220;
  const BURETTE_Y = 190;

  // Bench work positions
  const benchY = bench.y - 35;       // general bench height
  const bottlePos  = { x: 260, y: benchY };
  const pipettePos = { x: 360, y: benchY - 40 };
  const beakerPos  = { x: 500, y: benchY };

  // Special slot: beaker directly under burette stand
  const beakerUnderBurette = { x: BURETTE_X - 40, y: benchY + 10 };

  // 1) Burette: always snap back to its fixed stand
  if (v.id === 'burette') {
    v.x = BURETTE_X;
    v.y = BURETTE_Y;
    v.snapX = v.x;
    v.snapY = v.y;
    return;
  }

  // 2) For other vessels – check shelf first
  const inShelf =
    mouseX > shelf.x && mouseX < shelf.x + shelf.w &&
    mouseY > shelf.y && mouseY < shelf.y + shelf.h + 40;

  if (inShelf) {
    const shelfCenterX = shelf.x + shelf.w / 2;
    const topY    = shelf.y + 60;
    const midY    = shelf.y + shelf.h / 2;
    const bottomY = shelf.y + shelf.h - 60;

    if (v.id === 'bottle') {
      v.x = shelfCenterX;
      v.y = topY;
    } else if (v.id === 'pipette') {
      v.x = shelfCenterX;
      v.y = midY;
    } else if (v.id === 'beaker') {
      v.x = shelfCenterX;
      v.y = bottomY;
    }

  } else {
    // 3) Not on shelf → bench logic

    if (v.id === 'bottle') {
      v.x = bottlePos.x;
      v.y = bottlePos.y;
    } else if (v.id === 'pipette') {
      v.x = pipettePos.x;
      v.y = pipettePos.y;
    } else if (v.id === 'beaker') {
      // If released near the burette stand → snap under burette
      const dx = mouseX - beakerUnderBurette.x;
      const dy = mouseY - beakerUnderBurette.y;
      const distToStand = Math.sqrt(dx * dx + dy * dy);

      if (distToStand < 80) {
        v.x = beakerUnderBurette.x;
        v.y = beakerUnderBurette.y;
        v.isUnderBurette = true;
      } else {
        v.x = beakerPos.x;
        v.y = beakerPos.y;
        v.isUnderBurette = false;
      }
    }
  }

  v.snapX = v.x;
  v.snapY = v.y;
}

function keyPressed() {
  // SPACE bar = titrate, only if beaker is under burette stand
  if (key === ' ' || keyCode === 32) {
    const beaker = vessels.beaker;
    const burette = vessels.burette;

    // optional safety: check position instead of flag
    const under =
      Math.abs(beaker.x - (burette.x - 40)) < 10 &&
      Math.abs(beaker.y - (bench.y - 35 + 10)) < 15;

    if (!under && !beaker.isUnderBurette) {
      // not in correct position – optionally show hint
      console.log('Place the beaker under the burette, then press SPACE to titrate.');
      return;
    }

    // perform one titration "step"
    let flow = keyIsDown(SHIFT) ? 0.8 : 0.25;

    if (buretteTargetVol >= flow && beakerTargetVol < beaker.capacity) {
      buretteTargetVol = max(0, buretteTargetVol - flow);
      beakerTargetVol  = min(beaker.capacity, beakerTargetVol + flow);
      studentVolume    += flow;
    }
  }
}



function resetExperiment() {
  studentVolume = 0;
  beakerTargetVol = 25;
  pipetteTargetVol = 0;
  buretteTargetVol = 50;

  vessels.beaker.volume = 25;
  vessels.burette.volume = 50;
  vessels.pipette.volume = 0;
  vessels.bottle.volume = 100;

  phStage = 0;
}
