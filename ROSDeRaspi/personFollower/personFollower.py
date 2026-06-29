import mediapipe as mp
import cv2
from time import time

# Open webcam
img = cv2.VideoCapture(0)

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

prev_time = time()
frame_count = 0
fps = 0
angular_speed = 0.0 # -1.0 (left) to 1.0 (right)
linear_speed = 0.0 # -1.0 (backward) to 1.0 (forward)


with mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    enable_segmentation=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
) as pose:
    while True:
        error, frame = img.read()
        frame = cv2.flip(frame, 1)
        if not error:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)

        status_text = "No Person"

        if results.pose_landmarks:
            height, width, _ = frame.shape
            middle_x, middle_y = width // 2, height // 2
            cv2.circle(frame, (middle_x, middle_y), 5, (255, 0, 0), -1)

            # Draw pose landmarks
            mp_drawing.draw_landmarks(
                frame, 
                results.pose_landmarks, 
                mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2)
            )

            # Default center point
            center_landmarks = (middle_x, middle_y)

            # Shoulders (11 = left, 12 = right), Hips (23 = left, 24 = right)
            left_shoulder = results.pose_landmarks.landmark[11]
            right_shoulder = results.pose_landmarks.landmark[12]
            left_hip = results.pose_landmarks.landmark[23]
            right_hip = results.pose_landmarks.landmark[24]

            # Check visibility for shoulders and hips
            use_shoulders = left_shoulder.visibility > 0.5 and right_shoulder.visibility > 0.5
            use_hips = left_hip.visibility > 0.5 and right_hip.visibility > 0.5

            if use_shoulders or use_hips:
              if use_shoulders:
                lx, ly = left_shoulder.x, left_shoulder.y
                rx, ry = right_shoulder.x, right_shoulder.y
                status_text = "Using Shoulders"
              else:
                lx, ly = left_hip.x, left_hip.y
                rx, ry = right_hip.x, right_hip.y
                status_text = "Using Hips"

              cx = int((lx + rx) / 2 * width)
              cy = int((ly + ry) / 2 * height)
              center_landmarks = (cx, cy)

              # Draw center point
              cv2.circle(frame, center_landmarks, 30, (255, 255, 0), -1)

              # Angular speed (rotation)
              angular_speed = (middle_x - center_landmarks[0]) / middle_x
              if -0.1 < angular_speed < 0.1:
                angular_speed = 0.0
              angular_speed = max(-1.0, min(1.0, angular_speed))

              # Width as depth proxy
              width_ratio = abs(rx - lx)

              SAFE_DISTANCE_RATIO = 0.25  # 25% of the frame width
              DANGER_DISTANCE_RATIO = 0.4  # 40% of the frame width
              
              if width_ratio > DANGER_DISTANCE_RATIO:
                # Move backward slowly
                linear_speed = (width_ratio - DANGER_DISTANCE_RATIO) * 2
                linear_speed = - max(0.0, min(1.0, linear_speed))
                status_text += " - Too Close - Slow"
              elif width_ratio > SAFE_DISTANCE_RATIO:
                linear_speed = 0.0
                status_text += " - Too Close - Stop"
              else:
                linear_speed = (SAFE_DISTANCE_RATIO - width_ratio) * 2
                linear_speed = max(0.0, min(1.0, linear_speed))
                status_text += " - Following"

              # Display speeds
              cv2.putText(frame, f'Angular Speed: {angular_speed:.2f}', (50, 100),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
              cv2.putText(frame, f'Linear Speed: {linear_speed:.2f}', (50, 150),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # FPS counter
        frame_count += 1
        current_time = time()
        elapsed = current_time - prev_time
        if elapsed >= 1.0:
            fps = frame_count / elapsed
            frame_count = 0
            prev_time = current_time

        # Display texts
        cv2.putText(frame, f'FPS: {fps:.2f}', (50, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, status_text, (50, 200),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)

        cv2.imshow('Image', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

img.release()
cv2.destroyAllWindows()
