let beaker, burette, pipette, workbench;
let experimentData = {};
let studentVolume = 0;
let isDragging = null;
let phColor = [255, 255, 255]; // Clear initially

function setup() {
  let canvas = createCanvas(900, 500);
  canvas.parent('simulation-canvas');
  
  // Initialize lab equipment
  workbench = {x: 0, y: 400, w: 900, h: 100};
  burette = new Labware(750, 80, 50, 180, 'burette', 'NaOH 0.1M', 50);
  beaker = new Labware(400, 250, 100, 160, 'beaker', 'HCl 0.1M', 0);
  pipette = new Labware(150, 80, 35, 70, 'pipette', 'HCl 0.1M', 25);
}

function draw() {
  // Lab bench
  background(245, 235, 220);
  fill(139, 69, 19);
  rect(workbench.x, workbench.y, workbench.w, workbench.h);
  
  // Update and draw equipment
  burette.update();
  beaker.update();
  pipette.update();
  
  // Pouring physics
  handlePouring();
  
  // UI overlays
  drawInstructions();
  drawDataTable();
}

class Labware {
  constructor(x, y, w, h, type, label, volume) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.type = type; this.label = label; this.volume = volume;
    this.dragging = false; this.offsetX = 0; this.offsetY = 0;
    this.maxVolume = type === 'beaker' ? 100 : 50;
  }
  
  update() {
    this.draw();
    this.handleDrag();
  }
  
  draw() {
    push();
    translate(this.x, this.y);
    
    stroke(0); strokeWeight(3);
    
    if (this.type === 'beaker') {
      fill(220); 
      rect(-this.w/2, -this.h+25, this.w, this.h);
      // Liquid level
      let level = map(this.volume, 0, this.maxVolume, 25, this.h-35);
      fill(phColor[0], phColor[1], phColor[2], 180);
      rect(-this.w/2+8, -level, this.w-16, level);
    } else if (this.type === 'burette') {
      fill(255); 
      rect(-this.w/2, -this.h+5, this.w, this.h-10);
      // Valve
      fill(80); ellipse(0, 5, 18, 18);
      // Liquid level
      fill(0, 180, 255, 160);
      let level = map(this.volume, 0, this.maxVolume, 25, this.h-40);
      rect(-this.w/2+6, -this.h+10, this.w-12, level);
    } else if (this.type === 'pipette') {
      fill(255);
      ellipse(0, -20, this.w, 25);
      rect(-this.w/2+5, -20, this.w-10, this.h);
      // Liquid
      fill(0, 180, 255, 160);
      let level = map(this.volume, 0, 25, 10, this.h-10);
      rect(-this.w/2+12, -20+5, 10, level);
    }
    
    // Labels
    fill(0); textAlign(CENTER); textSize(11);
    text(`${this.volume.toFixed(1)}ml`, 0, -this.h-8);
    textSize(10); text(this.label, 0, this.h/2 + 18);
    pop();
  }
  
  handleDrag() {
    let d = dist(mouseX, mouseY, this.x, this.y);
    if (d < 50 && mouseIsPressed && !isDragging) {
      this.dragging = true;
      isDragging = this;
      this.offsetX = this.x - mouseX;
      this.offsetY = this.y - mouseY;
    }
    
    if (this.dragging) {
      this.x = constrain(mouseX + this.offsetX, 50, width-50);
      this.y = constrain(mouseY + this.offsetY, 50, height-100);
    }
    
    if (mouseReleased() && this.dragging) {
      this.dragging = false;
      isDragging = null;
    }
  }
}

function handlePouring() {
  if (!isDragging) return;
  
  // Burette pouring into beaker
  if (isDragging.type === 'burette') {
    let d = dist(isDragging.x, isDragging.y + 30, beaker.x, beaker.y);
    if (d < 70 && isDragging.volume > 0 && beaker.y < 350) {
      let pourAmount = 0.4;
      isDragging.volume = max(0, isDragging.volume - pourAmount);
      beaker.volume += pourAmount;
      studentVolume += pourAmount;
      
      // Simple pH simulation
      let totalBase = studentVolume;
      let ph = totalBase > 24 ? 9 : 3 + (totalBase/8);
      phColor = ph > 8.2 ? [255, 120, 180] : [255, 255, 255];
    }
  }
  
  // Pipette filling beaker
  if (isDragging.type === 'pipette') {
    let d = dist(isDragging.x, isDragging.y + 40, beaker.x, beaker.y);
    if (d < 70 && beaker.volume < 30) {
      let pourAmount = 0.5;
      isDragging.volume = max(0, isDragging.volume - pourAmount);
      beaker.volume += pourAmount;
    }
  }
}

function drawInstructions() {
  fill(0, 0, 0, 140);
  rect(20, 20, 280, 140);
  fill(255);
  textSize(16); textAlign(LEFT);
  text("Acid-Base Titration", 35, 45);
  textSize(12);
  text("1. Drag pipette → beaker", 35, 75);
  text("2. Drag burette → titrate", 35, 95);
  text("3. Stop at pink endpoint!", 35, 115);
  fill(255); textSize(13);
  text(`Used: ${studentVolume.toFixed(1)}ml`, 35, 135);
}

function drawDataTable() {
  fill(255, 255, 255, 220);
  stroke(0); strokeWeight(1);
  rect(620, 20, 260, 110);
  fill(0);
  textSize(14); textAlign(LEFT);
  text("Data", 635, 42);
  text(`Burette used: ${studentVolume.toFixed(1)}ml`, 635, 65);
  text(`Expected: 25.0ml`, 635, 85);
  text(`Error: ${abs(studentVolume-25).toFixed(1)}ml`, 635, 105);
  
  let score = abs(studentVolume - 25) < 2 ? "✅ PASS" : "❌ Retry";
  fill(score.includes("PASS") ? [50, 200, 50] : [255, 100, 100]);
  textSize(16); text(score, 635, 125);
}

function resetExperiment() {
  studentVolume = 0;
  beaker.volume = 0;
  burette.volume = 50;
  pipette.volume = 25;
  phColor = [255, 255, 255];
}
