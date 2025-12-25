let burette, beaker, pipette, reservoir, bench;
let studentVolume = 0;
let isDragging = null;
let phColor;
let isPouring = false;

function setup() {
  let canvas = createCanvas(900, 500);
  canvas.parent('simulation-canvas');
  phColor = color(255, 255, 255, 200);

  // Bench
  bench = { x: 0, y: 380, w: width, h: 120 };

  //           x,   y,   w,   h,     type,      label,        vol, maxVol
  burette   = new Labware(720, 120, 40, 260,  'burette',   '0.1 M NaOH', 50, 50);
  beaker    = new Labware(480, 335, 90, 110,  'beaker',    '25 mL HCl',   0, 150);
  pipette   = new Labware(200, 220, 22, 150,  'pipette',   'HCl Stock',  25, 25);
  reservoir = new Labware(200, 380, 90, 60,   'reservoir', 'HCl Stock', 100, 100); // for realism
}

function draw() {
  background(240, 242, 248);

  drawRoom();
  isPouring = false;

  // Interactions (physics first)
  handleInteraction();

  // Draw glassware
  beaker.update();
  reservoir.update();
  burette.update();
  pipette.update();

  // Draw falling stream if pouring
  if (isPouring) drawLiquidStream();

  drawUI();
}

/* ------------------- LABWARE CLASS ------------------- */

class Labware {
  constructor(x, y, w, h, type, label, vol, maxVol) {
    this.x = x; this.y = y;
    this.w = w; this.h = h;
    this.type = type;
    this.label = label;
    this.volume = vol;
    this.maxVolume = maxVol;
    this.dragging = false;
  }

  update() {
    if (this.dragging) {
      this.x = mouseX;
      this.y = mouseY;
    }
    this.display();
  }

  display() {
    push();
    translate(this.x, this.y);
    stroke(70, 80, 90);
    strokeWeight(2);
    noFill();

    if (this.type === 'beaker') {
      // outer beaker
      let r = this.h;
      // walls
      beginShape();
      vertex(-this.w/2, -r);
      vertex(-this.w/2, 0);
      vertex(this.w/2, 0);
      vertex(this.w/2, -r);
      endShape();

      // base
      line(-this.w/2, 0, this.w/2, 0);

      // liquid
      if (this.volume > 0) {
        let hFill = map(this.volume, 0, this.maxVolume, 0, r - 18);
        noStroke();
        fill(phColor);
        rect(-this.w/2 + 3, -hFill, this.w - 6, hFill);
      }

    } else if (this.type === 'burette') {
      // top reservoir
      rect(-this.w/2, -this.h, this.w, 40, 6, 6, 2, 2);

      // long tube
      rect(-this.w/4, -this.h + 40, this.w/2, this.h - 70, 6);

      // tip
      line(0, -20, 0, 5);
      ellipse(0, 10, 12, 12);

      // divisions
      stroke(180);
      for (let i = 0; i <= 10; i++) {
        let yy = map(i, 0, 10, -this.h + 45, -35);
        line(-this.w/4 - 6, yy, -this.w/4, yy);
      }

      // liquid inside (from top down)
      let tubeHeight = this.h - 70;
      let hFill = map(this.volume, 0, this.maxVolume, 0, tubeHeight);
      noStroke();
      fill(80, 180, 255, 180);
      rect(-this.w/4 + 3, -this.h + 40 + tubeHeight - hFill, this.w/2 - 6, hFill);

    } else if (this.type === 'pipette') {
      // body
      beginShape();
      vertex(-this.w/2, -this.h);
      vertex(this.w/2, -this.h);
      vertex(this.w/2, 0);
      vertex(0, 15);
      vertex(-this.w/2, 0);
      endShape(CLOSE);

      // bulb
      ellipse(0, -this.h + 25, this.w + 20, 40);

      // fill
      if (this.volume > 0) {
        let hFill = map(this.volume, 0, this.maxVolume, 0, this.h - 35);
        noStroke();
        fill(80, 180, 255, 180);
        rect(-this.w/2 + 3, -this.h + 20, this.w - 6, hFill);
      }

    } else if (this.type === 'reservoir') {
      // stock bottle
      rect(-this.w/2, -this.h, this.w, this.h, 8);
      rect(-this.w/4, -this.h - 20, this.w/2, 20, 5, 5, 0, 0);
      if (this.volume > 0) {
        let hFill = map(this.volume, 0, this.maxVolume, 0, this.h - 10);
        noStroke();
        fill(80, 180, 255, 160);
        rect(-this.w/2 + 3, -hFill - 3, this.w - 6, hFill);
      }
    }

    // labels
    fill(40); noStroke(); textAlign(CENTER);
    textSize(11);
    text(this.label, 0, 28);
    textSize(10);
    text(nf(this.volume, 1, 1) + ' mL', 0, -this.h - 12);
    pop();
  }

