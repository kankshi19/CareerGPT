import os
import json
import pickle
import random
import re
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report

ROOT = Path(r"D:\Projects\AI projects\CareerGPT")
DATA_DIR = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "src" / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Helper functions for text cleaning
def clean_text(s):
    if not s:
        return ""
    return re.sub(r"\s+", " ", str(s).lower().strip())

# 1. Load Processed Datasets
print("Loading processed datasets...")
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

# Major choices by keyword
MAJORS = {
    "data": ["Data Science", "Information Systems", "Statistics"],
    "analyst": ["Business Analytics", "Information Systems", "Data Science"],
    "security": ["Cybersecurity", "Computer Science", "Computer Engineering"],
    "network": ["Network Engineering", "Information Technology"],
    "cloud": ["Cloud Computing", "Computer Science", "Software Engineering"],
    "software": ["Computer Science", "Software Engineering", "Computer Engineering"],
    "developer": ["Computer Science", "Software Engineering"],
    "engineer": ["Computer Science", "Software Engineering", "Computer Engineering"]
}

def get_major_for_role(title):
    title_lower = title.lower()
    for kw, majors in MAJORS.items():
        if kw in title_lower:
            return random.choice(majors)
    return "Computer Science"

# 2. Synthetic Profile Generator
print("Generating synthetic student profiles...")
synthetic_profiles = []

for role in roles:
    role_slug = role["slug"]
    title = role["title"]
    description = role["description"]
    reqs = role_reqs.get(role_slug, [])
    
    # Skip roles with no skill requirements
    if not reqs:
        continue
        
    req_skills = [req["skillId"] for req in reqs]
    
    # Generate 3 positive profiles for this role
    for i in range(3):
        # Education and Major
        major = get_major_for_role(title)
        edu = random.choice(["Undergraduate", "Graduate", "Working professional"])
        exp = random.choice(["Beginner", "Intermediate", "Advanced"])
        
        # Preferred Roles includes target role title + variants
        pref_variants = [
            title,
            title.lower(),
            re.sub(r"(engineer|developer|analyst|administrator)", "", title, flags=re.I).strip()
        ]
        pref_roles = ", ".join(random.sample(pref_variants, k=random.randint(1, 2)))
        
        # Interests includes words from description + skill names
        desc_words = [w for w in re.findall(r"\w+", description.lower()) if len(w) > 4][:10]
        sk_names = [skill_map[s]["name"] for s in req_skills[:3] if s in skill_map]
        interests = ", ".join(random.sample(desc_words + sk_names, k=random.randint(3, 5)))
        
        # Skills: Positive profile has 60% to 95% of required skills at Level 3-5
        user_skills = {}
        num_pos = int(len(req_skills) * random.uniform(0.6, 0.95))
        pos_skills = random.sample(req_skills, k=max(1, min(num_pos, len(req_skills))))
        for s in pos_skills:
            user_skills[s] = random.randint(3, 5)
            
        # Add a few random irrelevant skills at low levels (1-3)
        irrelevant_candidates = list(set(skill_map.keys()) - set(req_skills))
        for s in random.sample(irrelevant_candidates, k=min(3, len(irrelevant_candidates))):
            user_skills[s] = random.randint(1, 3)
            
        synthetic_profiles.append({
            "target_role_slug": role_slug,
            "fullName": f"Student_{role_slug}_{i}",
            "educationLevel": edu,
            "major": major,
            "interests": interests,
            "preferredRoles": pref_roles,
            "experienceLevel": exp,
            "currentSkills": user_skills
        })

# 3. Fit TF-IDF Vectorizers
print("Fitting TF-IDF vectorizers on role descriptions...")
descriptions = [r["description"] for r in roles]
tfidf = TfidfVectorizer(max_features=500, stop_words="english")
tfidf.fit(descriptions)

