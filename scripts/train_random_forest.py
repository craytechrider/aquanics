"""Train AQUANICS 1-7 day Random Forest growth forecasts from a Firebase RTDB export.

Usage:
  python scripts/train_random_forest.py path/to/firebase-export.json \
    --output frontend/public/randomForestModel.json

The export must contain growthMeasurements/fish, growthMeasurements/crop, and
sensors/{ph,waterTemp,ammonia,do}. Do not use demo-trained results for farm decisions.
"""
import argparse
import json
from pathlib import Path
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error


def sensor_daily_mean(root, sensor, date):
    day = root.get("sensors", {}).get(sensor, {}).get(date)
    if not isinstance(day, dict):
        return float("nan")
    values = []
    for raw in day.values():
        try:
            value = float(raw)
            if np.isfinite(value):
                values.append(value)
        except (TypeError, ValueError):
            pass
    return float(np.mean(values)) if values else float("nan")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("firebase_export", type=Path)
    parser.add_argument("--output", type=Path, default=Path("frontend/public/randomForestModel.json"))
    parser.add_argument("--data-label", default="UNVERIFIED DATA - inspect source before deployment")
    args = parser.parse_args()
    root = json.loads(args.firebase_export.read_text(encoding="utf-8"))
    growth = root.get("growthMeasurements", {})
    fish_data = growth.get("fish", {})
    crop_data = growth.get("crop", {})
    # Firebase keys may be generated push IDs or names like growth_YYYY-MM-DD.
    # Align records using the explicit date field instead of assuming keys are dates.
    
    fish_records = {
        str(v.get("date")): v 
        for v in fish_data.values() 
        if isinstance(v, dict) and v.get("date")}
    
    crop_records = {
        str(v.get("date")): v 
        for v in crop_data.values() 
        if isinstance(v, dict) and v.get("date")}
    dates = sorted(set(fish_records) & set(crop_records))


    if len(dates) < 20:
        raise SystemExit(f"Need at least 20 matching fish/crop daily records; found {len(dates)}.")

    fish = {d: float(fish_records[d].get("averageWeight", 0)) for d in dates}
    crop = {d: float(crop_records[d].get("height", crop_records[d].get("heightCm", 0))) for d in dates}
    if any(v <= 0 for v in fish.values()) or any(v <= 0 for v in crop.values()):
        raise SystemExit("Fish weights and crop heights must be positive numbers.")

    rows = []
    for i, date in enumerate(dates):
        def slope(values, back):
            j = max(0, i - back)
            return (values[date] - values[dates[j]]) / max(i - j, 1)
        rows.append([
            fish[date], slope(fish, 3), slope(fish, 7),
            crop[date], slope(crop, 3), slope(crop, 7), i,
            sensor_daily_mean(root, "ph", date),
            sensor_daily_mean(root, "waterTemp", date),
            sensor_daily_mean(root, "ammonia", date),
            sensor_daily_mean(root, "do", date),
        ])
    X = np.asarray(rows, dtype=float)
    for col in range(X.shape[1]):
        missing = ~np.isfinite(X[:, col])
        if missing.any():
            X[missing, col] = np.nanmedian(X[:, col]) if np.isfinite(X[:, col]).any() else 0

    names = ["fishWeightNow", "fishSlope3d", "fishSlope7d", "cropHeightNow", "cropSlope3d", "cropSlope7d", "dayIndex", "phDailyMean", "waterTempDailyMean", "ammoniaDailyMean", "dissolvedOxygenDailyMean"]
    result = {"modelType": "RandomForestRegressor", "modelVersion": 1, "trainingData": args.data_label, "trainedThrough": dates[-1], "featureNames": names, "trainingDates": dates, "metrics": {}, "models": {}}
    for kind, values in [("fish", fish), ("crop", crop)]:
        for horizon in range(1, 8):
            indices = np.arange(0, len(dates) - horizon)
            y = np.asarray([values[dates[i + horizon]] for i in indices])
            xh = X[indices]
            split = max(10, int(len(indices) * 0.8))
            evaluation = RandomForestRegressor(n_estimators=80, max_depth=4, min_samples_leaf=2, random_state=42, n_jobs=-1)
            evaluation.fit(xh[:split], y[:split])
            heldout = evaluation.predict(xh[split:]) if split < len(indices) else np.array([])
            mae = float(mean_absolute_error(y[split:], heldout)) if len(heldout) else None
            model = RandomForestRegressor(
                n_estimators=80, 
                max_depth=4, 
                min_samples_leaf=2, 
                random_state=42, 
                n_jobs=-1)
            model.fit(xh, y)
            trees = []
            for estimator in model.estimators_:
                tree = estimator.tree_
                trees.append({"left": tree.children_left.tolist(), "right": tree.children_right.tolist(), "feature": tree.feature.tolist(), "threshold": np.round(tree.threshold, 8).tolist(), "value": np.round(tree.value[:, 0, 0], 8).tolist()})
            key = f"{kind}_{horizon}d"
            result["metrics"][key] = {"mae": round(mae, 4) if mae is not None else None, "testSamples": int(len(heldout)), "trainingSamples": int(len(indices))}
            result["models"][key] = {"trees": trees, "maeHoldout": round(mae, 4) if mae is not None else None, "testSamples": int(len(heldout)), "trainingSamples": int(len(indices))}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, separators=(",", ":")), encoding="utf-8")
    print(f"Saved model: {args.output}")
    print(f"Training records: {len(dates)}; final date: {dates[-1]}")
    print("Holdout MAE is only a small chronological test; it is not proof of production accuracy.")

if __name__ == "__main__":
    main()
