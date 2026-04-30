import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vclms.settings")
django.setup()

from main_app.models import ApparatusCatalog, ChemicalCatalog

def populate_apparatus():
    apparatuses = [
        {"name": "Beaker", "type": "beaker", "max_capacity": 250.0, "is_heatable": True, "can_measure_vol": True, "can_pour": True},
        {"name": "Pipette", "type": "pipette", "max_capacity": 20.0, "is_heatable": False, "can_measure_vol": True, "can_pour": True},
        {"name": "Vol. Flask", "type": "volumetric_flask", "max_capacity": 250.0, "is_heatable": False, "can_measure_vol": True, "can_pour": False},
        {"name": "Burette Tube", "type": "burette_tube", "max_capacity": 50.0, "is_heatable": False, "can_measure_vol": True, "can_pour": True},
        {"name": "Common Stand", "type": "common_stand", "max_capacity": 0.0, "is_heatable": False, "can_measure_vol": False, "can_pour": False},
        {"name": "Conical Flask", "type": "conical_flask", "max_capacity": 250.0, "is_heatable": True, "can_measure_vol": True, "can_pour": True},
        {"name": "Classic Burette", "type": "burette", "max_capacity": 50.0, "is_heatable": False, "can_measure_vol": True, "can_pour": True},
        {"name": "Hotplate", "type": "hotplate", "max_capacity": 0.0, "is_heatable": True, "can_measure_vol": False, "can_pour": False},
        {"name": "Bunsen Burner", "type": "bunsen_burner", "max_capacity": 0.0, "is_heatable": True, "can_measure_vol": False, "can_pour": False},
        {"name": "Condenser", "type": "liebig_condensor", "max_capacity": 0.0, "is_heatable": True, "can_measure_vol": False, "can_pour": False},
        {"name": "Sep. Funnel", "type": "separatory_funnel", "max_capacity": 250.0, "is_heatable": False, "can_measure_vol": True, "can_pour": True},
        {"name": "Filter Funnel", "type": "funnel", "max_capacity": 0.0, "is_heatable": False, "can_measure_vol": False, "can_pour": True},
        {"name": "Crucible", "type": "crucible", "max_capacity": 50.0, "is_heatable": True, "can_measure_vol": False, "can_pour": True},
        {"name": "pH Meter", "type": "pH_meter", "max_capacity": 0.0, "is_heatable": False, "can_measure_vol": False, "can_pour": False},
        {"name": "Analytical Balance", "type": "balance", "max_capacity": 0.0, "is_heatable": False, "can_measure_vol": False, "can_pour": False},
        {"name": "M.P. Apparatus", "type": "meltingpoint_apparatus", "max_capacity": 0.0, "is_heatable": True, "can_measure_vol": False, "can_pour": False},
        {"name": "TLC Plate", "type": "TLC_plate", "max_capacity": 0.0, "is_heatable": False, "can_measure_vol": False, "can_pour": False},
        {"name": "Reagent Bottle", "type": "bottle", "max_capacity": 250.0, "is_heatable": False, "can_measure_vol": False, "can_pour": True},
        {"name": "Wash Bottle", "type": "wash_bottle", "max_capacity": 250.0, "is_heatable": False, "can_measure_vol": False, "can_pour": True},
    ]

    for app in apparatuses:
        obj, created = ApparatusCatalog.objects.get_or_create(
            name=app['name'],
            type=app['type'],
            defaults={
                'max_capacity': app['max_capacity'],
                'is_heatable': app['is_heatable'],
                'can_measure_vol': app['can_measure_vol'],
                'can_pour': app['can_pour'],
                'svg_sprite_url': f"/static/assets/{app['type']}.svg"
            }
        )
        if created:
            print(f"Added {app['name']}")

def populate_chemicals():
    chemicals = [
        {"name": "Hydrochloric Acid (0.1N)", "formula": "HCl", "molarity": 0.1, "density": 1.0, "default_color_hex": "#FFFFFF40", "is_indicator": False},
        {"name": "Sodium Carbonate Mixture", "formula": "Na2CO3+NaHCO3", "molarity": 0.1, "density": 1.0, "default_color_hex": "#FFFFFF40", "is_indicator": False},
        {"name": "Phenolphthalein", "formula": "C20H14O4", "molarity": 0.0, "density": 1.0, "default_color_hex": "#FAFAFA80", "is_indicator": True, "low_ph_color": "#FFFFFF00", "high_ph_color": "#FF1493A0"},
        {"name": "Methyl Orange", "formula": "MO", "molarity": 0.0, "density": 1.0, "default_color_hex": "#FFA50080", "is_indicator": True, "low_ph_color": "#FF0000A0", "high_ph_color": "#FFD700A0"},
    ]

    for chem in chemicals:
        obj, created = ChemicalCatalog.objects.get_or_create(
            name=chem['name'],
            defaults={
                'formula': chem['formula'],
                'molarity': chem['molarity'],
                'density': chem['density'],
                'default_color_hex': chem['default_color_hex'],
                'is_indicator': chem['is_indicator'],
                'low_ph_color': chem.get('low_ph_color', '#FFFF00A0'),
                'high_ph_color': chem.get('high_ph_color', '#FF00FFA0')
            }
        )
        if created:
            print(f"Added {chem['name']}")

if __name__ == '__main__':
    print("Populating...")
    populate_apparatus()
    populate_chemicals()
    print("Database populated successfully!")
