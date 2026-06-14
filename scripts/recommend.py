import sys
import os
import json
import pickle
import re
import argparse
import numpy as np
import pandas as pd
from pathlib import Path

ROOT = Path(r"D:\Projects\AI projects\CareerGPT")
DATA_DIR = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "src" / "ml" / "models"

# Helper functions for text cleaning
def clean_text(s):
    if not s:
        return ""
    return re.sub(r"\s+", " ", str(s).lower().strip())

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true", help="Run a test query")
    args = parser.parse_args()

    # Load Model Artifacts
    model_path = MODEL_DIR / "model.joblib"
    scaler_path = MODEL_DIR / "scaler.joblib"
    vectorizer_path = MODEL_DIR / "vectorizer.joblib"

    if not model_path.exists() or not scaler_path.exists() or not vectorizer_path.exists():
        sys.stderr.write("Error: Model artifacts not found. Please train the model first using: python scripts/train_recommendation_model.py\n")
        sys.exit(1)

    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(scaler_path, "rb") as f:
        scaler = pickle.load(f)
    with open(vectorizer_path, "rb") as f:
        tfidf = pickle.load(f)

    # Load Database Tables (JSONs)
    roles = json.loads((DATA_DIR / "roles.json").read_text(encoding="utf-8"))
    skills = json.loads((DATA_DIR / "skills.json").read_text(encoding="utf-8"))
    requirements = json.loads((DATA_DIR / "role-skill-requirements.json").read_text(encoding="utf-8"))

    # Maps for quick access
    role_map = {r["slug"]: r for r in roles}
    skill_map = {s["slug"]: s for s in skills}

    # Group requirements by role
    role_reqs = {}
    for req in requirements:
        role_slug = req["roleId"]
        role_reqs.setdefault(role_slug, []).append(req)

    # 1. Parse Input Profile
    if args.test:
        print("Running test query...")
        profile = {
            "fullName": "Test User",
            "educationLevel": "Undergraduate",
            "major": "Data Science",
            "interests": "Machine Learning, Analytics, Python development, predictive models",
            "preferredRoles": "Data Scientist, Data Analyst",
            "experienceLevel": "Intermediate",
            "currentSkills": {
                "python": 4,
                "sql": 3,
                "machine-learning": 3,
                "html": 2
            }
        }
    else:
        try:
            input_data = sys.stdin.read()
            if not input_data:
                sys.stderr.write("Error: No input data provided on stdin.\n")
                sys.exit(1)
            profile = json.loads(input_data)
        except Exception as e:
            sys.stderr.write(f"Error parsing profile JSON: {str(e)}\n")
            sys.exit(1)

    # 2. Extract Features for All Roles
    feature_rows = []
    role_candidates = []

    for role in roles:
        role_slug = role["slug"]
        reqs = role_reqs.get(role_slug, [])
        if not reqs:
            continue
            
        role_candidates.append(role)
        features = {}

        # A. Preferred Role vs Role Title Similarity
        pref_clean = clean_text(profile.get("preferredRoles", ""))
        title_clean = clean_text(role.get("title", ""))
        pref_words = set(pref_clean.split())
        title_words = set(title_clean.split())
        if pref_words:
            features["preferred_role_match"] = len(pref_words.intersection(title_words)) / len(pref_words)
        else:
            features["preferred_role_match"] = 0.0

        # B. Interests vs Description TF-IDF Cosine Similarity
        interests_vec = tfidf.transform([profile.get("interests", "")]).toarray()[0]
        role_vec = tfidf.transform([role.get("description", "")]).toarray()[0]
        norm_int = np.linalg.norm(interests_vec)
        norm_role = np.linalg.norm(role_vec)
        if norm_int > 0 and norm_role > 0:
            features["interests_description_similarity"] = np.dot(interests_vec, role_vec) / (norm_int * norm_role)
        else:
            features["interests_description_similarity"] = 0.0

        # C. Major vs Description TF-IDF Cosine Similarity
        major_vec = tfidf.transform([profile.get("major", "")]).toarray()[0]
        if norm_role > 0 and np.linalg.norm(major_vec) > 0:
            features["major_description_similarity"] = np.dot(major_vec, role_vec) / (np.linalg.norm(major_vec) * norm_role)
        else:
            features["major_description_similarity"] = 0.0

        # D. Skills Overlap & Gap Metrics
        req_skills = {r["skillId"]: r["importanceScore"] for r in reqs}
        user_skills = profile.get("currentSkills", {})
        
        # Normalize keys in currentSkills (just in case they are skill names or ids)
        # We assume standard is skill slug mapping
        user_skills_clean = {}
        for k, v in user_skills.items():
            user_skills_clean[k] = v

        if req_skills:
            overlap = [s for s in req_skills if user_skills_clean.get(s, 0) >= 3]
            features["skills_overlap_ratio"] = len(overlap) / len(req_skills)
            
            levels = [user_skills_clean.get(s, 0) for s in req_skills]
            features["skills_average_level"] = sum(levels) / len(req_skills)
            
            gap_sum = 0
            for s, importance in req_skills.items():
                level = user_skills_clean.get(s, 0)
                gap_sum += max(0, 3 - level) * importance
            features["skills_gap_score"] = -float(gap_sum)
        else:
            features["skills_overlap_ratio"] = 0.0
            features["skills_average_level"] = 0.0
            features["skills_gap_score"] = 0.0

        # E. Experience Match Score
        seniority = 0
        if any(k in title_clean for k in ["senior", "sr", "principal"]):
            seniority = 1
        elif any(k in title_clean for k in ["lead", "architect", "manager", "director", "head"]):
            seniority = 2
            
        exp_level = profile.get("experienceLevel", "Beginner").lower()
        user_exp = 0
        if "intermediate" in exp_level:
            user_exp = 1
        elif "advanced" in exp_level or "professional" in exp_level or "expert" in exp_level:
            user_exp = 2
            
        features["experience_match_score"] = float(2 - abs(seniority - user_exp))
        feature_rows.append(features)

    # 3. Model Scoring
    df_features = pd.DataFrame(feature_rows)
    X_scaled = scaler.transform(df_features)
    probabilities = model.predict_proba(X_scaled)[:, 1]

    # 4. Compile Rankings
    results = []
    for idx, role in enumerate(role_candidates):
        score = float(probabilities[idx])
        feats = feature_rows[idx]
        
        results.append({
            "id": role["id"],
            "slug": role["slug"],
            "title": role["title"],
            "description": role["description"],
            "matchScore": round(score * 100, 1),
            "metrics": {
                "skillsOverlapRatio": round(feats["skills_overlap_ratio"] * 100, 1),
                "skillsAverageLevel": round(feats["skills_average_level"], 2),
                "interestsSimilarity": round(feats["interests_description_similarity"] * 100, 1),
                "majorSimilarity": round(feats["major_description_similarity"] * 100, 1),
                "experienceMatch": round(feats["experience_match_score"] / 2 * 100, 1)
            }
        })

    # Sort by score descending
    results.sort(key=lambda x: x["matchScore"], reverse=True)
    top_recommendations = results[:5]

    # 5. Output
    if args.test:
        print("\nTOP RECOMMENDED ROLES:")
        print(json.dumps(top_recommendations, indent=2))
    else:
        print(json.dumps(top_recommendations))

if __name__ == "__main__":
    main()
