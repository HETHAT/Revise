import json
import os
from pathlib import Path

# Mapping from original specific topic to generalised topic
TOPIC_MAPPING = {
    # Systèmes experts
    "Architecture d'un système expert": "Systèmes experts",
    "Base de connaissances": "Systèmes experts",
    "Base de faits": "Systèmes experts",
    "Moteur d'inférence": "Systèmes experts",
    "Chaînage avant": "Systèmes experts",
    "Chaînage arrière": "Systèmes experts",
    "Comparaison des stratégies de raisonnement": "Systèmes experts",
    "Comportement d'exécution / Retour arrière": "Systèmes experts",
    "Définition d'un système expert": "Systèmes experts",
    "Paradoxe de l'expertise": "Systèmes experts",
    "Perte de l'expertise humaine": "Systèmes experts",
    "Problème de la connaissance experte": "Systèmes experts",
    "Justification du développement": "Systèmes experts",
    "Possibilité de développement": "Systèmes experts",
    "Étapes de construction": "Systèmes experts",
    "Stratégies de validation": "Systèmes experts",
    "Méthodes d'acquisition": "Systèmes experts",
    "Définition des domaines": "Systèmes experts",
    "Application du chaînage": "Systèmes experts",
    "Traces d’exécution": "Systèmes experts",
    "Débogage": "Systèmes experts",
    "raisonnement par règles / débogage": "Systèmes experts",
    "système de diagnostic médical / raisonnement par règles": "Systèmes experts",
    "système de diagnostic médical / recherche de solution": "Systèmes experts",
    "système de diagnostic médical / représentation d’états": "Systèmes experts",

    # Logique et raisonnement
    "Connecteurs logiques / Tables de vérité": "Logique et raisonnement",
    "Contraintes logiques et négation": "Logique et raisonnement",
    "La négation": "Logique et raisonnement",
    "Lois de De Morgan": "Logique et raisonnement",
    "Équivalences logiques": "Logique et raisonnement",
    "Formes normales": "Logique et raisonnement",
    "Manipulation de formules / Prolog": "Logique et raisonnement",
    "Transformations logiques": "Logique et raisonnement",
    "Validité et satisfiabilité": "Logique et raisonnement",
    "Règles d'inférence": "Logique et raisonnement",
    "Règles d'inférence / Modus Tollens": "Logique et raisonnement",
    "Quantificateurs et portée": "Logique et raisonnement",
    "Propriétés des quantificateurs": "Logique et raisonnement",
    "Négation des quantificateurs": "Logique et raisonnement",
    "Arithmétique et Unification": "Logique et raisonnement",
    "Unification / Résolution": "Logique et raisonnement",
    "Comparaison de termes": "Logique et raisonnement",
    "Logique des relations familiales": "Logique et raisonnement",
    "Logique d’entraînement": "Logique et raisonnement",
    "Raisonnement logique": "Logique et raisonnement",
    "Raisonnement et contre-exemples": "Logique et raisonnement",
    "Raisonnement sur les résultats": "Logique et raisonnement",
    "Traduction du langage naturel": "Logique et raisonnement",
    "Traduction du langage naturel / Égalité": "Logique et raisonnement",
    "Traduction en logique des prédicats": "Logique et raisonnement",

    # Programmation Prolog
    "Prédicat cut (!)": "Programmation Prolog",
    "Récursion": "Programmation Prolog",
    "Tour de Hanoï": "Programmation Prolog",
    "Tour de Hanoï / récursion": "Programmation Prolog",
    "Listes": "Programmation Prolog",
    "Variables": "Programmation Prolog",
    "Écriture de règles Prolog": "Programmation Prolog",
    "débogage / récursion": "Programmation Prolog",
    "récursion": "Programmation Prolog",
    "Programmation déclarative": "Programmation Prolog",
    "Faits et règles": "Programmation Prolog",

    # Apprentissage automatique
    "Apprentissage": "Apprentissage automatique",
    "Apprentissage / Interprétation des sorties": "Apprentissage automatique",
    "Bases des ANN": "Apprentissage automatique",
    "Descente de gradient": "Apprentissage automatique",
    "Descente de gradient / Apprentissage": "Apprentissage automatique",
    "Fonction de coût": "Apprentissage automatique",
    "Fonctions d’activation": "Apprentissage automatique",
    "Modèle et paramètres": "Apprentissage automatique",
    "Pipeline d’apprentissage": "Apprentissage automatique",
    "Rétropropagation": "Apprentissage automatique",
    "Jeux de données (DataSet)": "Apprentissage automatique",
    "Algorithme de minimisation": "Apprentissage automatique",

    # Fondements de l’IA
    "Bases scientifiques de l’IA": "Fondements de l’IA",
    "Définition de l’IA": "Fondements de l’IA",
    "IA vs Informatique classique": "Fondements de l’IA",
    "Test de Turing": "Fondements de l’IA",
    "Notions fondamentales": "Fondements de l’IA",
    "Motivations principales": "Fondements de l’IA",

    # Applications par domaine
    "Agronomie": "Applications par domaine",
    "Chimie": "Applications par domaine",
    "Géologie": "Applications par domaine",
    "Médecine": "Applications par domaine",
    "Médecine / Comparaison": "Applications par domaine",
    "Informatique": "Applications par domaine",
    "Mathématiques": "Applications par domaine",
    "Gestion": "Applications par domaine",
    "Simulation / Sciences sociales": "Applications par domaine",
    "Électronique / Télécoms": "Applications par domaine",

    # Raisonnement et recherche
    "Raisonnement": "Raisonnement et recherche",
    "Recherche de chemin entre villes": "Raisonnement et recherche",
    "Sélection de repas au restaurant": "Raisonnement et recherche",
    "coloriage de carte": "Raisonnement et recherche",
    "Environnements hostiles": "Raisonnement et recherche",
}

def process_json_files(input_dir: str, output_dir: str):
    """
    Reads all JSON files from input_dir (except metadata.json),
    replaces the 'topic' field using TOPIC_MAPPING,
    and writes the updated JSON to output_dir (preserving directory structure).
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)

    if not input_path.exists():
        print(f"Input directory {input_dir} does not exist.")
        return

    # Create output directory if it doesn't exist
    output_path.mkdir(parents=True, exist_ok=True)

    # Walk through all files
    for file_path in input_path.glob("**/*.json"):
        if file_path.name == "metadata.json":
            print(f"Skipping {file_path} (metadata.json)")
            continue

        # Compute relative path to preserve subdirectories
        rel_path = file_path.relative_to(input_path)
        out_file = output_path / rel_path
        out_file.parent.mkdir(parents=True, exist_ok=True)

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            continue

        # Process each item in the "items" list
        if "items" in data and isinstance(data["items"], list):
            for item in data["items"]:
                old_topic = item.get("topic", "")
                if old_topic in TOPIC_MAPPING:
                    item["topic"] = TOPIC_MAPPING[old_topic]
                else:
                    # Optionally warn if a topic is not mapped
                    print(f"Warning: topic '{old_topic}' not found in mapping (file {file_path})")

        # Write the updated data
        try:
            with open(out_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Processed and saved: {out_file}")
        except Exception as e:
            print(f"Error writing {out_file}: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python generalize_topics.py <input_directory> <output_directory>")
        sys.exit(1)

    input_dir = sys.argv[1]
    output_dir = sys.argv[2]
    process_json_files(input_dir, output_dir)