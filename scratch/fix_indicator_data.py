import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vclms.settings')
django.setup()

from main_app.models import ChemicalCatalog

def fix_indicators():
    indicators = {
        "Phenolphthalein": {
            "low": "#FFFFFF00", # Colorless
            "high": "#FF1493A0", # Pink
            "range": "8.2-10.0"
        },
        "Methyl Orange": {
            "low": "#FF4500A0", # Orange-Red
            "high": "#FFD700A0", # Yellow
            "range": "3.1-4.4"
        },
        "Bromothymol Blue": {
            "low": "#FFFF00A0", # Yellow
            "high": "#0000FFA0", # Blue
            "range": "6.0-7.6"
        },
        "Methyl Red": {
            "low": "#FF0000A0", # Red
            "high": "#FFFF00A0", # Yellow
            "range": "4.4-6.2"
        }
    }

    for name, props in indicators.items():
        chem = ChemicalCatalog.objects.filter(name__icontains=name).first()
        if chem:
            print(f"Updating {chem.name}...")
            chem.is_indicator = True
            chem.low_ph_color = props["low"]
            chem.high_ph_color = props["high"]
            chem.transition_ph_range = props["range"]
            chem.save()
        else:
            print(f"Chemical {name} not found.")

if __name__ == "__main__":
    fix_indicators()