  clicked() {
    if (mouseX > this.x - this.w/2 && mouseX < this.x + this.w/2 &&
        mouseY > this.y - this.h - 20 && mouseY < this.y + 30) {
      this.dragging = true;
      return true;
    }
    return false;
  }

  stopDragging() {
    this.dragging = false;
  }
}

/* ------------------- INTERACTION & PHYSICS ------------------- */

function handleInteraction() {
  if (!isDragging) return;

  // Pipette -> Beaker (transfer all acid)
  if (isDragging.type === 'pipette') {
    if (dist(pipette.x, pipette.y, beaker.x, beaker.y - 60) < 55) {
      if (pipette.volume > 0 && beaker.volume < beaker.maxVolume) {
        let step = 0.6;
        pipette.volume = max(0, pipette.volume - step);
        beaker.volume = min(beaker.maxVolume, beaker.volume + step);
        isPouring = true;
      }
    }
  }

  // Burette -> Beaker (titration)
  if (isDragging.type === 'burette') {
    let tipX = burette.x;
    let tipY = burette.y + 10;
    if (abs(tipX - beaker.x) < 40 && tipY < beaker.y && tipY > beaker.y - 90) {
      if (burette.volume > 0 && beaker.volume < beaker.maxVolume) {
        let flow = keyIsDown(SHIFT) ? 0.6 : 0.18; // faster with SHIFT
        burette.volume = max(0, burette.volume - flow);
        beaker.volume = min(beaker.maxVolume, beaker.volume + flow);
        studentVolume += flow;
        isPouring = true;

        // Phenolphthalein endpoint approx at 25 mL base added
        let pink = map(studentVolume, 24.0, 26.0, 0, 200);
        pink = constrain(pink, 0, 200);
        phColor = color(255, 255 - pink, 255 - pink * 0.5, 200);
      }
    }
  }
}

function drawLiquidStream() {
  stroke(80, 180, 255, 180);
  strokeWeight(3);
  if (isDragging.type === 'burette') {
    line(burette.x, burette.y + 10, beaker.x, beaker.y - 75);
  } else if (isDragging.type === 'pipette') {
    line(pipette.x, pipette.y + 5, beaker.x, beaker.y - 75);
  }
}

/* ------------------- UI & SCENE ------------------- */

function drawRoom() {
  // back wall
  noStroke();
  fill(232, 236, 245);
  rect(0, 0, width, height);

  // bench
  fill(110, 105, 100);
  rect(bench.x, bench.y, bench.w, bench.h);
  fill(80, 76, 72);
  rect(bench.x, bench.y, bench.w, 6);

  // label areas (reserved)
}

function drawUI() {
  // Instruction box
  fill(255, 255, 255, 230);
  stroke(210);
  rect(40, 40, 280, 130, 12);
  noStroke(); fill(0);
  textAlign(LEFT);
  textSize(16);
  textStyle(BOLD);
  text('Titration Procedure', 55, 65);
  textStyle(NORMAL); textSize(13);
  text('1. Drag pipette to beaker to add acid.', 55, 90);
  text('2. Drag burette tip over beaker mouth.', 55, 110);
  text('3. Titrate until solution turns PINK.', 55, 130);

  // Data panel
  fill(255, 255, 255, 230);
  stroke(210);
  rect(width - 230, 40, 200, 130, 12);
  noStroke(); fill(0);
  textAlign(LEFT);
  textSize(15); textStyle(BOLD);
  text('Live Data', width - 215, 65);
  textStyle(NORMAL); textSize(13);
  text('Base added: ' + nf(studentVolume, 1, 2) + ' mL', width - 215, 95);

  if (studentVolume > 0) {
    let diff = abs(studentVolume - 25.0);
    if (diff < 0.25) {
      fill(0, 150, 0);
      text('Perfect endpoint ✔', width - 215, 120);
    } else if (studentVolume > 26) {
      fill(200, 0, 0);
      text('Overshot endpoint ✖', width - 215, 120);
    } else {
      fill(120, 120, 0);
      text('Approaching endpoint…', width - 215, 120);
    }
  }
}

/* ------------------- EVENTS ------------------- */

function mousePressed() {
  if (burette.clicked()) isDragging = burette;
  else if (pipette.clicked()) isDragging = pipette;
  else if (beaker.clicked()) isDragging = beaker;   // beaker can be moved if needed
}

function mouseReleased() {
  if (isDragging) {
    isDragging.stopDragging();
    isDragging = null;
  }
}

function resetExperiment() {
  studentVolume = 0;
  beaker.volume = 0;
  burette.volume = 50;
  pipette.volume = 25;
  reservoir.volume = 100;
  phColor = color(255, 255, 255, 200);
}
