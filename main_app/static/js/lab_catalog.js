// ======================================================
// LAB CATALOG CLASS (GENERIC 6-GROUP SYSTEM + 17 SPRITES)
// ======================================================
class LabCatalog {
  constructor(config) {
    this.config = config || {};
    this.groups = {};
    this.hoverItem = null;
    this.sprites = {};
    this.scale = config.scale || sizeMultiplier;  // Use global scale

    this._buildGroups();
  }

  _buildGroups() {
    // ⭐ GENERIC FUNCTION-BASED GROUPS (Core Library)
    this.groups = {
      volumetric: [
        { id: 'beaker', name: 'Beaker', spriteKey: 'beaker' },
        { id: 'pipette', name: 'Pipette', spriteKey: 'pipette' },
        { id: 'volumetric_flask', name: 'Vol. Flask', spriteKey: 'volumetric_flask' }
      ],
      titration: [
        { id: 'burette_tube', name: 'Burette Tube', spriteKey: 'burette_tube' },
        { id: 'common_stand', name: 'Common Stand', spriteKey: 'common_stand' },
        { id: 'conical_flask', name: 'Conical Flask', spriteKey: 'conical_flask' },
        { id: 'burette', name: 'Classic Burette', spriteKey: 'burette' }
      ],
      heating: [
        { id: 'hotplate', name: 'Hotplate', spriteKey: 'hotplate' },
        { id: 'bunsen_burner', name: 'Bunsen Burner', spriteKey: 'bunsen_burner' },
        { id: 'liebig_condensor', name: 'Condenser', spriteKey: 'liebig_condensor' }
      ],
      separation: [
        { id: 'separatory_funnel', name: 'Sep. Funnel', spriteKey: 'separatory_funnel' },
        { id: 'funnel', name: 'Filter Funnel', spriteKey: 'funnel' },
        { id: 'crucible', name: 'Crucible', spriteKey: 'crucible' }
      ],
      analytical: [
        { id: 'pH_meter', name: 'pH Meter', spriteKey: 'pH_meter' },
        { id: 'balance', name: 'Analytical Balance', spriteKey: 'balance' },
        { id: 'meltingpoint_apparatus', name: 'M.P. Apparatus', spriteKey: 'meltingpoint_apparatus' },
        { id: 'TLC_plate', name: 'TLC Plate', spriteKey: 'TLC_plate' }
      ],
      utility: [
        { id: 'bottle', name: 'Reagent Bottle', spriteKey: 'bottle' },
        { id: 'wash_bottle', name: 'Wash Bottle', spriteKey: 'wash_bottle' }
      ],
      other: []
    };

    // MERGE dynamically added database apparatus
    if (this.config.apparatus && this.config.apparatus.length > 0) {
      const categoryMap = {
        'beaker': 'volumetric', 'pipette': 'volumetric', 'volumetric_flask': 'volumetric',
        'burette': 'titration', 'burette_tube': 'titration', 'common_stand': 'titration', 'conical_flask': 'titration',
        'hotplate': 'heating', 'bunsen_burner': 'heating', 'liebig_condensor': 'heating',
        'separatory_funnel': 'separation', 'funnel': 'separation', 'crucible': 'separation',
        'pH_meter': 'analytical', 'balance': 'analytical', 'meltingpoint_apparatus': 'analytical', 'TLC_plate': 'analytical',
        'bottle': 'utility', 'wash_bottle': 'utility'
      };

      this.config.apparatus.forEach(app => {
        let cat = categoryMap[app.type] || 'other';

        // Prevent exact duplicates from showing up twice if user configures "Beaker" in DB
        const exists = this.groups[cat].some(existing => existing.id === app.type && existing.name === app.name);
        if (!exists) {
          this.groups[cat].push({
            id: app.type,
            name: app.name,
            spriteKey: app.type, // Map UI sprite graphic
            db_id: app.id,
            capacity: app.max_capacity
          });
        }
      });
    }

    // Remove empty groups
    for (const [key, items] of Object.entries(this.groups)) {
      if (items.length === 0) delete this.groups[key];
    }
  }

