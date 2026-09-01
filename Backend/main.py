from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import sqlite3
import json
import threading
import math
import os
from pathlib import Path


# ==========================================
# RUNTIME / DEPLOYMENT CONFIGURATION
# ==========================================

PORT = int(os.getenv("PORT", "8001"))
HOST = os.getenv("HOST", "0.0.0.0")

DEMO_SENSOR_ENABLED = os.getenv("DEMO_SENSOR_ENABLED", "true").strip().lower() in {"1", "true", "yes", "on"}
DEMO_SENSOR_CYCLE_SECONDS = max(1, int(os.getenv("DEMO_SENSOR_CYCLE_SECONDS", "5")))


# ==========================================
# DEMO SENSOR SIMULATOR
# ==========================================

DEMO_NODE_IDS = ["N01", "N02", "N03", "N04", "N05", "N06", "N07", "N08"]

DEMO_NODE_BASELINES = {
    "N01": {"tilt_x_deg": 0.08, "tilt_y_deg": 0.06, "displacement_mm": 2.1, "vibration_g": 0.018, "crack_width_mm": 0.01, "tilt_step_x": 0.0012, "tilt_step_y": 0.0011, "disp_step": 0.012, "vib_step": 0.00018, "crack_step": 0.0005, "phase": 0.6},
    "N02": {"tilt_x_deg": 0.24, "tilt_y_deg": 0.19, "displacement_mm": 2.45, "vibration_g": 0.022, "crack_width_mm": 0.025, "tilt_step_x": 0.0065, "tilt_step_y": 0.0054, "disp_step": 0.08, "vib_step": 0.0009, "crack_step": 0.003, "phase": 1.2},
    "N03": {"tilt_x_deg": 0.54, "tilt_y_deg": 0.38, "displacement_mm": 5.9, "vibration_g": 0.042, "crack_width_mm": 0.17, "tilt_step_x": 0.016, "tilt_step_y": 0.0135, "disp_step": 0.18, "vib_step": 0.0018, "crack_step": 0.006, "phase": 1.8},
    "N04": {"tilt_x_deg": 0.82, "tilt_y_deg": 0.66, "displacement_mm": 7.8, "vibration_g": 0.062, "crack_width_mm": 0.26, "tilt_step_x": 0.028, "tilt_step_y": 0.024, "disp_step": 0.32, "vib_step": 0.0034, "crack_step": 0.012, "phase": 2.3},
    "N05": {"tilt_x_deg": 0.09, "tilt_y_deg": 0.07, "displacement_mm": 2.2, "vibration_g": 0.019, "crack_width_mm": 0.01, "tilt_step_x": 0.0013, "tilt_step_y": 0.0012, "disp_step": 0.014, "vib_step": 0.0002, "crack_step": 0.0006, "phase": 2.7},
    "N06": {"tilt_x_deg": 0.33, "tilt_y_deg": 0.27, "displacement_mm": 3.4, "vibration_g": 0.026, "crack_width_mm": 0.04, "tilt_step_x": 0.011, "tilt_step_y": 0.009, "disp_step": 0.12, "vib_step": 0.0012, "crack_step": 0.004, "phase": 3.1},
    "N07": {"tilt_x_deg": 0.045, "tilt_y_deg": 0.032, "displacement_mm": 1.55, "vibration_g": 0.012, "crack_width_mm": 0.008, "tilt_step_x": 0.0009, "tilt_step_y": 0.0008, "disp_step": 0.006, "vib_step": 0.00012, "crack_step": 0.0002, "phase": 3.6},
    "N08": {"tilt_x_deg": 0.057, "tilt_y_deg": 0.041, "displacement_mm": 1.76, "vibration_g": 0.014, "crack_width_mm": 0.009, "tilt_step_x": 0.001, "tilt_step_y": 0.0009, "disp_step": 0.0065, "vib_step": 0.00015, "crack_step": 0.0002, "phase": 4.1},
}


