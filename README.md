# MineSense 6.0 – AI-Powered Real-Time Mine Subsidence Monitoring & Early Warning System

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.141.1-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.3.3-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Scikit--learn](https://img.shields.io/badge/Scikit--learn-Random%20Forest-F7931E?logo=scikit-learn&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-3.0.5-150458?logo=pandas&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-2.5.2-013243?logo=numpy&logoColor=white)
![Joblib](https://img.shields.io/badge/Joblib-Model%20Loading-5A5A5A)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white)
![Render](https://img.shields.io/badge/Render-Deployment-46E3B7?logo=render&logoColor=black)

## Overview

**MineSense** is an AI-powered mine safety system that continuously monitors ground-deformation conditions across **8 sensor nodes**, analyzes sensor data using **Random Forest machine-learning models**, predicts current and future subsidence risk, and provides **early-warning alerts** through a real-time web dashboard.

The current deployed hackathon demo runs in **simulator mode**. It uses an integrated 8-node software simulator to generate changing sensor readings without requiring MQTT or an external broker.

## Live Demo

**Frontend:**  
https://minesense-6-0.onrender.com

**Backend API:**  
https://minesense-backend.onrender.com

**API Documentation:**  
https://minesense-backend.onrender.com/docs

## Key Features

- Real-time monitoring of **8 nodes: N01–N08**
- Tilt monitoring
- Displacement monitoring
- Vibration monitoring
- Crack-width monitoring
- Current subsidence-risk classification
- Risk probability estimation
- Future-risk prediction for approximately **4 hours and 6 hours**
- Early-warning detection
- Highest-risk node identification
- Historical sensor and prediction data
- Real-time dashboard
- REST API
- Risk alerts and forecasts

## System Architecture

```text
8-Node Real-Time Simulator
            ↓
      FastAPI Backend
            ↓
     Feature Engineering
            ↓
       Random Forest ML
            ↓
 Current + Future Risk Prediction
            ↓
      SQLite Historical Data
            ↓
       Next.js Dashboard
            ↓
       Early-Warning Alerts
