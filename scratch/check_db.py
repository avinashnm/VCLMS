
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vclms.settings")
django.setup()

from main_app.models import ChemicalCatalog, ChemicalReaction

print("Chemicals in Catalog:")
for c in ChemicalCatalog.objects.all():
    print(f"Name: {c.name}")
    print(f"  Is Indicator: {c.is_indicator}")
    print(f"  Low pH Color: {c.low_ph_color}")
    print(f"  High pH Color: {c.high_ph_color}")
    print(f"  Transition: {c.transition_ph_range}")
    print("-" * 20)

print("\nReactions in Catalog:")
for r in ChemicalReaction.objects.all():
    print(f"{r.chemical_a.name} + {r.chemical_b.name} -> pH Change: {r.ph_change}")