def _build_demo_sensor_payload(node_id: str, cycle_index: int):
    base = DEMO_NODE_BASELINES[node_id]
    wave = cycle_index * (0.45 + base["phase"] * 0.12)
    variation = math.sin(wave)
    tilt_x = base["tilt_x_deg"] + (cycle_index * base["tilt_step_x"]) + (variation * 0.03)
    tilt_y = base["tilt_y_deg"] + (cycle_index * base["tilt_step_y"]) + (math.cos(wave * 0.9) * 0.025)
    displacement = base["displacement_mm"] + (cycle_index * base["disp_step"]) + (math.sin(wave * 0.7) * 0.18)
    vibration = base["vibration_g"] + (cycle_index * base["vib_step"]) + (math.cos(wave * 0.8) * 0.004)
    crack = base["crack_width_mm"] + (cycle_index * base["crack_step"]) + (math.sin(wave * 0.9) * 0.02)

    return {
        "node_id": node_id,
        "timestamp_utc": datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "tilt_x_deg": round(max(0.0, float(tilt_x)), 4),
        "tilt_y_deg": round(max(0.0, float(tilt_y)), 4),
        "displacement_mm": round(max(0.0, float(displacement)), 4),
        "vibration_g": round(max(0.0, float(vibration)), 4),
        "crack_width_mm": round(max(0.0, float(crack)), 4),
    }


demo_simulator_thread = None
demo_simulator_stop = threading.Event()
demo_simulator_lock = threading.Lock()


def _seed_demo_predictions():
    for node_id in DEMO_NODE_IDS:
        payload = _build_demo_sensor_payload(node_id, 0)
        try:
            with demo_simulator_lock:
                _predict_and_store(payload)
        except Exception as exc:
            print(f"[DEMO] Bootstrap failed for {node_id}: {exc}")


def _demo_sensor_loop():
    cycle_index = 0
    print("[DEMO] Starting 8-node real-time sensor simulator")
    while not demo_simulator_stop.is_set():
        cycle_index += 1
        for node_id in DEMO_NODE_IDS:
            if demo_simulator_stop.is_set():
                break
            payload = _build_demo_sensor_payload(node_id, cycle_index)
            try:
                with demo_simulator_lock:
                    _predict_and_store(payload)
            except Exception as exc:
                print(f"[DEMO] Failed to process {node_id}: {exc}")
        demo_simulator_stop.wait(DEMO_SENSOR_CYCLE_SECONDS)
    print("[DEMO] Sensor simulator stopped")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan hook for startup/shutdown of the demo simulator."""
    global demo_simulator_thread

    if DEMO_SENSOR_ENABLED:
        demo_simulator_stop.clear()
        _seed_demo_predictions()
        demo_simulator_thread = threading.Thread(target=_demo_sensor_loop, name="demo-sensor-simulator", daemon=True)
        demo_simulator_thread.start()
        print(f"[DEMO] Demo sensor simulator active ({DEMO_SENSOR_CYCLE_SECONDS}s cycle)")
    else:
        print("[DEMO] Demo simulator disabled via DEMO_SENSOR_ENABLED")

    yield

    if demo_simulator_thread and demo_simulator_thread.is_alive():
        demo_simulator_stop.set()
        demo_simulator_thread.join(timeout=8)
        print("[DEMO] Demo sensor simulator shut down")


app = FastAPI(title="Mine Subsidence Monitoring API", lifespan=lifespan)


# ==========================================
# CORS
# ==========================================

DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://minesense-frontend.onrender.com",
    "https://minesense.onrender.com",
]

CORS_ORIGINS = []
for origin in (os.getenv("CORS_ORIGINS", "").split(",") + DEFAULT_CORS_ORIGINS):
    cleaned = origin.strip()
    if cleaned:
        CORS_ORIGINS.append(cleaned)

CORS_ORIGINS = list(dict.fromkeys(CORS_ORIGINS))

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# LOAD TRAINED ML MODELS
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "ML" / "models"

model = joblib.load(BASE_DIR / "ML" / "subsidence_model.pkl")

FUTURE_MODELS = {}
FUTURE_METADATA = {}
for horizon in [4, 6]:
    model_path = MODEL_DIR / f"future_{horizon}h_model.joblib"
    metadata_path = MODEL_DIR / f"future_{horizon}h_metadata.json"
    if model_path.exists():
        FUTURE_MODELS[horizon] = joblib.load(model_path)
    if metadata_path.exists():
        with metadata_path.open("r", encoding="utf-8") as fh:
            FUTURE_METADATA[horizon] = json.load(fh)


# ==========================================
# SQLITE DATABASE
# ==========================================

DB_NAME = str(BASE_DIR / "subsidence_history.db")


def init_database():

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensor_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT NOT NULL,
            timestamp_utc TEXT NOT NULL,
            tilt_x_deg REAL,
            tilt_y_deg REAL,
            tilt_magnitude_deg REAL,
            displacement_mm REAL,
            displacement_change_mm REAL,
            displacement_rate_mm_per_hour REAL,
            vibration_g REAL,
            crack_width_mm REAL,
            crack_change_mm REAL,
            displacement_vs_neighbor_mm REAL,
            risk_level TEXT,
            probability REAL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS forecast_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT NOT NULL,
            prediction_timestamp TEXT NOT NULL,
            horizon_hours INTEGER NOT NULL,
            predicted_risk TEXT,
            probability REAL,
            early_warning INTEGER DEFAULT 0
        )
    """)

    conn.commit()
    conn.close()


