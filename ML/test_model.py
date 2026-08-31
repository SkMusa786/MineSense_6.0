import pandas as pd
import joblib

# ==========================================
# STEP 1: LOAD TRAINED MODEL
# ==========================================

model = joblib.load("subsidence_model.pkl")

print("Trained model loaded successfully!")


# ==========================================
# STEP 2: LOAD DATASET
# ==========================================

df = pd.read_csv("../data/SIH26025_ML_READY_DATASET.csv")

print("Dataset loaded successfully!")
print("Total rows:", len(df))


# ==========================================
# STEP 3: SELECT SAME FEATURES USED FOR TRAINING
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


# ==========================================
# STEP 4: USE LAST 10 ROWS AS TEST DATA
# ==========================================

test_data = df.sample(10, random_state=42)
X_test = test_data[features]

actual = test_data["risk_level"]


# ==========================================
# STEP 5: MAKE PREDICTIONS
# ==========================================

predicted = model.predict(X_test)


# ==========================================
# STEP 6: DISPLAY RESULTS
# ==========================================

print("\nPrediction Results:")
print("----------------------------------------")

for i in range(len(test_data)):

    print(
        f"Row {i + 1}: "
        f"Actual = {actual.iloc[i]} | "
        f"Predicted = {predicted[i]}"
    )