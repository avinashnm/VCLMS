"""
Seed script: Populates the LabExperiment 'double-indicator' with proper
milestones, detectable rules, and an ExperimentTargetConfig so the
Lab Assistant correctly assesses the Double Indicator Titration.

Run with:  venv\Scripts\python seed_double_indicator.py
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vclms.settings")
django.setup()

from main_app.models import LabExperiment, ExperimentMilestone, ExperimentTargetConfig, MilestoneRule

# ── 1. Create or update the LabExperiment ──────────────────────────────────────
exp, created = LabExperiment.objects.get_or_create(
    slug="double-indicator",
    defaults={
        "title": "Estimation of Na\u2082CO\u2083 and NaHCO\u2083 in a Mixture",
        "objective": (
            "To estimate the amount of sodium carbonate and sodium bicarbonate "
            "in a given mixture using the double indicator method."
        ),
        "principle": (
            "Sodium carbonate reacts with hydrochloric acid in two stages. "
            "With phenolphthalein as indicator, only Na\u2082CO\u2083 reacts (V1). "
            "With methyl orange, the remaining NaHCO\u2083 also reacts (V2 \u2212 2V1). "
            "The two endpoint volumes allow calculation of each component."
        ),
        "type": "double_indicator",
    }
)
if not created:
    # Keep existing record, just update attributes we care about
    exp.type = "double_indicator"
    exp.save()

print(f"{'Created' if created else 'Found existing'} experiment: {exp.title}")

# ── 2. Wipe existing milestones (re-seed cleanly) ─────────────────────────────
exp.milestones.all().delete()
print("Cleared existing milestones.")

# ── 3. Define milestones with rules ───────────────────────────────────────────
#  Format: (milestone_id, description, points, [(target_vessel, target_property, operator, value), ...])
#
#  How the JS engine reads rules:
#   target_property "capacity"   → how much liquid IS inside the vessel
#   target_property "reading"    → burette glass-reading (abs(capacity - targetVolume))
#   target_property "<chem_key>" → how much of that specific chemical is inside
#   operator "CONTAINS"         → propValue > 0 (anything at all)
#
MILESTONES = [
    (
        "fill_burette",
        "Fill burette with HCl",
        10,
        [
            # Burette must contain at least 40 mL (80% of 50 mL max)
            ("burette", "capacity", ">=", 40.0),
        ]
    ),
    (
        "zero_burette",
        "Adjust to 0.00 mL mark",
        10,
        [
            # Burette reading must be within ±0.5 mL of zero (reading ≤ 0.5)
            ("burette", "reading", "<=", 0.5),
        ]
    ),
    (
        "pipette_mixture",
        "Pipette 20 mL of analyte into flask",
        10,
        [
            # Conical flask must have at least 18 mL (20 mL with tolerance)
            ("conical_flask", "capacity", ">=", 18.0),
        ]
    ),
    (
        "add_pp",
        "Add Phenolphthalein Indicator",
        5,
        [
            # Conical flask contents must contain some Phenolphthalein indicator
            ("conical_flask", "Phenolphthalein", "CONTAINS", 0),
        ]
    ),
    (
        # Triggered manually when the student clicks "ENTER V1 READING" button
        "reach_v1",
        "Enter V1 Observation (Phenolphthalein endpoint)",
        15,
        []   # No auto-rules — triggered by the manual V1 input button
    ),
    (
        "add_mo",
        "Add Methyl Orange Indicator",
        5,
        [
            # Conical flask contents must contain some Methyl Orange indicator
            ("conical_flask", "Methyl Orange", "CONTAINS", 0),
        ]
    ),
    (
        # Triggered manually when the student clicks "ENTER V2 READING" button
        "reach_v2",
        "Enter V2 Observation (Methyl Orange endpoint)",
        20,
        []   # No auto-rules — triggered by the manual V2 input button
    ),
    (
        # Triggered manually when student submits final mass calculations
        "submit_calc",
        "Submit Final Calculations",
        25,
        []   # No auto-rules — triggered by the final calculation modal
    ),
]

for (m_id, desc, pts, rules) in MILESTONES:
    ms = ExperimentMilestone.objects.create(
        experiment=exp,
        milestone_id=m_id,
        description=desc,
        points=pts
    )
    for (vessel, prop, op, val) in rules:
        MilestoneRule.objects.create(
            milestone=ms,
            target_vessel=vessel,
            target_property=prop,
            operator=op,
            value=val
        )
    rule_count = len(rules)
    print(f"  ✓ Milestone '{m_id}' ({pts} pts) with {rule_count} rule(s)")

# ── 4. Set or update the TargetConfig ─────────────────────────────────────────
cfg, _ = ExperimentTargetConfig.objects.get_or_create(
    experiment=exp,
    defaults={"v1_min": 9.5, "v1_max": 11.5, "v2_min": 23.0, "v2_max": 27.0}
)
# Always update to correct values
cfg.v1_min = 9.5
cfg.v1_max = 11.5
cfg.v2_min = 23.0
cfg.v2_max = 27.0
cfg.save()
print(f"\n✓ TargetConfig: V1 ∈ [{cfg.v1_min}, {cfg.v1_max}], V2 ∈ [{cfg.v2_min}, {cfg.v2_max}]")

print("\n✅ Done! Double Indicator experiment is now fully seeded in the database.")
print(f"   Total milestones: {exp.milestones.count()}")
print(f"   Total rules: {MilestoneRule.objects.filter(milestone__experiment=exp).count()}")