init_database()


# ==========================================
# MEMORY STORAGE
# ==========================================

previous_readings = {}
node_displacements = {}
node_predictions = {}
node_history = {}


def _safe_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _build_future_feature_row(node_id, sensor_data):
    history = node_history.get(node_id, [])
    current_time = datetime.fromisoformat(sensor_data["timestamp_utc"].replace("Z", "+00:00"))
    current = {
        "timestamp": current_time,
        "tilt_x_deg": _safe_float(sensor_data.get("tilt_x_deg", 0.0)),
        "tilt_y_deg": _safe_float(sensor_data.get("tilt_y_deg", 0.0)),
        "displacement_mm": _safe_float(sensor_data.get("displacement_mm", 0.0)),
        "vibration_g": _safe_float(sensor_data.get("vibration_g", 0.0)),
        "crack_width_mm": _safe_float(sensor_data.get("crack_width_mm", 0.0)),
    }
    history = history + [current]
    if len(history) > 120:
        history = history[-120:]
    node_history[node_id] = history

    tilt_magnitude = float(np.hypot(current["tilt_x_deg"], current["tilt_y_deg"]))
    displacement_values = [row["displacement_mm"] for row in history]
    crack_values = [row["crack_width_mm"] for row in history]
    vibration_values = [row["vibration_g"] for row in history]
    tilt_values = [float(np.hypot(row["tilt_x_deg"], row["tilt_y_deg"])) for row in history]

    feature_row = {
        "tilt_x_deg": current["tilt_x_deg"],
        "tilt_y_deg": current["tilt_y_deg"],
        "tilt_magnitude_deg": tilt_magnitude,
        "displacement_mm": current["displacement_mm"],
        "displacement_change_mm": current["displacement_mm"] - (history[-2]["displacement_mm"] if len(history) >= 2 else current["displacement_mm"]),
        "displacement_rate_mm_per_hour": 0.0,
        "distance_to_neighbor_m": 10.0,
        "vibration_g": current["vibration_g"],
        "crack_width_mm": current["crack_width_mm"],
        "crack_change_mm": current["crack_width_mm"] - (history[-2]["crack_width_mm"] if len(history) >= 2 else current["crack_width_mm"]),
        "displacement_vs_network_mean_mm": 0.0,
    }

    if len(history) >= 2:
        previous_time = history[-2]["timestamp"]
        hours_delta = (current_time - previous_time).total_seconds() / 3600.0
        if hours_delta > 0:
            feature_row["displacement_rate_mm_per_hour"] = (
                feature_row["displacement_change_mm"] / hours_delta
            )

    for window in [3, 6, 12, 24]:
        window_values = displacement_values[-window:]
        if window_values:
            feature_row[f"displacement_mean_{window}"] = float(np.mean(window_values))
            feature_row[f"displacement_max_{window}"] = float(np.max(window_values))
            if len(window_values) >= 2:
                feature_row[f"displacement_trend_{window}"] = float(window_values[-1] - window_values[0])
            else:
                feature_row[f"displacement_trend_{window}"] = 0.0
        else:
            feature_row[f"displacement_mean_{window}"] = 0.0
            feature_row[f"displacement_max_{window}"] = 0.0
            feature_row[f"displacement_trend_{window}"] = 0.0

        crack_window = crack_values[-window:]
        if crack_window:
            feature_row[f"crack_mean_{window}"] = float(np.mean(crack_window))
            feature_row[f"crack_trend_{window}"] = float(crack_window[-1] - crack_window[0]) if len(crack_window) >= 2 else 0.0
        else:
            feature_row[f"crack_mean_{window}"] = 0.0
            feature_row[f"crack_trend_{window}"] = 0.0

        vib_window = vibration_values[-window:]
        if vib_window:
            feature_row[f"vibration_mean_{window}"] = float(np.mean(vib_window))
            feature_row[f"vibration_trend_{window}"] = float(vib_window[-1] - vib_window[0]) if len(vib_window) >= 2 else 0.0
        else:
            feature_row[f"vibration_mean_{window}"] = 0.0
            feature_row[f"vibration_trend_{window}"] = 0.0

        tilt_window = tilt_values[-window:]
        if tilt_window:
            feature_row[f"tilt_magnitude_mean_{window}"] = float(np.mean(tilt_window))
            feature_row[f"tilt_magnitude_trend_{window}"] = float(tilt_window[-1] - tilt_window[0]) if len(tilt_window) >= 2 else 0.0
        else:
            feature_row[f"tilt_magnitude_mean_{window}"] = 0.0
            feature_row[f"tilt_magnitude_trend_{window}"] = 0.0

    return feature_row


