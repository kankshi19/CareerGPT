# Dataset Audit

This document details the audit of the available raw datasets in CareerGPT, their row counts, column meanings, data quality issues, and preprocessing actions required.

## 1. Job Roles & Skills Dataset
* **File Path**: `data/raw/IT_Job_Roles_Skills.csv`
* **Format**: CSV, encoded in `cp1252` (Windows-1252)
* **Row Count**: 493 rows
* **Columns**:
  - `Job Title`: Name of the IT career role.
  - `Job Description`: Paragraph describing responsibilities, context, and focus.
  - `Skills`: Comma-separated list of key professional and technical skills.
  - `Certifications`: Comma-separated list of certifications relevant to the role.

### Quality Issues
* Contains special characters/replacement tokens (e.g. `â€“` and `Â`) in text fields due to cp1252 encoding.
* Multiple comma-separated skills in a single field that require normalization.
* Certifications are sometimes missing or contain non-standard abbreviations.

---

## 2. Technology Skills Dataset
* **File Path**: `data/raw/Technology Skills.xlsx`
* **Format**: Excel Sheet
* **Row Count**: 27,858 rows
* **Columns**:
  - `onetSocCode`: O*NET occupational code (e.g., `15-1252.00` for Software Developers).
  - `title`: Standardized O*NET role title.
  - `example`: Specific technology or software tool name (e.g. `Docker`, `Python`, `JIRA`).
  - `commodityCode`: Classification code for the tool.
  - `commodityTitle`: Class category of the technology.
  - `hot`: Whether this technology is flagged as a "Hot Technology" (`Y`/`N`) in the market.

### Quality Issues
* Extremely high redundancy: The same role title is repeated thousands of times with different technology examples.
* No direct unique identifier linking to `IT_Job_Roles_Skills.csv`, requiring fuzzy/normalized matching based on string similarity of titles.
* Contains many outdated technology names or duplicate tools.

---

## 3. Dataset Preprocessing & Cleaning Pipeline
To transform raw data into a clean relational seed, the `process_datasets.py` script performs:
1. **Unicode Cleaning**: Normalizes strings, resolves encoding artifacts (`â€“` -> `-`), and trims whitespace.
2. **Slugification**: Standardizes role, skill, technology, and certification names into lowercase alphanumeric hyphenated slugs for database keys.
3. **Item Splitting**: Expands comma-separated `Skills` and `Certifications` into individual entity records.
4. **Title Alignment Engine**: Matches O*NET technology roles to CSV job roles using an iterative cascade matcher:
   - **Exact Match**: Direct string equality.
   - **Normalized Match**: Lowercase, punctuation-removed equality.
   - **Alias Match**: Using `data/config/role-title-aliases.json`.
   - **Fuzzy Match**: Using SequenceMatcher with a conservative threshold (>= 0.92).
   - **Unresolved**: Retained in `unmatched-role-mappings.json`.

## 4. Current DB Entity Status
After preprocessing, the following entities are output to JSON in `data/processed/` and seeded in PostgreSQL:
* **CareerRole**: 352 roles
* **Skill**: 687 unique skills
* **RoleSkillRequirement**: Join table establishing required skills (weighted at default importance score of 5).
* **Certification**: 492 certifications
* **RoleCertification**: Join table establishing relevant certifications (weighted at default relevance score of 5).
* **Technology**: 8,767 tools/technologies
* **RoleTechnology**: Join table establishing technology requirements mapped from O*NET.

## 5. Suitability for ML Model Training
* The dataset is **highly suitable** for:
  - Similarity-based retrieval (recommending roles by mapping student interest vectors to role description vectors).
  - Supervised binary relevance ranking (predicting whether a role fits a given profile based on skills overlap and semantic similarity).
* It is **unsuitable** for:
  - Direct multiclass classification (since we only have 1 dataset row per role, we lack multiple samples per class to train a standard text classifier without generating synthetic user profiles).
