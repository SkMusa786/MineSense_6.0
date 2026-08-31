from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

DATASET_PATH = Path(__file__).resolve().parent.parent / "Data" / "SIH26025_ML_READY_DATASET.csv"
MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_DIR.mkdir(exist_ok=True)

RISK_ORDER = ["NORMAL", "WATCH", "WARNING", "CRITICAL"]

CORE_FEATURES = [
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
    "displacement_vs_network_mean_mm",
]

ROLLING_WINDOWS = [3, 6, 12, 24]
ROLLING_TRENDS = [6, 12, 24]

FUTURE_FEATURE_COLUMNS: list[str] = []
for feature in CORE_FEATURES:
    FUTURE_FEATURE_COLUMNS.append(feature)
for window in ROLLING_WINDOWS:
    FUTURE_FEATURE_COLUMNS.append(f"displacement_mean_{window}")
    FUTURE_FEATURE_COLUMNS.append(f"crack_mean_{window}")
    FUTURE_FEATURE_COLUMNS.append(f"vibration_mean_{window}")
    FUTURE_FEATURE_COLUMNS.append(f"tilt_magnitude_mean_{window}")
    FUTURE_FEATURE_COLUMNS.append(f"displacement_max_{window}")
for window in ROLLING_TRENDS:
    FUTURE_FEATURE_COLUMNS.append(f"displacement_trend_{window}")
    FUTURE_FEATURE_COLUMNS.append(f"crack_trend_{window}")
    FUTURE_FEATURE_COLUMNS.append(f"vibration_trend_{window}")
    FUTURE_FEATURE_COLUMNS.append(f"tilt_magnitude_trend_{window}")


def compute_rolling_mean(series: pd.Series, window: int) -> float:
    if len(series) == 0:
        return 0.0
    window = min(window, len(series))
    return float(series.iloc[-window:].mean())


def compute_rolling_max(series: pd.Series, window: int) -> float:
    if len(series) == 0:
        return 0.0
    window = min(window, len(series))
    return float(series.iloc[-window:].max())


def compute_trend(series: pd.Series, window: int) -> float:
    if len(series) < 2:
        return 0.0
    window = min(window, len(series))
    subset = series.iloc[-window:]
    return float(subset.iloc[-1] - subset.iloc[0])


def prepare_future_dataset(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy().sort_values(["node_id", "timestamp_utc"]).reset_index(drop=True)
    out["timestamp_utc"] = pd.to_datetime(out["timestamp_utc"])
    out["tilt_magnitude_deg"] = np.hypot(out["tilt_x_deg"], out["tilt_y_deg"])

    for window in ROLLING_WINDOWS:
        out[f"displacement_mean_{window}"] = (
            out.groupby("node_id")["displacement_mm"]
            .transform(lambda s: s.shift(1).rolling(window, min_periods=1).mean())
        )
        out[f"crack_mean_{window}"] = (
            out.groupby("node_id")["crack_width_mm"]
            .transform(lambda s: s.shift(1).rolling(window, min_periods=1).mean())
        )
        out[f"vibration_mean_{window}"] = (
            out.groupby("node_id")["vibration_g"]
            .transform(lambda s: s.shift(1).rolling(window, min_periods=1).mean())
        )
        out[f"tilt_magnitude_mean_{window}"] = (
            out.groupby("node_id")["tilt_magnitude_deg"]
            .transform(lambda s: s.shift(1).rolling(window, min_periods=1).mean())
        )
        out[f"displacement_max_{window}"] = (
            out.groupby("node_id")["displacement_mm"]
            .transform(lambda s: s.shift(1).rolling(window, min_periods=1).max())
        )

    for window in ROLLING_TRENDS:
        out[f"displacement_trend_{window}"] = (
            out.groupby("node_id")["displacement_mm"]
            .transform(lambda s: s.shift(1).rolling(window, min_periods=2).apply(lambda x: float(x[-1] - x[0]), raw=True))
        )
        out[f"crack_trend_{window}"] = (
            out.groupby("node_id")["crack_width_mm"]
            .transform(lambda s: s.shift(1).rolling(window, min_periods=2).apply(lambda x: float(x[-1] - x[0]), raw=True))
        )
        out[f"vibration_trend_{window}"] = (
            out.groupby("node_id")["vibration_g"]
            .transform(lambda s: s.shift(1).rolling(window, min_periods=2).apply(lambda x: float(x[-1] - x[0]), raw=True))
        )
        out[f"tilt_magnitude_trend_{window}"] = (
            out.groupby("node_id")["tilt_magnitude_deg"]
            .transform(lambda s: s.shift(1).rolling(window, min_periods=2).apply(lambda x: float(x[-1] - x[0]), raw=True))
        )

    out = out.replace([np.inf, -np.inf], np.nan).fillna(0.0)
    return out


def add_future_targets(df: pd.DataFrame, horizon_hours: int) -> pd.DataFrame:
    steps = int((horizon_hours * 60) / 5)
    target_name = f"future_{horizon_hours}h_risk"
    df[target_name] = df.groupby("node_id")["risk_level"].transform(lambda s: s.shift(-steps))
    df = df.dropna(subset=[target_name]).copy()
    return df


def evaluate_model(y_true: pd.Series, y_pred: np.ndarray, y_prob: np.ndarray | None = None) -> dict:
    metrics = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision_macro": precision_score(y_true, y_pred, average="macro", zero_division=0),
        "recall_macro": recall_score(y_true, y_pred, average="macro", zero_division=0),
        "f1_macro": f1_score(y_true, y_pred, average="macro", zero_division=0),
        "precision_weighted": precision_score(y_true, y_pred, average="weighted", zero_division=0),
        "recall_weighted": recall_score(y_true, y_pred, average="weighted", zero_division=0),
        "f1_weighted": f1_score(y_true, y_pred, average="weighted", zero_division=0),
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=RISK_ORDER).tolist(),
    }
    if y_prob is not None:
        try:
            metrics["roc_auc_ovr_macro"] = roc_auc_score(
                y_true,
                y_prob,
                multi_class="ovr",
                average="macro",
                labels=RISK_ORDER,
            )
        except ValueError:
            metrics["roc_auc_ovr_macro"] = None
    return metrics


