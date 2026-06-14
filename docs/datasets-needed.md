# Datasets Needed

## 1. Career recommendation dataset
- **Why**: anchors role discovery, explanations, and role similarity.
- **Where**: Kaggle/Open datasets, or normalize from O*NET + curated role catalog.
- **Format**: CSV or JSON.
- **Target tables**: `CareerRole`.
- **Cleaning**: remove duplicates, standardize role names, map seniority, normalize skills.
- **Manual work**: download one clean CSV or use the seeded replaceable dataset first.

## 2. IT role vs skills dataset
- **Why**: powers role-skill requirements and gap analysis.
- **Where**: O*NET, public career datasets, curated engineering role matrices.
- **Format**: CSV.
- **Target tables**: `CareerRole`, `RoleSkillRequirement`.
- **Cleaning**: unify skill labels, assign importance and proficiency weights.
- **Manual work**: download and place under `data/raw/roles/`.

## 3. Broad skill taxonomy
- **Why**: drives skill normalization and matching.
- **Where**: ESCO skills taxonomy, O*NET skills, curated seed taxonomy.
- **Format**: JSON or CSV.
- **Target tables**: `Skill`.
- **Cleaning**: merge synonyms, mark category/domain, trim noisy duplicates.
- **Manual work**: optional at MVP; seeded taxonomy is acceptable.

## 4. Curated certifications list
- **Why**: certification recommendations and roadmap milestones.
- **Where**: vendor certification pages, curated public lists.
- **Format**: JSON.
- **Target tables**: `Certification`.
- **Cleaning**: map cert to target role and skill coverage.
- **Manual work**: verify pricing/status separately; do not ingest paid data automatically.

## 5. Curated project ideas by skill/domain
- **Why**: project recommendations and portfolio planning.
- **Where**: curated internal seed dataset, public GitHub-style project lists.
- **Format**: JSON.
- **Target tables**: future extension only.
- **Cleaning**: normalize difficulty, effort, role fit.
- **Manual work**: none required for MVP.

## 6. Curated learning resources by skill/domain
- **Why**: learning path, roadmap steps, and study guidance.
- **Where**: free docs, official tutorials, MOOCs with free audit.
- **Format**: JSON.
- **Target tables**: future extension only.
- **Cleaning**: dedupe, mark free vs paid, validate links.
- **Manual work**: spot-check broken links periodically.