def _predict_future_for_node(node_id, sensor_data):
    if not FUTURE_MODELS:
        return {
            "future_4h_risk": "NORMAL",
            "future_4h_probability": 0.0,
            "future_6h_risk": "NORMAL",
            "future_6h_probability": 0.0,
            "early_warning": False,
        }

    feature_row = _build_future_feature_row(node_id, sensor_data)
    ordered = {}
    for horizon, model in FUTURE_MODELS.items():
        feature_names = getattr(model, "feature_names_in_", None)
        metadata = FUTURE_METADATA.get(horizon, {})
        if feature_names is not None:
            columns = list(feature_names)
        else:
            columns = metadata.get("feature_columns", [])
        if not columns:
            columns = sorted(feature_row.keys())
        X = pd.DataFrame([{key: feature_row.get(key, 0.0) for key in columns}])
        prediction = model.predict(X)[0]
        probability = float(model.predict_proba(X).max()) * 100.0
        ordered[f"future_{horizon}h_risk"] = str(prediction)
        ordered[f"future_{horizon}h_probability"] = round(probability, 2)

    early_warning = (
        ordered.get("future_4h_risk", "NORMAL") in ["WARNING", "CRITICAL"]
        or ordered.get("future_6h_risk", "NORMAL") in ["WARNING", "CRITICAL"]
    )
    ordered["early_warning"] = bool(early_warning)
    return ordered


# ==========================================
# NEIGHBOUR MAP
# ==========================================
# Maps each node to its neighboring nodes for displacement calculations
# Topology: Two separate zones with linear connectivity
# Zone 1 (Eastern): N01 ↔ N02 ↔ N03
# Zone 2 (Western): N04 ↔ N05 ↔ N06 ↔ N07 ↔ N08

neighbors = {
    "N01": ["N02"],
    "N02": ["N01", "N03"],
    "N03": ["N02"],
    "N04": ["N05"],
    "N05": ["N04", "N06"],
    "N06": ["N05", "N07"],
    "N07": ["N06", "N08"],
    "N08": ["N07"]
}


# ==========================================
# SENSOR DATA MODEL
# ==========================================

class SensorData(BaseModel):

    node_id: str
    timestamp_utc: str
    tilt_x_deg: float
    tilt_y_deg: float
    displacement_mm: float
    vibration_g: float
    crack_width_mm: float


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():

    return {
        "message": "Mine Subsidence Backend is running"
    }


