MineSense 6.0

AI-Enabled Smart Mine Subsidence Monitoring & Early Warning System

MineSense 6.0 is a student-friendly AI + IoT platform for real-time mine subsidence monitoring and early warning. It uses 8 simulated sensor nodes to monitor four parameters: tilt, displacement, vibration, and crack width.

Main Workflow

8 Sensor Nodes
      ↓
MQTT / IoT Gateway
      ↓
FastAPI Backend
      ↓
Feature Engineering + Random Forest ML
      ↓
Risk & Future Prediction
      ↓
SQLite Historical Data
      ↓
Next.js Dashboard
      ↓
Early Warning

Key Features

8-node (sensor network simulation)

1.Real-time MQTT data flow

2.Tilt, displacement, vibration and crack-width monitoring

3.Random Forest based current and future risk prediction

4.Risk levels: Normal, Watch, Warning, Critical

5.Historical data storage and trend analysis

6.Interactive web dashboard

7.Scalable architecture for future physical sensor deployment

Current Status

The complete software prototype works locally using simulated MQTT sensor data.

Cloud demonstration deployments:

Frontend: https://minesense-6-0.onrender.com

Backend: https://minesense-backend.onrender.com

API Docs: https://minesense-backend.onrender.com/docs

For full real-world deployment, sensor_publisher.py must be replaced/connected to a physical sensor gateway and secured MQTT infrastructure so real-time field data can reach the cloud backend.

Run Locally

Terminal 1 – Backend

cd Backend
py -3.12 -m uvicorn main:app --host 127.0.0.1 --port 8001

Terminal 2 – Sensor Publisher

cd Backend
py -3.12 sensor_publisher.py

Terminal 3 – Frontend

cd Frontend
npm run dev

Open: http://localhost:3000

Innovation

Wireless Surface Mesh Network for Real-Time Subsidence Detection

MineSense combines distributed sensing, MQTT communication, AI/ML prediction and dashboard visualization to identify abnormal ground movement and support early safety decisions.

Future Deployment

The next stage is to integrate ESP32/low-cost sensor nodes + wireless mesh/LoRa/Zigbee/Wi-Fi gateway + production MQTT broker, followed by field calibration and validation.

Detect Early. Predict Intelligently. Protect Safely.