  initSprites(spriteMap) {
    this.sprites = spriteMap || {};
  }

  drawPanel(x, y, w, h, scale = this.scale) {
    const colW = 85 * scale;
    const rowH = 65 * scale;
    const margin = 12 * scale;

    // Title
    noStroke();
    fill(0);
    textAlign(LEFT);
    textSize(15 * scale);
    textStyle(BOLD);
    text('Apparatus Catalog', x + 12, y + 25);
    textStyle(NORMAL);
    textSize(11 * scale);
    text('Click to spawn', x + 12, y + 42);

    this.hoverItem = null;
    let gridY = y + 65;

    // Draw each group
    Object.entries(this.groups).forEach(([groupName, items]) => {
      // Group header (except first)
      if (gridY > y + 65) {
        fill(245, 248, 255);
        stroke(200, 220, 255);
        strokeWeight(1 * scale);
        rect(x + 8, gridY - 8, w - 16, 20 * scale, 6);
        noStroke();
        fill(70);
        textAlign(LEFT);
        textSize(10 * scale);
        textStyle(BOLD);
        text(groupName.toUpperCase(), x + 18, gridY + 3);
        gridY += 22 * scale;
      }

      // 3-column grid for items
      for (let row = 0; row < Math.ceil(items.length / 3); row++) {
        let gridX = x + 15;

        for (let col = 0; col < 3; col++) {
          const idx = row * 3 + col;
          if (idx >= items.length) break;

          const item = items[idx];
          const over = mouseX > gridX && mouseX < gridX + colW &&
            mouseY > gridY - 28 * scale && mouseY < gridY + 28 * scale;

          // Hover effect
          if (over) {
            fill(220, 240, 255, 220);
            stroke(100, 150, 255);
            strokeWeight(2 * scale);
            rect(gridX, gridY - 30 * scale, colW, 55 * scale, 8);
            this.hoverItem = item;
          } else {
            fill(250, 252, 255, 200);
            stroke(220);
            strokeWeight(1 * scale);
            rect(gridX, gridY - 30 * scale, colW, 55 * scale, 8);
          }

          // Icon
          noStroke();
          push();
          imageMode(CENTER);
          const sprite = this.sprites[item.spriteKey];
          if (sprite) {
            let iw = 22 * scale, ih = 28 * scale;
            if (item.id === 'pipette') { iw *= 0.65; ih *= 2.0; }
            if (item.id === 'burette') { iw *= 0.7; ih *= 2.4; }
            if (item.id === 'burette_tube') { iw *= 0.7; ih *= 2.4; }
            if (item.id === 'common_stand') { iw *= 0.8; ih *= 2.4; }
            if (item.id === 'liebig_condensor') { iw *= 0.8; ih *= 2.2; }
            if (item.id === 'separatory_funnel') { iw *= 0.75; ih *= 2.3; }
            if (item.id === 'pH_meter') { iw *= 0.9; ih *= 1.6; }
            image(sprite, gridX + colW / 2, gridY - 8 * scale, iw, ih);
          }
          pop();

          // Label
          fill(50);
          textAlign(CENTER);
          textSize(9 * scale);
          text(item.name, gridX + colW / 2, gridY + 15 * scale);

          gridX += colW + margin;
        }
        gridY += rowH;
      }

      gridY += 8 * scale; // Group spacing
    });
  }

  handleClick(mx, my) {
    return this.hoverItem;  // Caller checks bounds
  }
}
class ChemicalCatalog {
  constructor(chemicals) {
    this.chemicals = chemicals;
    this.hoverItem = null;
  }

