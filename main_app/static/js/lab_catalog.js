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
    // ⭐ GENERIC FUNCTION-BASED GROUPS (works for ALL experiments)
    this.groups = {
      volumetric: [      // Volume measurement/transfer
        { id: 'beaker', name: 'Beaker', spriteKey: 'beaker' },
        { id: 'pipette', name: 'Pipette', spriteKey: 'pipette' },
        { id: 'volumetric_flask', name: 'Vol. Flask', spriteKey: 'volumetric_flask' }
      ],
      titration: [       // Precision titration apparatus
        { id: 'burette_tube', name: 'Burette Tube', spriteKey: 'burette_tube' },
        { id: 'common_stand', name: 'Common Stand', spriteKey: 'common_stand' },
        { id: 'conical_flask', name: 'Conical Flask', spriteKey: 'conical_flask' }
      ],
      heating: [         // All heating/reflux/distillation
        { id: 'hotplate', name: 'Hotplate', spriteKey: 'hotplate' },
        { id: 'bunsen_burner', name: 'Bunsen Burner', spriteKey: 'bunsen_burner' },
        { id: 'liebig_condensor', name: 'Condenser', spriteKey: 'liebig_condensor' }
      ],
      separation: [      // Filtration/extraction
        { id: 'separatory_funnel', name: 'Sep. Funnel', spriteKey: 'separatory_funnel' },
        { id: 'funnel', name: 'Filter Funnel', spriteKey: 'funnel' },
        { id: 'crucible', name: 'Crucible', spriteKey: 'crucible' }
      ],
      analytical: [      // Measurement instruments
        { id: 'pH_meter', name: 'pH Meter', spriteKey: 'pH_meter' },
        { id: 'balance', name: 'Analytical Balance', spriteKey: 'balance' },
        { id: 'meltingpoint_apparatus', name: 'M.P. Apparatus', spriteKey: 'meltingpoint_apparatus' },
        { id: 'TLC_plate', name: 'TLC Plate', spriteKey: 'TLC_plate' }
      ],
      utility: [         // Reagents + cleaning
        { id: 'bottle', name: 'Reagent Bottle', spriteKey: 'bottle' },
        { id: 'wash_bottle', name: 'Wash Bottle', spriteKey: 'wash_bottle' }
      ]
    };
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
    text('🧴 CHEMICALS', x + 12, y + 25);
    textStyle(NORMAL); textSize(11 * scale);
    text('Click to spawn bottle', x + 12, y + 42);

    const colW = 140 * scale, rowH = 110 * scale, margin = 15 * scale;
    this.hoverItem = null;

    for (let i = 0; i < this.chemicals.length; i++) {
      const item = this.chemicals[i];
      const col = i % 2, row = Math.floor(i / 2);
      const px = x + 15 + col * (colW + margin);
      const py = y + 65 + row * (rowH + 10);

      const over = mouseX > px && mouseX < px + colW &&
        mouseY > py && mouseY < py + rowH;

      // Hover effect
      if (over) {
        fill(255, 200, 200, 220); stroke(255, 100, 100); strokeWeight(2 * scale);
        this.hoverItem = item;
      } else {
        fill(255, 240, 240, 200); stroke(200); strokeWeight(1 * scale);
      }
      rect(px, py, colW, rowH, 12);

      // Chemical color preview (bottle shape)
      fill(...item.color, 200); noStroke();
      rect(px + 20, py + 30, colW - 40, 55, 25, 5, 25, 5);
      fill(...item.color, 180);
      rect(px + 25, py + 45, colW - 50, 35, 20);

      // Label
      fill(50); textAlign(CENTER); textSize(11 * scale);
      text(item.label, px + colW / 2, py + 95);
    }
  }

  handleClick(mx, my) { return this.hoverItem; }
}