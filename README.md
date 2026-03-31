# APEX · Body Performance Intelligence

> AI-powered fitness classification & broad jump prediction — Military Technical College, 2026

[![Live App](https://img.shields.io/badge/Live%20App-APEX%20Dashboard-00e5c8?style=for-the-badge)](https://ghariebml.github.io/apex-performance-app)
[![Colab](https://img.shields.io/badge/Google%20Colab-Open%20Notebook-F9AB00?style=for-the-badge&logo=googlecolab)](https://drive.google.com/file/d/13jssUdICQhQ6--C2Y8-F38LCJAQjYp0z/view?usp=sharing)
[![Dataset](https://img.shields.io/badge/Dataset-Kaggle-20BEFF?style=for-the-badge&logo=kaggle)](https://www.kaggle.com/datasets/kukuroo3/body-performance-data)

---

## Project Overview

APEX is a machine learning project that predicts physical fitness performance class (A–D) and estimates broad jump distance from 11 physiological measurements. Built on **13,393 real fitness evaluations** from the Kaggle Body Performance dataset.

The project implements a full end-to-end ML pipeline:

```
Data Audit → EDA → IQR Capping → 3-Split Training → Cross-Validation → Deployment
```

### Key Results
| Metric | Value |
|--------|-------|
| **Best Classification Accuracy** | **74.26%** (Random Forest, 70/30 split) |
| **Best CV Score** | **74.00% ± 1.12%** (Neural Network, 5-fold) |
| **Best Regression R²** | **0.7842** (RF Regressor, Broad Jump) |
| **Top Feature** | sit_and_bend_forward_cm (importance: 0.258) |

---

## Model Results

### Classification Models (All results from 70/30 split)

| Rank | Model | Accuracy | Precision | Recall | F1 | CV Mean ± Std |
|------|-------|:--------:|:---------:|:------:|:--:|:-------------:|
| 1 | **Random Forest** | **74.26%** | 74.71% | 74.26% | 74.12% | 73.32% ± 0.78% |
| 2 | Neural Network (MLP) | 74.06% | 75.19% | 74.06% | 74.16% | 74.00% ± 1.12% |
| 3 | SVM (RBF Kernel) | 71.62% | 72.12% | 71.62% | 71.57% | 70.90% ± 0.69% |
| 4 | Decision Tree | 65.17% | 66.79% | 65.17% | 65.32% | 64.75% ± 0.80% |
| 5 | Logistic Regression | 62.36% | 62.05% | 62.36% | 61.97% | 61.67% ± 0.83% |
| 6 | KNN (k=11) | 61.84% | 63.81% | 61.84% | 61.91% | 62.08% ± 0.72% |

### Train/Test Split Stability (Accuracy across splits)

| Model | 80/20 | 70/30 | 50/50 | Stability |
|-------|------:|------:|------:|:---------:|
| **Random Forest** | 74.01% | 74.26% | 72.36% | Best (Δ1.9%) |
| Neural Network | 72.40% | 74.06% | 72.38% | Good |
| SVM (RBF) | 71.14% | 71.62% | 70.51% | Good (Δ1.1%) |
| Decision Tree | 63.78% | 65.17% | 64.43% | Moderate |
| Logistic Regression | 63.14% | 62.36% | 62.32% | Moderate |
| KNN | 62.55% | 61.84% | 61.71% | Least Stable |

**Finding:** Random Forest is the most robust model — only a 1.9% accuracy drop from 80/20 to 50/50 training data.

### Regression Models (Broad Jump Prediction)

| Model | R² Score | RMSE | MAE |
|-------|:--------:|-----:|----:|
| **RF Regressor** | **0.7842** | 18.57 cm | 13.82 cm |
| Neural Network Regressor | 0.7837 | 18.59 cm | 13.88 cm |
| SVR (RBF Kernel) | 0.7796 | 18.76 cm | 13.92 cm |

### Feature Importance (Permutation Importance — Random Forest)

| Rank | Feature | Importance |
|------|---------|:----------:|
| #1 | sit_and_bend_forward_cm | **0.258** |
| #2 | sit-ups counts | **0.231** |
| #3 | age | 0.132 |
| #4 | weight_kg | 0.071 |
| #5 | body_fat_% | 0.058 |
| #6 | gripForce | 0.050 |
| #7 | gender | 0.050 |
| #8 | broad_jump_cm | 0.028 |
| #9 | height_cm | 0.010 |
| #10 | systolic | 0.006 |
| #11 | diastolic | −0.002 |

> **Key Finding:** Flexibility (sit-and-bend) and core endurance (sit-ups) together account for **48.9%** of total permutation importance — far ahead of body composition metrics. This is a major deviation from the conventional assumption that body fat % is the top predictor.

---

## How to Run the Notebook

### Option 1: Google Colab (Recommended)

Click the badge at the top of this README, or open:
```
https://drive.google.com/file/d/13jssUdICQhQ6--C2Y8-F38LCJAQjYp0z/view?usp=sharing
```
All dependencies are pre-installed in the Colab environment.

### Option 2: Local Environment

**Requirements:** Python 3.9+, Jupyter, scikit-learn, pandas, matplotlib, seaborn

```bash
# Clone the repo
git clone https://github.com/GhariebML/apex-performance-app.git
cd apex-performance-app

# Install dependencies
pip install -r requirements.txt

# Launch the notebook
jupyter notebook "03_Snipers_Team_ML_Notebook_Final.ipynb"
```

**Or use the analytics notebook (includes full EDA):**
```bash
jupyter notebook "Analytics_Notebook.ipynb"
```

### Option 3: Run the APEX Web App Locally

The web app is pure HTML/CSS/JS — no build step required.

```bash
# Just open index.html in your browser, or use Live Server:
npx live-server .
```

The app connects to a FastAPI backend for live predictions. To run the backend:
```bash
pip install fastapi uvicorn scikit-learn joblib
uvicorn main:app --reload
```

---

## Project Structure

```
apex-performance-app/
├── index.html                              # Main APEX web app
├── bodyPerformance.csv                     # Dataset (13,393 records)
├── rf_classifier.joblib                    # Trained Random Forest model
├── rf_regressor.joblib                     # Trained Random Forest regressor
├── scaler.joblib                           # StandardScaler fitted object
├── le_gender.joblib                        # Label encoder for gender
│
├── 03_Snipers_Team_ML_Notebook_Final.ipynb # Main ML notebook
├── Analytics_Notebook.ipynb               # Full EDA & analysis notebook
│
├── js/
│   ├── app.js          # Navigation, hero animations, modal control
│   ├── predict.js      # Local fallback JS prediction engine
│   ├── ui.js           # Results rendering & insights engine
│   ├── radar.js        # Performance radar chart (Canvas)
│   ├── charts.js       # Split analysis & CV chart (Chart.js)
│   └── history.js      # Session history & comparison modal
│
├── css/
│   ├── variables.css   # Design tokens
│   ├── base.css        # Global resets
│   ├── models.css      # Leaderboard & feature importance
│   ├── report.css      # Final report & artifacts
│   └── ...             # Other component stylesheets
│
└── README.md
```

---

## Methodology — Gharieb 5S Pipeline

| Stage | Description |
|-------|-------------|
| **1. Audit** | Physiological BP law enforcement (Systolic > Diastolic) + duplicate removal |
| **2. EDA** | Bivariate correlation analysis, class distribution, feature distribution plots |
| **3. Prep** | IQR outlier capping, StandardScaler normalization, Label encoding |
| **4. Model** | 6 classifiers × 3 splits + 5-fold CV + 3 regressors |
| **5. Deploy** | Interactive APEX dashboard with FastAPI backend + HTML/CSS/JS frontend |

---

## Gharieb Team

| Name | Role |
|------|------|
| **Gharieb** | Team Leader · Neural Network (MLP) |
| **Saad** | Data Engineer · KNN Classifier |
| **El Kholy** | Statistical Analyst · Logistic Regression |
| **Wael** | Visualization Lead · Decision Tree + Random Forest |
| **Hesham** | ML Engineer · SVM (Linear + RBF) |

---

## License

This project was created as a final project submission for the Machine Learning course at the **Military Technical College, Cairo, Egypt, 2026**.

---

*APEX · Body Performance Intelligence · Gharieb Team · MTC · 2026*
