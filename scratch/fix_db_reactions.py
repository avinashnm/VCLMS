
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vclms.settings")
django.setup()

from main_app.models import ChemicalCatalog, ChemicalReaction

def fix_reactions():
    print("Fixing Chemical Reactions...")
    
    # 1. Get HCl and Mixture
    try:
        hcl = ChemicalCatalog.objects.get(name="Hydrochloric Acid (0.1N)")
        mixture = ChemicalCatalog.objects.get(name="Sodium Carbonate Mixture")
        pp = ChemicalCatalog.objects.get(name="Phenolphthalein")
        mo = ChemicalCatalog.objects.get(name="Methyl Orange")
    except ChemicalCatalog.DoesNotExist as e:
        print(f"Error: {e}")
        return

    # 2. Clear bad reactions
    ChemicalReaction.objects.all().delete()
    print("Cleared old reactions.")

    # 3. Add proper Titration reaction
    # Adding HCl to the mixture should lower the pH.
    # We want pH to go from 11.5 down to 4.0 over ~25mL.
    # Total change = 7.5. 
    # The formula in JS is: totalPHChange += rxn.ph_change * (Math.min(volA, volB) / 10);
    # If volA (Mixture) = 20mL, and we add 25mL HCl, min is 20.
    # 7.5 = ph_change * (20 / 10) => ph_change = 3.75.
    # Since we want it to decrease, ph_change should be -3.75.
    
    ChemicalReaction.objects.create(
        chemical_a=mixture,
        chemical_b=hcl,
        ph_change=-3.75,
        reaction_color_hex="#FFFFFF00" # Clear
    )
    print(f"Added reaction: {mixture.name} + {hcl.name} -> ph_change: -3.75")

    # 4. Ensure Indicators have correct transition data
    pp.low_ph_color = "#FFFFFF00" # Colorless
    pp.high_ph_color = "#FF1493A0" # Deep Pink
    pp.transition_ph_range = "8.2-10.0"
    pp.save()
    
    mo.low_ph_color = "#FF4500A0" # Orange-Red
    mo.high_ph_color = "#FFD700A0" # Yellow
    mo.transition_ph_range = "3.1-4.4"
    mo.save()
    print("Updated indicator colors and ranges.")

if __name__ == "__main__":
    fix_reactions()
