import React, { useRef, useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { drawStickman } from "./stickmanUtils";
import { 
  calculateTshirtKeypoints, 
  drawTshirtKeypoints, 
  overlayTshirtSimple,
  overlayTshirtSegmented,
  overlayTshirtFixed,
  overlayTshirtAdvanced,
  overlayTshirtUltraPrecise,
  loadTshirtImage,
  validateKeypointMatch,
  createSampleTshirtImage,
  drawKeypointComparison
} from "./tshirtOverlay";
import AdvancedImageProcessor from "./AdvancedImageProcessor";

export default function VirtualTryOn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [tshirtImage, setTshirtImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [matchScore, setMatchScore] = useState(0);
  const [showKeypoints, setShowKeypoints] = useState(true);
  const [showTshirtOverlay, setShowTshirtOverlay] = useState(true);
  const [showKeypointComparison, setShowKeypointComparison] = useState(false);
  const [overlayMode, setOverlayMode] = useState('simple'); // 'simple', 'fixed', 'segmented', 'advanced', 'ultra-precise'

  // Load default t-shirt image
  useEffect(() => {
    const loadDefaultTshirt = async () => {
      try {
        // Create a sample t-shirt image programmatically
        const img = createSampleTshirtImage();
        setTshirtImage(img);
      } catch (error) {
        console.error('Error loading default t-shirt:', error);
      }
    };
    
    loadDefaultTshirt();
  }, []);

  // Handle processed image from ImageProcessor
  const handleProcessedImage = (processedImg) => {
    setTshirtImage(processedImg);
  };

  useEffect(() => {
    const setup = async () => {
      try {
        // Initialize TensorFlow.js
        await tf.ready();
        
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
          
          // Draw video frame
          ctx.drawImage(video, 0, 0);

          const poses = await detector.estimatePoses(video);
          if (poses[0]) {
            const bodyKeypoints = poses[0].keypoints;
            
            // Calculate t-shirt keypoints based on body keypoints
            const tshirtKeypoints = calculateTshirtKeypoints(bodyKeypoints);
            
            // Calculate match score
            const score = validateKeypointMatch(bodyKeypoints, tshirtKeypoints);
            setMatchScore(score);
            
            // Draw body skeleton
            drawStickman(ctx, bodyKeypoints);
            
            // Draw keypoints based on mode
            if (showKeypointComparison) {
              drawKeypointComparison(ctx, bodyKeypoints, tshirtKeypoints);
            } else if (showKeypoints) {
              drawTshirtKeypoints(ctx, tshirtKeypoints);
            }
            
            // Overlay t-shirt if enabled and image is loaded
            if (showTshirtOverlay && tshirtImage) {
              switch (overlayMode) {
                case 'simple':
                  overlayTshirtSimple(ctx, tshirtImage, bodyKeypoints);
                  break;
                case 'fixed':
                  overlayTshirtFixed(ctx, tshirtImage, bodyKeypoints);
                  break;
                case 'segmented':
                  overlayTshirtSegmented(ctx, tshirtImage, bodyKeypoints);
                  break;
                case 'advanced':
                  overlayTshirtAdvanced(ctx, tshirtImage, bodyKeypoints);
                  break;
                case 'ultra-precise':
                default:
                  overlayTshirtUltraPrecise(ctx, tshirtImage, bodyKeypoints);
                  break;
              }
            }
            
            // Draw match score
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(10, 30, 200, 60);
            ctx.fillStyle = "#ffffff";
            ctx.font = "14px Arial";
            ctx.fillText(`Match Score: ${(score * 100).toFixed(1)}%`, 15, 50);
            ctx.fillText(`Keypoints: ${Object.keys(tshirtKeypoints).length}`, 15, 70);
          }
          
          requestAnimationFrame(detect);
        };

        detect();
      } catch (error) {
        console.error('Error setting up pose detection:', error);
      }
    };

    setup();
  }, [tshirtImage, showKeypoints, showTshirtOverlay, showKeypointComparison]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          Virtual Try-On System
        </h1>
        
        {/* Image Processing */}
        <AdvancedImageProcessor onProcessedImage={handleProcessedImage} />
        
        {/* Controls */}
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showKeypoints}
                    onChange={(e) => setShowKeypoints(e.target.checked)}
                    className="mr-2"
                  />
                  Show Keypoints
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showKeypointComparison}
                    onChange={(e) => setShowKeypointComparison(e.target.checked)}
                    className="mr-2"
                  />
                  Show Keypoint Comparison
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showTshirtOverlay}
                    onChange={(e) => setShowTshirtOverlay(e.target.checked)}
                    className="mr-2"
                  />
                  Show T-Shirt Overlay
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Overlay Mode:
                </label>
                <select
                  value={overlayMode}
                  onChange={(e) => setOverlayMode(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
                >
                  <option value="simple">Simple Alignment</option>
                  <option value="fixed">Fixed Alignment</option>
                  <option value="segmented">Segmented Alignment</option>
                  <option value="advanced">Advanced Alignment</option>
                  <option value="ultra-precise">Ultra-Precise Alignment</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="bg-blue-900 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-2">How it works:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Body keypoints are detected using TensorFlow.js MoveNet model</li>
            <li>T-shirt is segmented into body, sleeves, and neck areas</li>
            <li>Each segment aligns precisely with corresponding body parts</li>
            <li>Sleeves follow arm movements, body follows torso, neck aligns with actual neck</li>
            <li>Real-time tracking with individual part transformations</li>
            <li>Choose overlay mode: Segmented, Advanced, or Ultra-Precise alignment</li>
          </ul>
        </div>
        
        {/* Video Canvas */}
        <div className="relative w-full max-w-4xl mx-auto">
          <video 
            ref={videoRef} 
            className="absolute top-0 left-0 w-full h-auto opacity-0" 
            autoPlay 
            muted 
            playsInline 
          />
          <canvas 
            ref={canvasRef} 
            className="w-full h-auto border-2 border-gray-600 rounded-lg" 
          />
        </div>
        
        {/* Status */}
        <div className="mt-4 text-center">
          <div className="inline-block bg-gray-800 px-4 py-2 rounded-lg">
            <span className="text-gray-300">Match Score: </span>
            <span className={`font-bold ${matchScore > 0.7 ? 'text-green-400' : matchScore > 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>
              {(matchScore * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 