# ==========================================
# GET NODES
# ==========================================

@app.get("/nodes")
def get_nodes():

    nodes = list(node_predictions.values())

    risk_priority = {
        "CRITICAL": 4,
        "WARNING": 3,
        "WATCH": 2,
        "NORMAL": 1
    }

    nodes.sort(
        key=lambda x: (
            risk_priority.get(
                x["risk_level"],
                0
            ),
            x["probability"]
        ),
        reverse=True
    )

    highest_risk_node = None

    if nodes:
        highest_risk_node = nodes[0]

    return {
        "highest_risk_node": highest_risk_node,
        "nodes": nodes
    }


# ==========================================
# POTENTIAL SUBSIDENCE ZONES
# ==========================================

@app.get("/zones")
def get_risk_zones():

    high_risk_nodes = []

    for node_id, result in node_predictions.items():

        if result["risk_level"] in [
            "WARNING",
            "CRITICAL"
        ]:

            high_risk_nodes.append({
                "node_id": node_id,
                "risk_level": result["risk_level"],
                "probability": result["probability"]
            })

    zones = []
    visited = set()

    for node_info in high_risk_nodes:

        current_node = node_info["node_id"]

        if current_node in visited:
            continue

        zone_nodes = [current_node]
        visited.add(current_node)

        for neighbour in neighbors.get(
            current_node,
            []
        ):

            for item in high_risk_nodes:

                if item["node_id"] == neighbour:

                    zone_nodes.append(neighbour)
                    visited.add(neighbour)

        if len(zone_nodes) >= 2:

            zones.append({
                "zone_id": f"ZONE-{len(zones) + 1}",
                "nodes": zone_nodes,
                "risk_level": "HIGH",
                "message":
                    "Multiple neighbouring nodes show abnormal deformation"
            })

    return {
        "potential_subsidence_zones": zones
    }


# ==========================================
# ALERTS
# ==========================================

@app.get("/alerts")
def get_alerts():

    alerts = []

    for node_id, result in node_predictions.items():

        risk = result["risk_level"]

        if risk in [
            "WARNING",
            "CRITICAL"
        ]:

            reasons = []

            features = result["calculated_features"]

            if features["displacement_change_mm"] > 0:

                reasons.append(
                    "Displacement increased by "
                    + str(
                        features["displacement_change_mm"]
                    )
                    + " mm"
                )

            if features["displacement_rate_mm_per_hour"] > 0:

                reasons.append(
                    "Displacement rate: "
                    + str(
                        features[
                            "displacement_rate_mm_per_hour"
                        ]
                    )
                    + " mm/hour"
                )

            if features["crack_change_mm"] > 0:

                reasons.append(
                    "Crack width increased by "
                    + str(
                        features["crack_change_mm"]
                    )
                    + " mm"
                )

            if not reasons:

                reasons.append(
                    "ML model detected abnormal deformation"
                )

            alerts.append({

                "node_id":
                    node_id,

                "risk_level":
                    risk,

                "probability":
                    result["probability"],

                "timestamp":
                    result["timestamp"],

                "reasons":
                    reasons,

                "status":
                    "ACTIVE"
            })

    risk_priority = {
        "CRITICAL": 2,
        "WARNING": 1
    }

    alerts.sort(
        key=lambda x: (
            risk_priority.get(
                x["risk_level"],
                0
            ),
            x["probability"]
        ),
        reverse=True
    )

    return {
        "active_alerts": alerts
    }


# ==========================================
# HISTORICAL DATA
# ==========================================

