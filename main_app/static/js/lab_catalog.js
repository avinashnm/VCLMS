// lab_catalog.js
class LabCatalog {
  constructor(config) {
    // config: { visible_apparatus: [...] }
    this.config = config || {};
    this.items = [];
    this.hoverItem = null;
    this.sprites = {};  // filled by initSprites()

    // catalogue panel placement
    this.panel = { x: 10, y: 200, w: 180, h: 260 };

    this._buildDefaultItems();
  }

  _buildDefaultItems() {
    // Global library of apparatus types
    const library = {
      beaker:  { id: 'beaker',  name: 'Beaker',         spriteKey: 'beaker',  spawnType: 'shelf' },
      pipette: { id: 'pipette', name: 'Pipette',        spriteKey: 'pipette', spawnType: 'shelf' },
      bottle:  { id: 'bottle',  name: 'Reagent Bottle', spriteKey: 'bottle',  spawnType: 'shelf' },
      burette: { id: 'burette', name: 'Burette Stand',  spriteKey: 'burette', spawnType: 'bench' },
      conical_flask:   { id: 'conical_flask',   name: 'Conical Flask',   spriteKey: 'conical_flask',   spawnType: 'shelf' },
      volumetric_flask:{ id: 'volumetric_flask',name: 'Volumetric Flask',spriteKey: 'volumetric_flask',spawnType: 'shelf' },
      funnel:          { id: 'funnel',          name: 'Funnel',          spriteKey: 'funnel',          spawnType: 'shelf' },
      wash_bottle:     { id: 'wash_bottle',     name: 'Wash Bottle',     spriteKey: 'wash_bottle',     spawnType: 'shelf' },
      bunsen_burner:   { id: 'bunsen_burner',   name: 'Bunsen Burner',   spriteKey: 'bunsen_burner',   spawnType: 'bench' }
    };

    const visible = this.config.visible_apparatus || ['beaker', 'pipette', 'bottle', 'burette'];
    this.items = visible
      .filter(key => library[key])
      .map(key => library[key]);
  }

  initSprites(spriteMap) {
    // spriteMap: { beaker: imgCatBeaker, pipette: imgCatPipette, ... }
    this.sprites = spriteMap || {};
  }

  drawPanel() {
    const { x, y, w, h } = this.panel;

    // background
    fill(255, 255, 255, 240);
    stroke(210);
    rect(x, y, w, h, 10);

    noStroke();
    fill(0);
    textAlign(LEFT);
    textSize(14);
    textStyle(BOLD);
    text('Apparatus Catalog', x + 12, y + 22);
    textStyle(NORMAL);
    textSize(12);
    text('Click to add to lab', x + 12, y + 40);

    this.hoverItem = null;

    let iconY = y + 70;
    const iconX = x + 40;

    this.items.forEach(item => {
      const over = mouseX > x + 5 && mouseX < x + w - 5 &&
                   mouseY > iconY - 25 && mouseY < iconY + 25;

      if (over) {
        fill(230);
        this.hoverItem = item;
      } else {
        fill(245);
      }

      stroke(210);
      rect(x + 10, iconY - 25, w - 20, 50, 8);

      // icon
      push();
      imageMode(CENTER);
      const sprite = this.sprites[item.spriteKey];
      if (sprite) {
        let iw = 30, ih = 40;
        if (item.id === 'pipette') { iw = 18; ih = 60; }
        if (item.id === 'burette') { iw = 20; ih = 70; }
        image(sprite, iconX, iconY, iw, ih);
      }
      pop();

      // label
      noStroke();
      fill(0);
      textAlign(LEFT);
      textSize(12);
      text(item.name, iconX + 20, iconY + 4);

      iconY += 60;
    });
  }

  handleClick(mx, my) {
    const { x, y, w, h } = this.panel;
    if (!this.hoverItem) return null;
    if (mx < x || mx > x + w || my < y || my > y + h) return null;
    return this.hoverItem;  // experiment decides how to spawn it
  }
}

