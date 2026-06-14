# ML Plan

This document outlines the machine learning architecture designed to power personalized career path and role recommendations in CareerGPT.

## 1. Core Problem Formulation: Learning to Rank (LTR)
Instead of treating career recommendation as a simple prompt engineering problem or a basic classification problem, we formulate it as a **Relevance Ranking Problem**.

Given a **Student Profile** (with education, major, interests, preferred roles, and current skills) and a set of candidate **Career Roles** from our database, we predict a binary label:
$$\text{Relevance}(User, Role) \in \{0, 1\}$$

Our model predicts the probability $P(\text{Relevance} = 1 \mid User, Role)$ and uses this probability to rank the roles. The top 3-5 roles are recommended to the student.

### Why this formulation makes sense:
* **Handles Cold Start**: By comparing user characteristics directly with role requirements (semantic match + skill overlap), we can recommend new roles even if we don't have large historical user logs.
* **Explainability**: Since the ranking is based on engineered features (e.g. skills overlap, keyword cosine similarity), we can inspect the model's coefficients or tree splits to explain *why* a role is ranked highly.
* **Hybrid Intelligence**: It combines deterministic business logic (explicit skill-gap counts) with semantic inference (TF-IDF/embeddings matching).

---

## 2. Feature Engineering Pipeline
For each pair of (User, Candidate Role), we extract the following features:

| Feature Name | Type | Description |
| :--- | :--- | :--- |
| `preferred_role_match` | Float | Jaccard/string overlap between User's `preferredRoles` and Role name. |
| `interests_description_similarity` | Float | TF-IDF / Embedding similarity between User's `interests` and Role description. |
| `major_description_similarity` | Float | TF-IDF similarity between User's `major` and Role description. |
| `skills_overlap_ratio` | Float | Percentage of the Role's required skills that the User possesses at Level >= 3. |
| `skills_average_level` | Float | The student's average proficiency score on the Role's required skills. |
| `skills_gap_score` | Float | Negative distance sum: $\sum \max(0, \text{RequiredLevel} - \text{UserLevel})$. |
| `experience_match_score` | Float | Correlation between user experience level and role difficulty proxy. |
| `has_hot_technologies` | Float | Score based on how many of the role's hot technologies the user has experience with. |

---

## 3. Training Workflow & Synthetic Data Generation
Since our dataset consists of roles and their explicit requirements (but no actual student profiles with label feedback), we use **Synthetic Profile Generation** to train the model:
1. **Positive Samples ($Label = 1$)**: For each role in the database, we generate a synthetic profile that "fits" the role. We sample skills from the role's requirements, add keywords from the description to interests, and set preferred roles to variations of the role's title.
2. **Negative Samples ($Label = 0$)**: We pair the same role with synthetic profiles generated for completely different roles (e.g. pairing a Frontend Developer profile with a Big Data Admin role).
3. **Model Selection**: We train two models and compare their metrics:
   - **XGBoost Classifier**: Captures complex non-linear combinations of skill gaps and text similarities.
   - **Random Forest Classifier**: High stability and robust to overfitting on synthetic data.
   - **Sentence-Transformer Cosine Similarity**: Pure embedding baseline.

---

## 4. Evaluation Metrics
We evaluate the model using an 80/20 train/test split of the synthetic profile database:
* **Binary Classification Metrics**: ROC-AUC, LogLoss, F1-Score (to ensure positive/negative separation).
* **Ranking Metrics (Top-K)**: Mean Reciprocal Rank (MRR) and NDCG@5 (to measure if the true matching role is ranked at the top).

## 5. Deployment & Next.js Integration
1. The trained model, vectorizer, and scalers are saved as serialized artifacts (`.joblib`) in `src/ml/models/`.
2. When the user visits their dashboard, the backend triggers an inference python script: `python scripts/recommend.py --profile <json_string>`.
3. The script loads the artifacts, scores the active roles, and outputs a ranked JSON payload on stdout.
4. **Fallback Behavior**: If the python script fails (missing libraries, process error), the API falls back to Layer A (deterministic overlap scoring).

## 6. Limitations & Future Extensions
* **Synthetic Bias**: The model is trained on simulated students. As real users provide feedback (using the thumbs-up/down buttons), we will save these inputs to `RecommendationFeedback` and use them to retrain the model on real data.
* **Local Latency**: Spawning a python process takes ~100-300ms. For a production system, this would be served via an API endpoint (e.g. FastAPI) or compiled to WebAssembly. For our MVP, child-process execution is robust and requires no extra hosting.