@app.get("/history")
def get_history(limit: int = 500, node_id: str | None = None):
    """
    Retrieve historical sensor readings with optional pagination and filtering.
    
    Args:
        limit: Maximum number of records to return (default 500, max 2000)
        node_id: Optional node ID to filter by (e.g., "N01")
    
    Returns:
        Dictionary with history list and metadata
    """
    # Enforce reasonable limits
    if limit < 1:
        limit = 500
    if limit > 2000:
        limit = 2000

    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if node_id:
        # Filter by specific node
        cursor.execute("""
            SELECT
                node_id,
                timestamp_utc,
                tilt_x_deg,
                tilt_y_deg,
                tilt_magnitude_deg,
                displacement_mm,
                displacement_change_mm,
                displacement_rate_mm_per_hour,
                vibration_g,
                crack_width_mm,
                crack_change_mm,
                displacement_vs_neighbor_mm,
                risk_level,
                probability
            FROM sensor_history
            WHERE node_id = ?
            ORDER BY timestamp_utc DESC
            LIMIT ?
        """, (node_id, limit))
    else:
        # All nodes, limited
        cursor.execute("""
            SELECT
                node_id,
                timestamp_utc,
                tilt_x_deg,
                tilt_y_deg,
                tilt_magnitude_deg,
                displacement_mm,
                displacement_change_mm,
                displacement_rate_mm_per_hour,
                vibration_g,
                crack_width_mm,
                crack_change_mm,
                displacement_vs_neighbor_mm,
                risk_level,
                probability
            FROM sensor_history
            ORDER BY timestamp_utc DESC
            LIMIT ?
        """, (limit,))

    rows = cursor.fetchall()
    conn.close()

    history = [
        dict(row)
        for row in rows
    ]

    return {
        "history": history,
        "count": len(history),
        "limit": limit,
        "node_filter": node_id if node_id else None
    }


# ==========================================
# PREDICTION
# ==========================================

