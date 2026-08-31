import paho.mqtt.client as mqtt
import requests
import json

# MQTT settings
BROKER = "127.0.0.1"
PORT = 1883
TOPIC = "mine/sensors"

# FastAPI endpoint
FASTAPI_URL = "http://127.0.0.1:8000/predict"


def on_connect(client, userdata, flags, reason_code, properties):

    print("Connected to MQTT broker!")

    client.subscribe(TOPIC)

    print("Subscribed to:", TOPIC)


def on_message(client, userdata, msg):

    print("\nMQTT message received!")

    try:

        # Convert MQTT message to Python dictionary
        data = json.loads(msg.payload.decode())

        print("Sensor data received:")
        print(data)

        # Send sensor data to FastAPI
        response = requests.post(
            FASTAPI_URL,
            json=data
        )

        print("\nFastAPI response:")

        print(response.status_code)

        print(response.json())

    except json.JSONDecodeError:
       print("Invalid JSON received!")
       print("RAW MESSAGE:", msg.payload.decode())

    except requests.exceptions.ConnectionError:

        print("Could not connect to FastAPI.")

    except Exception as e:

        print("Error:", e)


client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2
)

client.on_connect = on_connect
client.on_message = on_message

client.connect(
    BROKER,
    PORT,
    60
)

print("Waiting for MQTT sensor data...")

client.loop_forever()