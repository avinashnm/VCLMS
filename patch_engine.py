import re

file_path = r"d:\4thsem\Final-Year-Project\VCLMS\main_app\static\js\lab_engine.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace makeVessel contents
content = re.sub(
    r"contents:\s*\{[^\}]*mixture_vol:.*?theoreticalV2:\s*25\.0\s*\}",
    """contents: {\n      chemicals: {},\n      isRinsed: false,\n      isContaminated: false,\n      pH: 7.0,\n      temperature: 25.0,\n      solidMass: 0\n    }""",
    content, flags=re.DOTALL
)

# 2. Replace spawnFromInitialState specific chemicals logic
spawn_replace = """      v.color = chemColor;
      v.volume = chemVol;
      v.targetVolume = chemVol;

      // For bottles, mark as chemical bottle
      if (type === 'bottle') {
        v.isChemical = true;
        v.title = chemName;
      }

      // Initialize dictionary
      v.contents.chemicals[chemName] = { volume: chemVol, color: chemColor };"""
content = re.sub(
    r"v\.color = chemColor;\s*v\.volume = chemVol;\s*v\.targetVolume = chemVol;\s*// For bottles[^\}]+?\}\s*// For conical flasks[^\}]+?\}\s*// For burettes[^\}]+?\}",
    spawn_replace,
    content, flags=re.DOTALL
)

# 3. Replace handleIndicatorDrops
indicator_replace = """function handleIndicatorDrops() {
  if (!isDragging || !mouseIsPressed) return;
  const flask = Object.values(vessels).find(v => (v.type === 'conical_flask' || v.type === 'beaker') && near(isDragging, v, 70));
  if (flask && isDragging.type === 'bottle') { // Any bottle can drop
    if (frameCount % 30 === 0) {
      transferLiquid(isDragging, flask, 0.05); // 1 drop = 0.05 mL
      createParticles(isDragging.x, isDragging.y + 30, 2, 'drip');
    }
  }
}"""
content = re.sub(
    r"function handleIndicatorDrops\(\)\s*\{.*?Indicator mixed into flask[^\}]+\}\s*\}",
    indicator_replace,
    content, flags=re.DOTALL
)

# 4. Replace handlePipetteInteraction
pipette_replace = """function handlePipetteInteraction() {
  if (!isDragging || isDragging.type !== 'pipette') return;
  const pipette = isDragging;
  
  const source = Object.values(vessels).find(v => 
    (v.type === 'bottle' || v.type === 'chemical_bottle' || v.type === 'beaker' || v.type === 'volumetric_flask') && v.targetVolume > 0.01 && near(pipette, v, 60));
    
  const receiver = Object.values(vessels).find(v => 
    (v.type === 'beaker' || v.type === 'conical_flask' || v.type === 'volumetric_flask') && near(pipette, v, 60));

  let rate = 0.5 * (deltaTime / 50);

  if (source && keyIsDown(SHIFT)) {
     transferLiquid(source, pipette, rate);
  }

  if (receiver && keyIsDown(SHIFT)) {
     if (pipette.targetVolume > 0.01 && receiver.targetVolume < receiver.capacity) {
        transferLiquid(pipette, receiver, rate);
        receiver.turbulence = min((receiver.turbulence || 0) + 0.5, 3);
        drawPouringStream(pipette.x, pipette.y + pipette.h / 2 - 5, receiver.x, receiver.y - 15, color(...(pipette.color || [255, 255, 255])), 2);
     }
  }
}"""
content = re.sub(
    r"function handlePipetteInteraction\(\)\s*\{.*?drawPouringStream.*?\}\s*\}\s*\}",
    pipette_replace,
    content, flags=re.DOTALL
)

# 5. Replace burette tracking in getBuretteDrainage (or inject it over the old one)
content = content.replace(
    "waste.contents.mixture_vol += amt;",
    "transferLiquid(b, waste, amt);"
)
content = content.replace(
    "b.contents.hcl_vol = max(0, b.contents.hcl_vol - amt);",
    ""
)

# 6. Get rid of getTitrationColor inside drawVessel
content = content.replace("color(...getTitrationColor(v))", "v.color ? color(...v.color) : color(200, 220, 255, 100)")


# Append Generic Liquid Engine Functions if not exists
universal_engine = """
// ======================================================
// GENERIC LIQUID TRANSFER & STOICHIOMETRY ENGINE
// ======================================================
function transferLiquid(source, target, transferVol) {
  if (transferVol <= 0 || source.targetVolume <= 0) return;
  if (target.targetVolume >= target.capacity) return; 

  let actualVol = min(transferVol, source.targetVolume, target.capacity - target.targetVolume);
  if (actualVol <= 0.001) return;

  let totalSourceVol = 0;
  for (let c in source.contents.chemicals) totalSourceVol += source.contents.chemicals[c].volume;

  // Initial State Fallback: if dictionary empty but has volume
  if (totalSourceVol <= 0.01 && source.chemicalId) {
    source.contents.chemicals[source.chemicalId] = { volume: source.targetVolume, color: source.color || [200, 220, 255] };
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
  
  // Mix visual identities
  if (!target.chemicalId) target.chemicalId = source.chemicalId || source.chem;
  
  computeReaction(target);
}

function computeReaction(vessel) {
  // PHASE 5.A: Pure volumetric color averaging based on dictionary contents
  // Overrides hardcoded titration colors
  let r=0, g=0, b=0, total=0;
  for (let c in vessel.contents.chemicals) {
    let chem = vessel.contents.chemicals[c];
    if (chem.volume > 0) {
      r += chem.color[0] * chem.volume;
      g += chem.color[1] * chem.volume;
      b += chem.color[2] * chem.volume;
      total += chem.volume;
    }
  }
  
  if (total > 0 && typeof CHEMICAL_REACTIONS !== 'undefined' && CHEMICAL_REACTIONS.length > 0) {
     // Active Stoichiometry Matrix checking
     // TODO: Implement ReactionCatalog cross-referencing for Phase 5.B
     vessel.color = [r/total, g/total, b/total, 180];
  } else if (total > 0) {
     vessel.color = [r/total, g/total, b/total, 180];
  }
}
"""

if "function transferLiquid(" not in content:
    content += universal_engine

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully.")
