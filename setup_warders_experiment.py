import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vclms.settings")
django.setup()

from main_app.models import (
    LabExperiment, ExperimentMilestone, MilestoneRule, 
    ObservationPrompt, CalculationPrompt, ExperimentTargetConfig,
    ChemicalCatalog
)
import json

def setup_warders_method():
    print("Setting up Estimation of Carbonates (Warder's Method) Template...")

    # 1. Create or get the LabExperiment
    experiment, created = LabExperiment.objects.get_or_create(
        slug="warders-method-carbonates",
        defaults={
            "title": "Estimation of Carbonates (Warder's Method)",
            "objective": "To estimate the amount of Sodium Carbonate and Sodium Bicarbonate in a given mixture continuous double titration.",
            "principle": "Warder's method utilizes two indicators—Phenolphthalein and Methyl Orange—to sequentially neutralize Na2CO3 to NaHCO3, and then all NaHCO3 to NaCl+H2O+CO2.",
            "type": "double_indicator",
            "initial_state_json": []
        }
    )

    if not created:
        print("Experiment already exists! Wiping old milestones to inject fresh template...")
        experiment.milestones.all().delete()
        if hasattr(experiment, 'target_config'):
            experiment.target_config.delete()

    # Create Target Config
    ExperimentTargetConfig.objects.create(
        experiment=experiment,
        v1_min=9.5, v1_max=11.5, v1_color="#FF69B4A0",
        v2_min=23.0, v2_max=27.0, v2_color="#FFA500A0"
    )

    # Helper function to create milestone
    def add_milestone(m_id, desc, instruction, points):
        return ExperimentMilestone.objects.create(
            experiment=experiment,
            milestone_id=m_id,
            description=desc,
            instruction=instruction,
            points=points
        )

    # ---------------------------------------------------------
    # Milestone 1: Fill Burette
    # ---------------------------------------------------------
    m1 = add_milestone(
        "fill_burette", 
        "Fill the Burette with HCl",
        "Spawn the Burette, Funnel, and Hydrochloric Acid (0.1N). Drag the Acid bottle over the burette and pour until the meniscus is near or above 0.00 mL.",
        5
    )
    # STRICT CHEMICAL CHECK: Must be HCl, not just any liquid!
    MilestoneRule.objects.create(
        milestone=m1, target_vessel="burette", 
        target_property="Hydrochloric Acid (0.1N)", operator=">=", value=45.0
    )

    # ---------------------------------------------------------
    # Milestone 1.5: Zero the Burette
    # ---------------------------------------------------------
    m1_5 = add_milestone(
        "zero_burette",
        "Zero the Burette",
        "Adjust the stopcock (Press and Hold 'S') to drain excess acid until the reading is exactly 0.00 mL.",
        5
    )
    MilestoneRule.objects.create(
        milestone=m1_5, target_vessel="burette",
        target_property="reading", operator="<=", value=0.05
    )

    # ---------------------------------------------------------
    # Milestone 2: Pipette Mixture
    # ---------------------------------------------------------
    m2 = add_milestone(
        "pipette_mixture", 
        "Pipette the Analyte Mixture",
        "Pipette exactly 20.0 mL of the Sodium Carbonate Mixture into the conical flask.",
        10
    )
    MilestoneRule.objects.create(
        milestone=m2, target_vessel="conical_flask", 
        target_property="Sodium Carbonate Mixture", operator="==", value=20.0
    )

    # ---------------------------------------------------------
    # Milestone 3: Add Phenolphthalein
    # ---------------------------------------------------------
    m3 = add_milestone(
        "add_pp", 
        "Add Phenolphthalein Indicator",
        "Add 1-2 drops of Phenolphthalein indicator to the flask. The solution will turn pink.",
        10
    )
    MilestoneRule.objects.create(
        milestone=m3, target_vessel="conical_flask", 
        target_property="Phenolphthalein", operator=">=", value=1.0
    )

    # ---------------------------------------------------------
    # Milestone 4: Titrate to V1 (Half-Neutralization)
    # ---------------------------------------------------------
    m4 = add_milestone(
        "reach_v1", 
        "Titrate to 1st Endpoint (V1)",
        "Titrate until the pink color just disappears (pH 8.3). Record the reading as V1.",
        20
    )
    MilestoneRule.objects.create(
        milestone=m4, target_vessel="conical_flask", 
        target_property="pH", operator="<=", value=8.3
    )
    ObservationPrompt.objects.create(
        milestone=m4, title="V1",
        description="Reading 1 (V1) in mL:",
        target_vessel="burette", target_property="reading", tolerance=0.2, penalty_points=10
    )

    # ---------------------------------------------------------
    # Milestone 5: Add Methyl Orange
    # ---------------------------------------------------------
    m5 = add_milestone(
        "add_mo", 
        "Add Methyl Orange Indicator",
        "Add 1-2 drops of Methyl Orange to the same flask. The solution will turn yellow.",
        10
    )
    MilestoneRule.objects.create(
        milestone=m5, target_vessel="conical_flask", 
        target_property="Methyl Orange", operator=">=", value=1.0
    )

    # ---------------------------------------------------------
    # Milestone 6: Titrate to V2 (Complete Neutralization)
    # ---------------------------------------------------------
    m6 = add_milestone(
        "reach_v2", 
        "Titrate to 2nd Endpoint (V2)",
        "Continue titration until the solution turns pale pink/orange (pH 4.0). Record total volume as V2.",
        20
    )
    MilestoneRule.objects.create(
        milestone=m6, target_vessel="conical_flask", 
        target_property="pH", operator="<=", value=4.0
    )
    ObservationPrompt.objects.create(
        milestone=m6, title="V2",
        description="Total Reading (V2) in mL:",
        target_vessel="burette", target_property="reading", tolerance=0.2, penalty_points=10
    )

    # ---------------------------------------------------------
    # Milestone 7: Calculations
    # ---------------------------------------------------------
    m7 = add_milestone(
        "calculations", 
        "Final Mass Calculations",
        "Calculate the mass of Sodium Carbonate and Sodium Bicarbonate in the sample.",
        20
    )
    CalculationPrompt.objects.create(
        milestone=m7, title="Na2CO3 Mass",
        description="Mass of Na2CO3 (g):",
        formula="V1 * 2 * 0.053 * 50",
        tolerance=0.05, points=10
    )
    CalculationPrompt.objects.create(
        milestone=m7, title="NaHCO3 Mass",
        description="Mass of NaHCO3 (g):",
        formula="(V2 - (2 * V1)) * 0.084 * 50",
        tolerance=0.05, points=10
    )


    print("Success! Warder's Method Template injected cleanly into the database.")
    print("You can view and assign this experiment via the Admin panel.")

if __name__ == "__main__":
    setup_warders_method()
