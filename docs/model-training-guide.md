# Model Training Guide

This document describes how to execute the training pipeline, inspect model performance, and deploy the saved artifacts for CareerGPT.

## 1. Setup & Environment
Ensure you have the required Python libraries installed:
```bash
pip install pandas numpy scipy scikit-learn xgboost sentence-transformers joblib
```

These packages are already pre-installed on the default development machine.

---

## 2. Ingesting & Preparing the Training Data
The script `scripts/train_recommendation_model.py` performs the training flow. It:
1. Loads the processed database JSONs (`roles.json`, `skills.json`, `role-skill-requirements.json`).
2. Generates synthetic student profiles for positive ($Label=1$) and negative ($Label=0$) match examples.
3. Computes the custom feature vectors for each (Profile, Role) pair.
4. Performs an 80/20 train/test split.

---

## 3. Running the Training Pipeline
Run the script using the following npm command (which we will configure):
```bash
npm run ml:train
```
Or run the python script directly:
```bash
python scripts/train_recommendation_model.py
```

### Script Output:
* Fits a TF-IDF vectorizer on all role descriptions.
* Fits a MinMaxScaler on engineered feature matrices.
* Trains a Random Forest Classifier and an XGBoost Classifier.
* Prints performance evaluations to the console:
  - Accuracy
  - ROC-AUC
  - Classification Report (Precision, Recall, F1-Score)
* Saves the following artifacts to the `src/ml/models/` folder:
  - `model.joblib` (Trained Random Forest Classifier)
  - `vectorizer.joblib` (TF-IDF Vectorizer for text mapping)
  - `scaler.joblib` (MinMax Feature Scaler)
  - `metadata.json` (Record of metrics, train date, features used)

---

## 4. Local Evaluation and Verification
The training script prints an evaluation report. You can review the metrics to ensure the AUC score is above $0.90$. 

If the metrics are weak, verify:
* Positive/negative ratio in training generation (target is 1:3 ratio).
* Strength of preferred role matching (leveraging slug similarity).

---

## 5. Offline Inference Testing
To test inference manually:
```bash
python scripts/recommend.py --test
```
This runs a test query against a simulated student profile and displays the ranked list of matching role titles with their predicted probabilities.
