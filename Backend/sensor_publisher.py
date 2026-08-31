import paho.mqtt.client as mqtt
import json
import time
from datetime import datetime, timezone


# =========================================================
# MQTT CONFIGURATION
# =========================================================

BROKER = "127.0.0.1"
PORT = 1883
TOPIC = "mine/sensors"


# =========================================================
# INITIAL SENSOR VALUES - 8 NODES
# =========================================================

nodes = {

    # -----------------------------------------------------
    # N01 - NORMAL / STABLE
    # -----------------------------------------------------
    "N01": {
        "tilt_x_deg": 0.0727,
        "tilt_y_deg": 0.0522,
        "displacement_mm": 2.0365,
        "vibration_g": 0.0189,
        "crack_width_mm": 0.00
    },

    # -----------------------------------------------------
    # N02 - WATCH
    # -----------------------------------------------------
    "N02": {
        "tilt_x_deg": 0.25,
        "tilt_y_deg": 0.20,
        "displacement_mm": 2.20,
        "vibration_g": 0.020,
        "crack_width_mm": 0.02
    },

    # -----------------------------------------------------
    # N03 - WARNING
    # -----------------------------------------------------
    "N03": {
        "tilt_x_deg": 0.50,
        "tilt_y_deg": 0.35,
        "displacement_mm": 5.50,
        "vibration_g": 0.040,
        "crack_width_mm": 0.15
    },

    # -----------------------------------------------------
    # N04 - CRITICAL
    # -----------------------------------------------------
    "N04": {
        "tilt_x_deg": 0.80,
        "tilt_y_deg": 0.60,
        "displacement_mm": 7.50,
        "vibration_g": 0.060,
        "crack_width_mm": 0.25
    },

    # -----------------------------------------------------
    # N05 - NORMAL
    # -----------------------------------------------------
    "N05": {
        "tilt_x_deg": 0.08,
        "tilt_y_deg": 0.06,
        "displacement_mm": 2.10,
        "vibration_g": 0.018,
        "crack_width_mm": 0.00
    },

    # -----------------------------------------------------
    # N06 - WATCH / INCREASING
    # -----------------------------------------------------
    "N06": {
        "tilt_x_deg": 0.30,
        "tilt_y_deg": 0.24,
        "displacement_mm": 3.00,
        "vibration_g": 0.027,
        "crack_width_mm": 0.03
    },

    # -----------------------------------------------------
    # N07 - NORMAL / STABLE
    # -----------------------------------------------------
    "N07": {
        "tilt_x_deg": 0.04,
        "tilt_y_deg": 0.03,
        "displacement_mm": 1.50,
        "vibration_g": 0.012,
        "crack_width_mm": 0.00
    },

    # -----------------------------------------------------
    # N08 - NORMAL / STABLE
    # -----------------------------------------------------
    "N08": {
        "tilt_x_deg": 0.05,
        "tilt_y_deg": 0.04,
        "displacement_mm": 1.70,
        "vibration_g": 0.014,
        "crack_width_mm": 0.00
    }
}


# =========================================================
# MQTT CLIENT
# =========================================================

client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2
)


# =========================================================
# CONNECT TO MQTT BROKER
# =========================================================

try:

    client.connect(
        BROKER,
        PORT,
        60
    )

    print("MQTT connected.")
    print("Starting 8-node continuous sensor simulation...")
    print("New readings will be sent every 5 seconds.")
    print("Press CTRL+C to stop.\n")

except Exception as e:

    print("Could not connect to MQTT broker.")
    print("Error:", e)

    exit(1)


# =========================================================
# CONTINUOUS SENSOR SIMULATION
# =========================================================

