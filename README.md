# Explainable Credit Risk Assessment

An end-to-end machine learning project that predicts the probability of a loan applicant defaulting, explains *why* with SHAP, and serves the model through a FastAPI backend with a clean web interface.

**Live demo:** https://your-app.onrender.com *(replace with your Render URL)*

---

## Overview

Lenders need to decide quickly whether an applicant is likely to repay a loan, and they need to justify that decision. This project trains and compares two models on historical loan data, tunes the stronger one, picks a decision threshold, and explains the predictions with SHAP. The result is deployed as a web app: enter an application, get a default probability and a clear **Low Risk / High Risk** verdict.

## Features

- **Data validation and cleaning:** removes duplicates, impossible ages, and inconsistent employment lengths
- **Class imbalance handling:** `scale_pos_weight` for XGBoost and `class_weight="balanced"` for Logistic Regression
- **Leak-free preprocessing:** `ColumnTransformer` + `Pipeline` for imputing, scaling and one-hot encoding
- **Model comparison:** Logistic Regression baseline vs a tuned XGBoost model, using stratified 5-fold cross-validation
- **Hyperparameter tuning:** `RandomizedSearchCV` (150 iterations) optimising average precision
- **Threshold optimisation and probability calibration:** the decision cut-off is tuned rather than fixed at 0.5, and the probabilities are checked with calibration curves
- **Explainability:** global and local SHAP explanations (summary and waterfall plots)
- **Error analysis:** false positives and false negatives reviewed
- **Web app:** responsive UI with an animated risk gauge, dark mode, and form validation

## Tech stack

| Area | Tools |
|---|---|
| Data and modelling | Python, pandas, NumPy, scikit-learn, XGBoost |
| Explainability | SHAP |
| Visualisation | Matplotlib, Seaborn |
| Backend | FastAPI, Uvicorn, Pydantic |
| Frontend | HTML, CSS, JavaScript |
| Deployment | Render, GitHub |

## Dataset

The Credit Risk dataset (`credit_risk_dataset.csv`) contains loan applicants with a binary target, `loan_status` (1 = default, 0 = repaid). The model uses 11 input features:

| Feature | Description |
|---|---|
| `person_age` | Applicant age |
| `person_income` | Annual income |
| `person_home_ownership` | RENT, OWN, MORTGAGE or OTHER |
| `person_emp_length` | Employment length in years |
| `loan_intent` | Purpose of the loan |
| `loan_grade` | Loan grade (A to G) |
| `loan_amnt` | Loan amount |
| `loan_int_rate` | Interest rate (%) |
| `loan_percent_income` | Loan amount as a share of income |
| `cb_person_default_on_file` | Previous default on record (Y/N) |
| `cb_person_cred_hist_length` | Credit history length in years |

## Methodology

1. **Exploratory analysis:** shape, missing values, target balance, outliers and correlations
2. **Validation and cleaning:** duplicate removal, age filtered to 18-100, employment length capped and checked against age, non-positive loan amounts removed
3. **Train/test split:** 80/20, stratified on the target
4. **Preprocessing:** median imputation for numeric columns, constant imputation and one-hot encoding for categorical columns, scaling for Logistic Regression only
5. **Modelling:** Logistic Regression baseline, then XGBoost tuned with randomized search
6. **Threshold selection and calibration:** decision threshold chosen from the precision-recall curve, with sigmoid calibration
7. **Interpretation:** SHAP `TreeExplainer` for global importance and per-applicant explanations
8. **Deployment:** the pipeline and threshold are saved with `joblib` and served by FastAPI

## Results

Evaluated on a held-out test set of 6,305 applicants at the default 0.5 cut-off:

| Model | Accuracy | Precision (default) | Recall (default) | F1 (default) |
|---|---|---|---|---|
| Logistic Regression | 0.82 | 0.56 | 0.79 | 0.65 |
| **XGBoost (tuned)** | **0.92** | **0.81** | **0.81** | **0.81** |

Cross-validation on the training set also favoured XGBoost (ROC-AUC 0.94 vs 0.87 for Logistic Regression before tuning). The tuned model reached a cross-validated average precision of 0.90.

## Project structure

```
.
├── main.py                    # FastAPI app: /predict, /health, static files
├── static/
│   ├── index.html             # UI
│   ├── styles.css
│   └── script.js
├── Credit_Risk.ipynb          # EDA, modelling, SHAP analysis
├── credit_risk_dataset.csv
├── credit_risk_model_xg.pkl   # Trained pipeline
├── best_threshold.pkl         # Decision threshold
├── requirements.txt
├── render.yaml                # Render configuration
├── runtime.txt
└── .python-version
```

## Run locally

```bash
git clone https://github.com/taruntomar21/Credit_risk_assessment_using_SHAP.git
cd Credit_risk_assessment_using_SHAP

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Open **http://127.0.0.1:8000** in your browser. Interactive API docs are at `/docs`.

## API

**`POST /predict`**

```json
{
  "person_age": 27,
  "person_income": 58000,
  "person_home_ownership": "RENT",
  "person_emp_length": 4,
  "loan_intent": "PERSONAL",
  "loan_grade": "B",
  "loan_amnt": 12000,
  "loan_int_rate": 11.5,
  "loan_percent_income": 0.21,
  "cb_person_default_on_file": "N",
  "cb_person_cred_hist_length": 5
}
```

Response:

```json
{
  "default_probability": 0.18,
  "default_prediction": 0,
  "threshold": 0.52,
  "Result": "Low Risk"
}
```

*(Values above are illustrative.)*

## Deployment on Render

1. Push the repository to GitHub, including both `.pkl` files.
2. In Render, create a **Web Service** from the repo (or use **New > Blueprint** with `render.yaml`).
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Set the environment variable `PYTHON_VERSION` to `3.12.8`.

The model was trained with scikit-learn 1.6.1, so `requirements.txt` pins that version. Loading a pickle with a different scikit-learn version can fail or change predictions. Keep the library versions the same as in the training environment.

## Limitations and future work

- The dataset is historical and may not reflect current lending conditions or any specific lender's population.
- Credit decisions affect people. This project is a learning and portfolio demonstration, not a production lending system, and should not be the only input to a real decision.
- Fairness checks across demographic groups have not been done.
- Possible next steps: model monitoring, an explanation view in the web app (per-applicant SHAP), and automated tests.

## Author

**Tarun**, B.Tech, Dr. B. R. Ambedkar NIT Jalandhar. Aspiring data and analytics professional.

## License

Released for educational purposes. Add a license of your choice (for example MIT) before reusing.
