![Python](https://img.shields.io/badge/Python-3.x-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Scikit-learn](https://img.shields.io/badge/Scikit--learn-Random%20Forest-F7931E?logo=scikit-learn&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-Data%20Processing-150458?logo=pandas&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-Data%20Processing-013243?logo=numpy&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white)
![Render](https://img.shields.io/badge/Render-Deployment-46E3B7?logo=render&logoColor=black)





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