def train_future_model(horizon_hours: int) -> dict:
    df = pd.read_csv(DATASET_PATH)
    prepared = prepare_future_dataset(df)
    prepared = add_future_targets(prepared, horizon_hours)

    if prepared.empty:
        raise ValueError(f"No valid samples available for +{horizon_hours}h target generation")

    feature_columns = [col for col in FUTURE_FEATURE_COLUMNS if col in prepared.columns]
    X = prepared[feature_columns]
    y = prepared[f"future_{horizon_hours}h_risk"]

    total_rows = len(prepared)
    train_end = int(total_rows * 0.7)
    val_end = int(total_rows * 0.85)

    X_train = X.iloc[:train_end]
    X_val = X.iloc[train_end:val_end]
    X_test = X.iloc[val_end:]

    y_train = y.iloc[:train_end]
    y_val = y.iloc[train_end:val_end]
    y_test = y.iloc[val_end:]

    model = RandomForestClassifier(
        n_estimators=250,
        random_state=42,
        class_weight="balanced",
        min_samples_leaf=2,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    val_pred = model.predict(X_val)
    val_prob = model.predict_proba(X_val)
    test_pred = model.predict(X_test)
    test_prob = model.predict_proba(X_test)

    val_metrics = evaluate_model(y_val, val_pred, val_prob)
    test_metrics = evaluate_model(y_test, test_pred, test_prob)

    model_path = MODEL_DIR / f"future_{horizon_hours}h_model.joblib"
    joblib.dump(model, model_path)

    metadata = {
        "horizon_hours": horizon_hours,
        "feature_columns": feature_columns,
        "train_samples": int(len(X_train)),
        "val_samples": int(len(X_val)),
        "test_samples": int(len(X_test)),
        "risk_order": RISK_ORDER,
        "validation_metrics": val_metrics,
        "test_metrics": test_metrics,
    }
    with (MODEL_DIR / f"future_{horizon_hours}h_metadata.json").open("w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return metadata


def main() -> None:
    print("Training future risk models for +4h and +6h horizons...")
    print("Using chronological split without random shuffling.")

    metadata_4h = train_future_model(4)
    metadata_6h = train_future_model(6)

    print("\n=== 4H MODEL ===")
    print(json.dumps(metadata_4h["test_metrics"], indent=2, default=str))
    print("\n=== 6H MODEL ===")
    print(json.dumps(metadata_6h["test_metrics"], indent=2, default=str))

    print(f"\nSaved models to: {MODEL_DIR}")


if __name__ == "__main__":
    main()
