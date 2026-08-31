import pandas as pd

# ==========================================
# STEP 1: LOAD DATASET
# ==========================================

df = pd.read_csv("../data/SIH26025_ML_READY_DATASET.csv")

print("Dataset loaded successfully!")

# ==========================================
# STEP 2: CHECK DATA
# ==========================================

print("\nDataset shape:")
print(df.shape)

print("\nMissing values:")
print(df.isnull().sum())

print("\nDuplicate rows:")
print(df.duplicated().sum())

# ==========================================
# STEP 3: SELECT ML FEATURES
# ==========================================

features = [
    "tilt_x_deg",
    "tilt_y_deg",
    "tilt_magnitude_deg",
    "displacement_mm",
    "displacement_change_mm",
    "displacement_rate_mm_per_hour",
    "distance_to_neighbor_m",
    "vibration_g",
    "crack_width_mm",
    "crack_change_mm",
    "displacement_vs_network_mean_mm"
]

# Input features
X = df[features]

# Target / output
y = df["risk_level"]

print("\nFeatures used for ML:")
print(features)

print("\nInput shape:", X.shape)
print("Target shape:", y.shape)

# ==========================================
# STEP 4: CHECK RISK LEVELS
# ==========================================

print("\nRisk level distribution:")
print(y.value_counts())


# ==========================================
# STEP 4: SPLIT DATA INTO TRAINING AND TESTING
# ==========================================

# Since this is sensor time-series data,
# use the earlier 80% for training
# and the later 20% for testing.

split_index = int(len(df) * 0.8)

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test = y.iloc[split_index:]

print("\nTraining data:")
print("X_train:", X_train.shape)
print("y_train:", y_train.shape)

print("\nTesting data:")
print("X_test:", X_test.shape)
print("y_test:", y_test.shape)

# ==========================================
# STEP 5: TRAIN RANDOM FOREST MODEL
# ==========================================

from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)

print("\nTraining Random Forest model...")

model.fit(X_train, y_train)

print("Model training completed!")
# ==========================================
# STEP 6: EVALUATE MODEL
# ==========================================

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# Make predictions on test data
y_pred = model.predict(X_test)

# Accuracy
accuracy = accuracy_score(y_test, y_pred)

print("\nModel Accuracy:")
print(f"{accuracy * 100:.2f}%")

# Detailed report
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Confusion matrix
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# ==========================================
# STEP 7: SAVE TRAINED MODEL
# ==========================================

import joblib

model_path = "subsidence_model.pkl"

joblib.dump(model, model_path)

print("\nModel saved successfully!")
print(f"Model file: {model_path}")