  drawPanel(x, y, w, h, scale = 0.8) {
    // Title
    noStroke(); fill(0); textAlign(LEFT); textSize(15 * scale); textStyle(BOLD);
    text('\uD83E\uDDF4 CHEMICALS', x + 12, y + 25);
    textStyle(NORMAL); textSize(11 * scale);
    text('Click to spawn bottle', x + 12, y + 42);

    const colW = 140 * scale, rowH = 115 * scale, margin = 15 * scale;
    this.hoverItem = null;

    for (let i = 0; i < this.chemicals.length; i++) {
      const item = this.chemicals[i];
      const col = i % 2, row = Math.floor(i / 2);
      const px = x + 15 + col * (colW + margin);
      const py = y + 65 + row * (rowH + 10);

      const over = mouseX > px && mouseX < px + colW &&
        mouseY > py && mouseY < py + rowH;

      // Tile background
      if (over) {
        fill(220, 235, 255, 230); stroke(100, 150, 255); strokeWeight(2 * scale);
        this.hoverItem = item;
      } else {
        fill(248, 250, 255, 210); stroke(210, 220, 240); strokeWeight(1 * scale);
      }
      rect(px, py, colW, rowH, 12);

      // --- Draw Reagent Bottle ---
      push();
      const [r, g, b] = item.color;
      const bx = px + colW / 2;       // bottle center X
      const by = py + 14 * scale;     // bottle top Y
      const bw = 32 * scale;          // bottle body width
      const bh = 52 * scale;          // bottle body height
      const neckW = 14 * scale;       // neck width
      const neckH = 12 * scale;       // neck height

      // 1. Bottle body glass (faint tint)
      noStroke();
      fill(r, g, b, 45);
      rect(bx - bw / 2, by + neckH, bw, bh, 4, 4, 12, 12);

      // 2. Liquid fill (chemical color)
      let fillH = bh * 0.68;
      fill(r, g, b, 200);
      rect(bx - bw / 2 + 2, by + neckH + (bh - fillH) - 2, bw - 4, fillH + 2, 2, 2, 11, 11);

      // 3. Glass highlight stripe
      fill(255, 255, 255, 70);
      rect(bx - bw / 2 + 4, by + neckH + 6, 5 * scale, bh - 14, 3);

      // 4. Bottle outline
      noFill(); stroke(r, g, b, 140); strokeWeight(1.5 * scale);
      rect(bx - bw / 2, by + neckH, bw, bh, 4, 4, 12, 12);

      // 5. Neck
      noStroke(); fill(r, g, b, 90);
      rect(bx - neckW / 2, by + 6, neckW, neckH, 3);
      noFill(); stroke(r, g, b, 140); strokeWeight(1.2 * scale);
      rect(bx - neckW / 2, by + 6, neckW, neckH, 3);

      // 6. Cap (dark cap on top)
      noStroke(); fill(40, 40, 40, 220);
      rect(bx - neckW / 2 - 2, by, neckW + 4, 8 * scale, 3, 3, 0, 0);
      fill(255, 255, 255, 40);
      rect(bx - neckW / 2, by + 1, neckW / 2, 3 * scale, 2);

      // 7. White label band with initials
      fill(255, 255, 255, 200); noStroke();
      let labelY = by + neckH + bh * 0.28;
      rect(bx - bw / 2 + 2, labelY, bw - 4, 16 * scale, 2);
      fill(max(0, r - 60), max(0, g - 60), max(0, b - 60), 255);
      textAlign(CENTER, CENTER); textStyle(BOLD); textSize(9 * scale);
      let initials = item.name ? item.name.split(' ').map(w => w[0]).join('').substring(0, 3) : '?';
      text(initials, bx, labelY + 8 * scale);

      pop();

      // Chemical name label below the bottle
      noStroke(); fill(40); textAlign(CENTER); textStyle(NORMAL); textSize(10 * scale);
      text(item.label, px + colW / 2, py + rowH - 8 * scale);
    }
  }

  handleClick(mx, my) { return this.hoverItem; }
}