# 4. Feature Extraction Pipeline
def extract_features(profile, role):
    features = {}
    
    # A. Preferred Role vs Role Title Similarity
    pref_clean = clean_text(profile["preferredRoles"])
    title_clean = clean_text(role["title"])
    # Simple word overlap
    pref_words = set(pref_clean.split())
    title_words = set(title_clean.split())
    if pref_words:
        features["preferred_role_match"] = len(pref_words.intersection(title_words)) / len(pref_words)
    else:
        features["preferred_role_match"] = 0.0
        
    # B. Interests vs Description TF-IDF Cosine Similarity
    interests_vec = tfidf.transform([profile["interests"]]).toarray()[0]
    role_vec = tfidf.transform([role["description"]]).toarray()[0]
    norm_int = np.linalg.norm(interests_vec)
    norm_role = np.linalg.norm(role_vec)
    if norm_int > 0 and norm_role > 0:
        features["interests_description_similarity"] = np.dot(interests_vec, role_vec) / (norm_int * norm_role)
    else:
        features["interests_description_similarity"] = 0.0
        
    # C. Major vs Description TF-IDF Cosine Similarity
    major_vec = tfidf.transform([profile["major"]]).toarray()[0]
    if norm_role > 0 and np.linalg.norm(major_vec) > 0:
        features["major_description_similarity"] = np.dot(major_vec, role_vec) / (np.linalg.norm(major_vec) * norm_role)
    else:
        features["major_description_similarity"] = 0.0
        
    # D. Skills Overlap & Gap Metrics
    reqs = role_reqs.get(role["slug"], [])
    req_skills = {r["skillId"]: r["importanceScore"] for r in reqs}
    
    if req_skills:
        user_skills = profile["currentSkills"]
        # Has skill with level >= 3
        overlap = [s for s in req_skills if user_skills.get(s, 0) >= 3]
        features["skills_overlap_ratio"] = len(overlap) / len(req_skills)
        
        # Average level on required skills
        levels = [user_skills.get(s, 0) for s in req_skills]
        features["skills_average_level"] = sum(levels) / len(req_skills)
        
        # Skill gaps score: sum of max(0, 3 - level) weighted by importance
        gap_sum = 0
        for s, importance in req_skills.items():
            level = user_skills.get(s, 0)
            gap_sum += max(0, 3 - level) * importance
        features["skills_gap_score"] = -float(gap_sum) # negative so higher is better
    else:
        features["skills_overlap_ratio"] = 0.0
        features["skills_average_level"] = 0.0
        features["skills_gap_score"] = 0.0
        
    # E. Experience Match Score
    # Check if target role title implies seniority
    seniority = 0 # 0=entry/mid, 1=senior, 2=lead/architect/manager
    if any(k in title_clean for k in ["senior", "sr", "principal"]):
        seniority = 1
    elif any(k in title_clean for k in ["lead", "architect", "manager", "director", "head"]):
        seniority = 2
        
    exp_level = profile["experienceLevel"].lower()
    user_exp = 0 # 0=beginner, 1=intermediate, 2=advanced/professional
    if "intermediate" in exp_level:
        user_exp = 1
    elif "advanced" in exp_level or "professional" in exp_level or "expert" in exp_level:
        user_exp = 2
        
    # match score: 2 - abs(seniority - user_exp)
    features["experience_match_score"] = float(2 - abs(seniority - user_exp))
    
    return features

# 5. Build Training dataset
print("Building dataset pairs...")
dataset_rows = []
for profile in synthetic_profiles:
    target_slug = profile["target_role_slug"]
    
    # Positive pair (label = 1)
    target_role = role_map[target_slug]
    feats = extract_features(profile, target_role)
    feats["label"] = 1
    dataset_rows.append(feats)
    
    # Negative pairs (label = 0): pair with 5 other random roles
    other_roles = [r for r in roles if r["slug"] != target_slug]
    neg_roles = random.sample(other_roles, k=min(5, len(other_roles)))
    for neg_role in neg_roles:
        feats = extract_features(profile, neg_role)
        feats["label"] = 0
        dataset_rows.append(feats)

df = pd.DataFrame(dataset_rows)
print(f"Dataset shape: {df.shape}")
print(f"Positive samples: {df[df['label'] == 1].shape[0]}")
print(f"Negative samples: {df[df['label'] == 0].shape[0]}")

# 6. Train/Test Split & Scaler Fit
X = df.drop(columns=["label"])
y = df["label"]

# Train-Test Split (simple shuffle split)
indices = np.arange(len(df))
np.random.seed(42)
np.random.shuffle(indices)
split_idx = int(len(df) * 0.8)
train_indices, test_indices = indices[:split_idx], indices[split_idx:]

X_train, X_test = X.iloc[train_indices], X.iloc[test_indices]
y_train, y_test = y.iloc[train_indices], y.iloc[test_indices]

# Scale features
scaler = MinMaxScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 7. Model Training
print("Training Random Forest Classifier...")
rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
rf.fit(X_train_scaled, y_train)

# Evaluation
y_pred = rf.predict(X_test_scaled)
y_prob = rf.predict_proba(X_test_scaled)[:, 1]

acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_prob)

print(f"Test Accuracy: {acc:.4f}")
print(f"Test ROC-AUC: {auc:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# 8. Save Serialized Artifacts
print("Saving artifacts to src/ml/models/...")
with open(MODEL_DIR / "model.joblib", "wb") as f:
    pickle.dump(rf, f)
with open(MODEL_DIR / "scaler.joblib", "wb") as f:
    pickle.dump(scaler, f)
with open(MODEL_DIR / "vectorizer.joblib", "wb") as f:
    pickle.dump(tfidf, f)

# Save metadata
metadata = {
    "train_accuracy": float(acc),
    "train_roc_auc": float(auc),
    "features": list(X.columns),
    "train_samples": len(df),
    "date": "2026-06-14"
}
(MODEL_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
print("Model artifacts saved successfully!")
