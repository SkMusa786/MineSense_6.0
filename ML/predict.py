import joblib
import pandas as pd
import numpy as np

# Load trained model
model = joblib.load("subsidence_model.pkl")

# New sensor reading
data = {
    "tilt_x_deg": 1.20,
    "tilt_y_deg": 0.85,
    "tilt_magnitude_deg": np.sqrt(1.20**2 + 0.85**2),
    "displacement_mm": 8.50,
    "displacement_change_mm": 0.80,
    "displacement_rate_mm_per_hour": 0.60,
    "distance_to_neighbor_m": 10.20,
    "vibration_g": 0.08,
    "crack_width_mm": 0.60,
    "crack_change_mm": 0.10,
    "displacement_vs_network_mean_mm": 1.50
}

# Convert to DataFrame
input_data = pd.DataFrame([data])

# Predict
prediction = model.predict(input_data)

# Prediction probability
probability = model.predict_proba(input_data).max()

print("Predicted Risk Level:", prediction[0])
print(f"Prediction Probability: {probability * 100:.2f}%")