try:

    cycle = 0

    while True:

        cycle += 1

        print("\n" + "=" * 70)
        print(f"                    SENSOR CYCLE {cycle}")
        print("=" * 70)


        # =================================================
        # UPDATE SENSOR VALUES
        # =================================================

        # -------------------------------------------------
        # N01 - NORMAL / VERY SLOW CHANGE
        # -------------------------------------------------

        nodes["N01"]["tilt_x_deg"] += 0.002
        nodes["N01"]["tilt_y_deg"] += 0.002
        nodes["N01"]["displacement_mm"] += 0.01
        nodes["N01"]["vibration_g"] += 0.0002
        nodes["N01"]["crack_width_mm"] += 0.0005


        # -------------------------------------------------
        # N02 - WATCH / SLOWLY INCREASING
        # -------------------------------------------------

        nodes["N02"]["tilt_x_deg"] += 0.01
        nodes["N02"]["tilt_y_deg"] += 0.008
        nodes["N02"]["displacement_mm"] += 0.08
        nodes["N02"]["vibration_g"] += 0.001
        nodes["N02"]["crack_width_mm"] += 0.003


        # -------------------------------------------------
        # N03 - WARNING / MODERATE INCREASE
        # -------------------------------------------------

        nodes["N03"]["tilt_x_deg"] += 0.025
        nodes["N03"]["tilt_y_deg"] += 0.020
        nodes["N03"]["displacement_mm"] += 0.20
        nodes["N03"]["vibration_g"] += 0.002
        nodes["N03"]["crack_width_mm"] += 0.006


        # -------------------------------------------------
        # N04 - CRITICAL / RAPID DETERIORATION
        # -------------------------------------------------

        nodes["N04"]["tilt_x_deg"] += 0.04
        nodes["N04"]["tilt_y_deg"] += 0.035
        nodes["N04"]["displacement_mm"] += 0.40
        nodes["N04"]["vibration_g"] += 0.004
        nodes["N04"]["crack_width_mm"] += 0.015


        # -------------------------------------------------
        # N05 - NORMAL / VERY SLOW CHANGE
        # -------------------------------------------------

        nodes["N05"]["tilt_x_deg"] += 0.002
        nodes["N05"]["tilt_y_deg"] += 0.002
        nodes["N05"]["displacement_mm"] += 0.01
        nodes["N05"]["vibration_g"] += 0.0002
        nodes["N05"]["crack_width_mm"] += 0.0005


        # -------------------------------------------------
        # N06 - WATCH / MOVING TOWARD WARNING
        # -------------------------------------------------

        nodes["N06"]["tilt_x_deg"] += 0.015
        nodes["N06"]["tilt_y_deg"] += 0.012
        nodes["N06"]["displacement_mm"] += 0.12
        nodes["N06"]["vibration_g"] += 0.0015
        nodes["N06"]["crack_width_mm"] += 0.004


        # -------------------------------------------------
        # N07 - NORMAL / VERY SLOW CHANGE
        # -------------------------------------------------

        nodes["N07"]["tilt_x_deg"] += 0.001
        nodes["N07"]["tilt_y_deg"] += 0.001
        nodes["N07"]["displacement_mm"] += 0.005
        nodes["N07"]["vibration_g"] += 0.0001
        nodes["N07"]["crack_width_mm"] += 0.0001


        # -------------------------------------------------
        # N08 - NORMAL / VERY SLOW CHANGE
        # -------------------------------------------------

        nodes["N08"]["tilt_x_deg"] += 0.001
        nodes["N08"]["tilt_y_deg"] += 0.001
        nodes["N08"]["displacement_mm"] += 0.005
        nodes["N08"]["vibration_g"] += 0.0001
        nodes["N08"]["crack_width_mm"] += 0.0001


        # =================================================
        # SEND ALL 8 NODES
        # =================================================

        for node_id, data in nodes.items():

            # -------------------------------------------------
            # CREATE CURRENT UTC TIMESTAMP
            # -------------------------------------------------

            timestamp = datetime.now(
                timezone.utc
            ).isoformat()


            # -------------------------------------------------
            # CREATE SENSOR READING
            # -------------------------------------------------

            reading = {

                "node_id": node_id,

                "timestamp_utc": timestamp,

                "tilt_x_deg": round(
                    data["tilt_x_deg"],
                    3
                ),

                "tilt_y_deg": round(
                    data["tilt_y_deg"],
                    3
                ),

                "displacement_mm": round(
                    data["displacement_mm"],
                    2
                ),

                "vibration_g": round(
                    data["vibration_g"],
                    3
                ),

                "crack_width_mm": round(
                    data["crack_width_mm"],
                    3
                )
            }


            # -------------------------------------------------
            # CONVERT TO JSON
            # -------------------------------------------------

            message = json.dumps(
                reading
            )


            # -------------------------------------------------
            # PRINT READING
            # -------------------------------------------------

            print(f"\nSending {node_id}:")
            print(message)


            # -------------------------------------------------
            # PUBLISH TO MQTT
            # -------------------------------------------------

            result = client.publish(
                TOPIC,
                message
            )


            # -------------------------------------------------
            # CHECK PUBLISH RESULT
            # -------------------------------------------------

            if result.rc == mqtt.MQTT_ERR_SUCCESS:

                print(
                    "Published successfully!"
                )

            else:

                print(
                    "Publish failed! Error code:",
                    result.rc
                )


        # =================================================
        # WAIT 5 SECONDS
        # =================================================

        print(
            "\nWaiting 5 seconds for next sensor cycle..."
        )

        time.sleep(5)


# =========================================================
# STOP WITH CTRL+C
# =========================================================

except KeyboardInterrupt:

    print(
        "\nStopping sensor simulation..."
    )


finally:

    client.disconnect()

    print(
        "MQTT disconnected."
    )

    print(
        "Sensor publisher stopped."
    )