# ⛏️ MineSense 6.0
## AI-Powered Real-Time Mine Subsidence Monitoring, Prediction & Early Warning System

<p align="center">
  <b>Smart India Hackathon 2026 · SIH26025</b><br>
  <i>Low-Cost • Real-Time • AI-Powered • Scalable Mine Safety</i>
</p>

<p align="center">

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.141.1-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.3.3-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Scikit--learn](https://img.shields.io/badge/Scikit--learn-Random%20Forest-F7931E?logo=scikit-learn&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-3.0.5-150458?logo=pandas&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-2.5.2-013243?logo=numpy&logoColor=white)
![Joblib](https://img.shields.io/badge/Joblib-Model%20Loading-5A5A5A)
![SQLite](https://img.shields.io/badge/SQLite-Local%20Buffer-003B57?logo=sqlite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Cloud%20Database-4169E1?logo=postgresql&logoColor=white)
![Render](https://img.shields.io/badge/Render-Deployment-46E3B7?logo=render&logoColor=black)

</p>

---

## 🚨 Problem

Underground coal mining can lead to gradual ground deformation and mine subsidence. Changes in ground behavior may appear as abnormal **tilt/inclination, displacement, vibration, and crack/deformation changes** before a situation becomes critical.

MineSense is designed to continuously monitor distributed sensing points, identify abnormal changes, estimate current and future risk, visualize high-risk areas, and provide early-warning decision support through a low-cost and modular architecture.

---

# 🎯 SIH26025 Alignment

**Problem Statement:** Development of an AI-enabled Low Cost Real Time Mine Subsidence Monitoring, Prediction and Early Warning System for Underground Coal Mines in India.

| PS Requirement | MineSense Approach | Status |
|---|---|---|
| Low-cost distributed nodes | ESP32-based low-cost node architecture | 🟢 Implemented |
| Tilt / inclination | MPU6050 → Tilt X, Tilt Y, Tilt Magnitude | 🟢 Implemented in hardware prototype |
| Displacement | Distance/displacement sensing and derived features | 🟢 Implemented in hardware prototype |
| Vibration | SW-420 vibration sensing concept | 🟢 Implemented in hardware prototype |
| Crack/deformation | Crack-width/deformation feature; potentiometer as prototype representation | 🟢 Implemented in hardware prototype |
| Wireless surface WSN | LoRa-based multi-hop/tree-routing architecture | 🟢 Implemented |
| Node-to-node communication | Dynamic parent/next-hop toward gateway | 🟢 Implemented |
| Real-time processing | FastAPI backend + simulator | 🟢 Implemented |
| Abnormal-pattern detection | Feature engineering + Random Forest | 🟢 Implemented |
| Current risk classification | Normal / Watch / Warning / Critical | 🟢 Implemented |
| Future-risk prediction | Approx. 4-hour and 6-hour models | 🟢 Implemented |
| Risk-zone visualization | Node/zone risk visualization | 🟢 Implemented |
| Early-warning dashboard | Risk, alerts and high-risk-node views | 🟢 Implemented |
| Historical data | SQLite + cloud PostgreSQL | 🟢 Implemented |
| Offline-friendly operation | Local buffering + cloud synchronization | 🟢 Implemented |
| GIS/spatial visualization | Node-location/risk visualization architecture | 🟡 Enhancement |
| GPS localization | Latitude/longitude for node localization | 🟢 Implemented |
| SMS notification | External alert-service integration | 🟢 Implemented |
| Multi-coalfield scalability | Modular API/database/node architecture | 🟡 Architecture |
| Low-power field deployment | Low-power hardware architecture | 🟡 Validation pending |
| Field validation | Real mine-data calibration/testing | ⚪ Not yet validated |

> **Transparency:** The MineSense hardware prototype is completed, including wireless LoRa surface networking and node-to-node communication. GPS localization and SMS notification are also integrated. The deployed software platform currently runs in software-simulator mode for the online demonstration.

---

# 🧠 Core Idea

MineSense moves the monitoring workflow from:

**Observe → React**

toward:

**Sense → Analyze → Predict → Warn → Act**

The system combines multiple deformation-related parameters rather than relying on a single sensor.

---

# 🏗️ Architecture

## Current Deployed Demo

```text
8-Node Software Simulator
          ↓
     FastAPI Backend
          ↓
   Feature Engineering
          ↓
     Random Forest ML
          ↓
 Current + Future Risk
          ↓
   SQLite Local History
          ↓
 PostgreSQL Cloud Storage
          ↓
    Next.js Dashboard
          ↓
   Early-Warning Alerts
```

## Target Hardware Architecture

```text
ESP32 + Sensors + LoRa
          ↓
Wireless WSN / Multi-Hop
          ↓
       Gateway
          ↓
Internet / Network
          ↓
     Cloud Backend
      ↙         ↘
    AI/ML     PostgreSQL
      ↘         ↙
      Dashboard
          ↓
   Early Warning
```

---

# 🌐 Wireless Sensor Network

### Tree-Based Dynamic Parent Selection

**1. Wireless Node-to-Node Multi-Hop**

Sensor nodes communicate wirelessly through nearby parent/next-hop nodes toward the gateway.

**2. Dynamic Parent Selection**

A node can select a suitable parent using:

```text
Link Quality / RSSI
        +
    Hop Count
        +
 Node Availability
```

**3. Reliable Transmission**

Routing can adapt to changing node/link conditions to support reliable real-time communication while reducing unnecessary transmissions.

> The physical multi-hop LoRa network is an integration-stage component; the current deployed demo uses a software simulator.

---

# 🔬 Sensors & Parameters

| Component | Main Role |
|---|---|
| MPU6050 | Tilt / inclination |
| HC-SR04 | Distance / displacement prototype |
| SW-420 | Vibration detection |
| Potentiometer | Prototype crack/stretch representation |
| LoRa module | Wireless communication |
| ESP32 | Node controller |
| OLED | Local status display |
| LED / Buzzer | Local warning indication |

### Core Subsidence Parameters

- **Tilt X (°)**
- **Tilt Y (°)**
- **Tilt Magnitude (°)**
- **Displacement (mm)**
- **Displacement Change (mm)**
- **Displacement Rate (mm/hour)**
- **Vibration (g)**
- **Crack Width (mm)**
- **Crack Change (mm)**
- **Relative displacement vs. network mean**

GPS, RSSI, battery and similar values are supporting information rather than core subsidence measurements.

---

# 🤖 AI / ML

MineSense uses **Random Forest** for current risk classification.

### Why Random Forest?

- Suitable for structured sensor/tabular data
- Captures non-linear relationships
- Handles interacting features
- Robust for prototype sensor data
- Practical for real-time inference

### ML Features

```text
tilt_x_deg
tilt_y_deg
tilt_magnitude_deg
displacement_mm
displacement_change_mm
displacement_rate_mm_per_hour
distance_to_neighbor_m
vibration_g
crack_width_mm
crack_change_mm
displacement_vs_network_mean_mm
```

### Risk Classes

```text
🟢 NORMAL
🟡 WATCH
🟠 WARNING
🔴 CRITICAL
```

---

# 🔮 Future-Risk Prediction

Separate models provide approximately:

- **4-hour future-risk prediction**
- **6-hour future-risk prediction**

This extends the system from:

> **“What is happening now?”**

to:

> **“How could the risk evolve?”**

These are prototype predictions and require real mine-data calibration and field validation before operational safety use.

---

# 📊 Dashboard

The web dashboard provides:

- Real-time node monitoring
- Current risk levels
- Risk probability
- Tilt/displacement/vibration/crack readings
- Highest-risk node
- Alerts
- Historical trends
- Future forecasts
- Risk zones
- Node-level information
- REST API integration

### Decision-support flow

```text
Sensor Data
    ↓
Feature Engineering
    ↓
AI Risk Prediction
    ↓
Risk Level
    ↓
High-Risk Node / Zone
    ↓
Early Warning
    ↓
Operator Decision Support
```

MineSense does **not** claim that software can physically stop subsidence. Its role is to detect abnormal behavior early and provide information that can support appropriate engineering and operational action.

---

# 🗄️ Data & Cloud

## SQLite — Local Buffer

Used for:

- Local history
- Temporary buffering
- Offline-friendly operation
- Continued collection during temporary connectivity issues

## PostgreSQL — Cloud Database

Used for:

- Centralized historical data
- Sensor history
- Forecast history
- Cloud persistence
- Future scalability

### Synchronization

```text
Local Data
    ↓
SQLite Buffer
    ↓
Cloud Sync Worker
    ↓
PostgreSQL
    ↓
Dashboard / Analytics
```

The current deployment uses **Render-hosted PostgreSQL**.

---

# ☁️ Deployment

### Live Frontend
https://minesense-6-0.onrender.com

### Backend API
https://minesense-backend.onrender.com

### API Documentation
https://minesense-backend.onrender.com/docs

### Deployment Flow

```text
GitHub
  ├──→ Render Frontend → Next.js
  │
  └──→ Render Backend  → FastAPI + ML
                              ↓
                         PostgreSQL
```

---

# 🔌 API

| Endpoint | Purpose |
|---|---|
| `GET /nodes` | Current node information |
| `GET /alerts` | Current alerts |
| `GET /zones` | Risk-zone information |
| `GET /history` | Historical sensor data |
| `GET /forecast` | Future-risk forecasts |
| `POST /predict` | ML risk prediction |

Interactive Swagger documentation is available through the deployed `/docs` endpoint.

---

# 🧪 Dataset & Model Pipeline

The prototype dataset contains **30,000 records and 16 columns**, covering timestamp/node information, deformation measurements, vibration, crack measurements, network-relative displacement and risk labels.

```text
Raw Sensor Data
      ↓
Data Cleaning
      ↓
Feature Engineering
      ↓
Feature Selection
      ↓
Random Forest Training
      ↓
Model Export with Joblib
      ↓
FastAPI Prediction API
      ↓
Dashboard
```

---

# 🔧 Hardware Prototype

The physical node is designed around an **ESP32**.

### Main hardware

- ESP32
- MPU6050
- HC-SR04
- SW-420
- Potentiometer for prototype crack/stretch representation
- LoRa module
- OLED display
- LEDs
- Buzzer
- Push button
- Optional GPS module for localization

### Node workflow

```text
Sensors
   ↓
ESP32
   ↓
Read + Process Data
   ↓
Create Sensor Packet
   ↓
LoRa / WSN
   ↓
Gateway
```

---

# 📍 GPS Localization Enhancement

GPS is a **supporting localization feature**, not a core subsidence sensor.

It can provide:

```text
Node ID
Latitude
Longitude
Timestamp
Risk Level
```

This enables the system to answer:

**WHAT is happening?**  
→ Tilt, displacement, vibration and crack/deformation

**WHERE is it happening?**  
→ Node coordinates

This can support map-based visualization of high-risk nodes and zones.

---

# 📱 Alerting Roadmap

The current dashboard provides software-based risk alerts.

A future external-notification workflow can be:

```text
AI Detects High Risk
        ↓
 WARNING / CRITICAL
        ↓
    Alert Engine
       ↙    ↘
 Dashboard   SMS
```

SMS credentials should remain server-side and be stored through environment variables.

---

# ⚡ Offline-Friendly Design

```text
Internet Available
      ↓
Cloud Sync
```

If connectivity is temporarily unavailable:

```text
Sensor Data
    ↓
SQLite Local Buffer
    ↓
Continue Monitoring
    ↓
Connection Restored
    ↓
PostgreSQL Synchronization
```

This supports deployment in environments where connectivity may not always be stable.

---

# 📈 Scalability

### Current demonstration

```text
8 Sensor Nodes
      ↓
  Backend
      ↓
 Cloud Database
```

### Scaled concept

```text
Many Sensor Nodes
       ↓
Multiple Gateways
       ↓
Mine / Coalfield Backend
       ↓
Central Cloud Database
       ↓
Multi-Mine Dashboard
```

The software identifies records by `node_id`, allowing additional nodes to be added without redesigning the complete monitoring platform.

---

# 💰 Low-Cost & Modular Design

The prototype uses commonly available components and modular sensing.

```text
ESP32
 + MPU6050
 + Displacement Sensor
 + Vibration Sensor
 + Crack/Deformation Prototype
 + LoRa
```

Modules can be replaced or upgraded independently.

> Prototype cost is not equivalent to industrial deployment cost. Field deployment would require suitable environmental protection, industrial-grade sensing where necessary, reliable power, communication infrastructure, installation, calibration and validation.

---

# 🌱 Expected Impact

MineSense aims to support:

- Earlier identification of abnormal ground behavior
- Better awareness of high-risk zones
- Continuous distributed monitoring
- Data-driven historical analysis
- Targeted inspection and preventive decision support
- Scalable monitoring architecture
- Reduced dependence on isolated/manual observations

---

# 🧭 Development Roadmap

## ✅ Software Completed

- 8-node simulator
- FastAPI backend
- Random Forest current-risk model
- 4-hour prediction
- 6-hour prediction
- Feature engineering
- Risk classification
- Alerts
- Historical data
- SQLite storage
- PostgreSQL cloud storage
- Cloud synchronization
- Next.js dashboard
- REST API
- Render deployment

## 🔄 Hardware Integration

- ESP32 sensor integration
- MPU6050 tilt/inclination
- HC-SR04 displacement prototype
- SW-420 vibration sensing
- Crack/stretch prototype sensing
- LoRa communication
- OLED/LED/buzzer local alerts

## 🚀 Planned Enhancements

- Physical multi-hop LoRa WSN
- Gateway integration
- MQTT transport
- GPS node localization
- GIS/map visualization
- 3D node/deformation visualization
- SMS notifications
- Power optimization
- Larger-node deployment
- Real mine-data calibration
- Field testing and validation

---

# ⚠️ Current Limitations

MineSense is a **hackathon prototype**, not a certified mine-safety product.

Current limitations include:

1. The deployed demo runs in simulator mode.
2. Physical LoRa multi-hop routing is not yet fully field-tested.
3. MQTT is planned for the physical gateway-to-cloud path and is not required by the current simulator.
4. GPS is a supporting localization enhancement.
5. The potentiometer represents crack/stretch variation in the prototype; it is not an industrial crack-width sensor.
6. ML predictions require real mine data for field calibration.
7. The system has not been certified for operational mine safety.
8. Thresholds and predictions should not be treated as engineering safety limits without validation.

---

# 🎬 Demonstration Flow

```text
1. Sensor Node
       ↓
2. Tilt / Displacement / Vibration / Crack Data
       ↓
3. Wireless LoRa WSN
       ↓
4. Gateway
       ↓
5. Cloud Backend
       ↓
6. Feature Engineering
       ↓
7. AI/ML Risk Prediction
       ↓
8. Current + Future Risk
       ↓
9. Risk Zones
       ↓
10. Early Warning
       ↓
11. Operator Decision Support
```

### Core message

> **Detect abnormal ground behavior early. Locate the risk. Predict how it may evolve. Warn responsible personnel in time to act.**

---

# 🛠️ Local Setup

## Backend

```bash
python -m venv .venv
```

### Windows

```bash
.venv\Scripts ctivate
```

### Linux / macOS

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run:

```bash
uvicorn Backend.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

## Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Configure:

```text
NEXT_PUBLIC_API_URL
```

Example:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

# 🔐 Security

Never commit:

- Passwords
- API keys
- Database credentials
- MQTT credentials
- SMS provider secrets
- Private environment files

Use environment variables for deployment secrets.

---

# 📂 Project Structure

```text
MineSense_6.0/
│
├── Backend/
│   ├── main.py
│   └── ...
│
├── Frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── ...
│
├── ML/
│   ├── subsidence_model.pkl
│   ├── models/
│   │   ├── future_4h_model.joblib
│   │   └── future_6h_model.joblib
│   └── ...
│
├── data/
│   └── SIH26025_ML_READY_DATASET.csv
│
├── requirements.txt
├── .gitignore
└── README.md
```

---

# 🤝 Project Information

**Project:** MineSense 6.0  
**SIH Problem Statement:** SIH26025  
**Focus:** Mine Subsidence Monitoring, Prediction & Early Warning  
**Core Technologies:** IoT • WSN • AI/ML • FastAPI • Next.js • PostgreSQL  
**Deployment:** Render

---

## 🔗 Project Links

- **Live Frontend:** https://minesense-6-0.onrender.com
- **Backend API:** https://minesense-backend.onrender.com
- **API Docs:** https://minesense-backend.onrender.com/docs
- **GitHub:** Add your repository URL here

---

<p align="center">
  <b>⛏️ MineSense 6.0</b><br>
  <i>Sense • Analyze • Predict • Warn</i>
</p>