def _predict_and_store(data_dict):
    """
    Core prediction logic: processes sensor data, runs ML inference,
    and stores results. Used by both HTTP /predict and MQTT handler.
    
    Args:
        data_dict: Dictionary with keys: node_id, timestamp_utc, tilt_x_deg, 
                   tilt_y_deg, displacement_mm, vibration_g, crack_width_mm
    
    Returns:
        Dictionary with prediction results
    """
    try:
        # ==========================================
        # 1. TIMESTAMP
        # ==========================================

        current_time = datetime.fromisoformat(
            data_dict["timestamp_utc"].replace("Z", "+00:00")
        )

        # ==========================================
        # 2. TILT MAGNITUDE
        # ==========================================

        tilt_magnitude_deg = np.sqrt(
            data_dict["tilt_x_deg"] ** 2 +
            data_dict["tilt_y_deg"] ** 2
        )

        # ==========================================
        # 3. PREVIOUS READING
        # ==========================================

        previous = previous_readings.get(data_dict["node_id"])

        displacement_change_mm = 0.0
        displacement_rate_mm_per_hour = 0.0
        crack_change_mm = 0.0

        # ==========================================
        # 4. CHANGE AND RATE
        # ==========================================

        if previous is not None:
            displacement_change_mm = (
                data_dict["displacement_mm"] -
                previous["displacement_mm"]
            )

            crack_change_mm = (
                data_dict["crack_width_mm"] -
                previous["crack_width_mm"]
            )

            time_difference = (
                current_time -
                previous["timestamp"]
            ).total_seconds() / 3600

            if time_difference > 0:
                displacement_rate_mm_per_hour = (
                    displacement_change_mm /
                    time_difference
                )

        # ==========================================
        # 5. CURRENT DISPLACEMENT
        # ==========================================

        node_displacements[data_dict["node_id"]] = data_dict["displacement_mm"]

        # ==========================================
        # 6. NEIGHBOURS
        # ==========================================

        node_neighbors = neighbors.get(data_dict["node_id"], [])

        neighbor_values = [
            node_displacements[node]
            for node in node_neighbors
            if node in node_displacements
        ]

        # ==========================================
        # 7. RELATIVE DISPLACEMENT
        # ==========================================

        if neighbor_values:
            neighbor_average = (
                sum(neighbor_values) /
                len(neighbor_values)
            )
            displacement_vs_network_mean_mm = (
                data_dict["displacement_mm"] -
                neighbor_average
            )
        else:
            displacement_vs_network_mean_mm = 0.0

        distance_to_neighbor_m = 10.0

        # ==========================================
        # 8. ML INPUT
        # ==========================================

        input_data = pd.DataFrame([{
            "tilt_x_deg": data_dict["tilt_x_deg"],
            "tilt_y_deg": data_dict["tilt_y_deg"],
            "tilt_magnitude_deg": tilt_magnitude_deg,
            "displacement_mm": data_dict["displacement_mm"],
            "displacement_change_mm": displacement_change_mm,
            "displacement_rate_mm_per_hour": displacement_rate_mm_per_hour,
            "distance_to_neighbor_m": distance_to_neighbor_m,
            "vibration_g": data_dict["vibration_g"],
            "crack_width_mm": data_dict["crack_width_mm"],
            "crack_change_mm": crack_change_mm,
            "displacement_vs_network_mean_mm": displacement_vs_network_mean_mm
        }])

        # ==========================================
        # 9. ML PREDICTION
        # ==========================================

        prediction = model.predict(input_data)[0]

        probability = model.predict_proba(input_data).max()

        probability_percent = round(float(probability) * 100, 2)

        # ==========================================
        # CALCULATED FEATURES
        # ==========================================

        calculated_features = {
            "tilt_magnitude_deg": round(float(tilt_magnitude_deg), 3),
            "displacement_change_mm": round(float(displacement_change_mm), 3),
            "displacement_rate_mm_per_hour": round(float(displacement_rate_mm_per_hour), 3),
            "crack_change_mm": round(float(crack_change_mm), 3),
            "displacement_vs_neighbor_mm": round(float(displacement_vs_network_mean_mm), 3)
        }

        # ==========================================
        # 10. LATEST PREDICTION (IN-MEMORY)
        # ==========================================

        node_predictions[data_dict["node_id"]] = {
            "node_id": data_dict["node_id"],
            "risk_level": str(prediction),
            "probability": probability_percent,
            "sensors": {
                "tilt_x_deg": data_dict["tilt_x_deg"],
                "tilt_y_deg": data_dict["tilt_y_deg"],
                "displacement_mm": data_dict["displacement_mm"],
                "vibration_g": data_dict["vibration_g"],
                "crack_width_mm": data_dict["crack_width_mm"]
            },
            "calculated_features": calculated_features,
            "timestamp": data_dict["timestamp_utc"]
        }

        # ==========================================
        # 11. SAVE TO SQLITE
        # ==========================================

        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO sensor_history (
                node_id,
                timestamp_utc,
                tilt_x_deg,
                tilt_y_deg,
                tilt_magnitude_deg,
                displacement_mm,
                displacement_change_mm,
                displacement_rate_mm_per_hour,
                vibration_g,
                crack_width_mm,
                crack_change_mm,
                displacement_vs_neighbor_mm,
                risk_level,
                probability
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data_dict["node_id"],
            data_dict["timestamp_utc"],
            data_dict["tilt_x_deg"],
            data_dict["tilt_y_deg"],
            float(tilt_magnitude_deg),
            data_dict["displacement_mm"],
            float(displacement_change_mm),
            float(displacement_rate_mm_per_hour),
            data_dict["vibration_g"],
            data_dict["crack_width_mm"],
            float(crack_change_mm),
            float(displacement_vs_network_mean_mm),
            str(prediction),
            probability_percent
        ))

        conn.commit()
        conn.close()

        # ==========================================
        # 12. FUTURE-RISK FORECAST
        # ==========================================

        future_prediction = _predict_future_for_node(data_dict["node_id"], data_dict)
        future_4h_risk = future_prediction.get("future_4h_risk", "NORMAL")
        future_4h_probability = future_prediction.get("future_4h_probability", 0.0)
        future_6h_risk = future_prediction.get("future_6h_risk", "NORMAL")
        future_6h_probability = future_prediction.get("future_6h_probability", 0.0)
        early_warning = bool(future_prediction.get("early_warning", False))

        node_predictions[data_dict["node_id"]].update({
            "future_4h_risk": future_4h_risk,
            "future_4h_probability": future_4h_probability,
            "future_6h_risk": future_6h_risk,
            "future_6h_probability": future_6h_probability,
            "early_warning": early_warning,
            "estimated_time_window": "approximately 4-6 hours",
        })

        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO forecast_history (
                node_id,
                prediction_timestamp,
                horizon_hours,
                predicted_risk,
                probability,
                early_warning
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data_dict["node_id"],
            data_dict["timestamp_utc"],
            4,
            future_4h_risk,
            future_4h_probability,
            int(early_warning)
        ))
        cursor.execute("""
            INSERT INTO forecast_history (
                node_id,
                prediction_timestamp,
                horizon_hours,
                predicted_risk,
                probability,
                early_warning
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data_dict["node_id"],
            data_dict["timestamp_utc"],
            6,
            future_6h_risk,
            future_6h_probability,
            int(early_warning)
        ))
        conn.commit()
        conn.close()

        # ==========================================
        # 13. SAVE CURRENT READING FOR NEXT CYCLE
        # ==========================================

        previous_readings[data_dict["node_id"]] = {
            "displacement_mm": data_dict["displacement_mm"],
            "crack_width_mm": data_dict["crack_width_mm"],
            "timestamp": current_time
        }

        # Log the prediction
        print(f"[PREDICT] {data_dict['node_id']}: {str(prediction)} ({probability_percent}%) @ {data_dict['timestamp_utc']}")
        print(f"[FUTURE] {data_dict['node_id']}: +4h={future_4h_risk} ({future_4h_probability:.2f}%), +6h={future_6h_risk} ({future_6h_probability:.2f}%), early_warning={early_warning}")

        return {
            "node_id": data_dict["node_id"],
            "risk_level": str(prediction),
            "probability": probability_percent,
            "calculated_features": calculated_features,
            "current_risk": str(prediction),
            "current_probability": probability_percent,
            "future_4h_risk": future_4h_risk,
            "future_4h_probability": future_4h_probability,
            "future_6h_risk": future_6h_risk,
            "future_6h_probability": future_6h_probability,
            "early_warning": early_warning,
            "estimated_time_window": "approximately 4-6 hours",
        }

    except Exception as e:
        print(f"[PREDICT] Error processing {data_dict.get('node_id', 'UNKNOWN')}: {e}")
        raise


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)


@app.post("/predict")
def predict(data: SensorData):
    """HTTP endpoint for sensor prediction. Delegates to _predict_and_store."""
    data_dict = {
        "node_id": data.node_id,
        "timestamp_utc": data.timestamp_utc,
        "tilt_x_deg": data.tilt_x_deg,
        "tilt_y_deg": data.tilt_y_deg,
        "displacement_mm": data.displacement_mm,
        "vibration_g": data.vibration_g,
        "crack_width_mm": data.crack_width_mm,
    }
    
    return _predict_and_store(data_dict)


@app.get("/forecast")
def get_future_forecast(node_id: str | None = None):
    """Return future-risk forecast information for one node or all tracked nodes."""
    records = []
    if node_id is not None:
        record = node_predictions.get(node_id)
        if record:
            records.append({
                "node_id": node_id,
                "current_risk": record.get("risk_level", "NORMAL"),
                "current_probability": record.get("probability", 0.0),
                "future_4h_risk": record.get("future_4h_risk", "NORMAL"),
                "future_4h_probability": record.get("future_4h_probability", 0.0),
                "future_6h_risk": record.get("future_6h_risk", "NORMAL"),
                "future_6h_probability": record.get("future_6h_probability", 0.0),
                "early_warning": bool(record.get("early_warning", False)),
                "estimated_time_window": record.get("estimated_time_window", "approximately 4-6 hours"),
            })
        return {"forecast": records, "count": len(records)}

    for node in node_predictions.values():
        records.append({
            "node_id": node.get("node_id"),
            "current_risk": node.get("risk_level", "NORMAL"),
            "current_probability": node.get("probability", 0.0),
            "future_4h_risk": node.get("future_4h_risk", "NORMAL"),
            "future_4h_probability": node.get("future_4h_probability", 0.0),
            "future_6h_risk": node.get("future_6h_risk", "NORMAL"),
            "future_6h_probability": node.get("future_6h_probability", 0.0),
            "early_warning": bool(node.get("early_warning", False)),
            "estimated_time_window": node.get("estimated_time_window", "approximately 4-6 hours"),
        })

    return {"forecast": records, "count": len(records)}