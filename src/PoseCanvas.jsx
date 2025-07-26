import React, { useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { drawStickman } from "./stickmanUtils";

export default function PoseCanvas() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const setup = async () => {
      try {
        // Initialize TensorFlow.js with explicit backend configuration
        await tf.ready();
        
        // Optionally set backend explicitly to avoid warnings
        // Try WebGL first, then fallback to CPU if needed
        if (tf.getBackend() !== 'webgl') {
          await tf.setBackend('webgl');
        }
        
        console.log('TensorFlow backend:', tf.getBackend());
        
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet
        );
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = videoRef.current;
        video.srcObject = stream;
        await new Promise((res) => (video.onloadedmetadata = res));
        video.play();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const detect = async () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0);

          const poses = await detector.estimatePoses(video);
          if (poses[0]) {
            drawStickman(ctx, poses[0].keypoints);
          }
          requestAnimationFrame(detect);
        };

        detect();
      } catch (error) {
        console.error('Error setting up pose detection:', error);
      }
    };

    setup();
  }, []);

  return (
    <div className="relative w-full h-auto">
      <video ref={videoRef} className="absolute top-0 left-0" autoPlay muted playsInline />
      <canvas ref={canvasRef} className="absolute top-0 left-0" />
    </div>
  );
}
