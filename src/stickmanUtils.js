export const drawStickman = (ctx, keypoints) => {
  // Configuration for better appearance
  const lineConfig = {
    strokeStyle: "#00ff88",
    lineWidth: 3,
    shadowColor: "rgba(0, 255, 136, 0.3)",
    shadowBlur: 5
  };

  const keypointConfig = {
    fillStyle: "#ff6b35",
    strokeStyle: "#ffffff",
    radius: 4,
    lineWidth: 2
  };

  const drawLine = (p1, p2) => {
    if (p1 && p2 && p1.score > 0.3 && p2.score > 0.3) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = lineConfig.strokeStyle;
      ctx.lineWidth = lineConfig.lineWidth;
      ctx.shadowColor = lineConfig.shadowColor;
      ctx.shadowBlur = lineConfig.shadowBlur;
      ctx.stroke();
      
      // Reset shadow for other operations
      ctx.shadowBlur = 0;
    }
  };

  const drawKeypoint = (point) => {
    if (point && point.score > 0.3) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, keypointConfig.radius, 0, 2 * Math.PI);
      ctx.fillStyle = keypointConfig.fillStyle;
      ctx.fill();
      ctx.strokeStyle = keypointConfig.strokeStyle;
      ctx.lineWidth = keypointConfig.lineWidth;
      ctx.stroke();
    }
  };

  // Organize keypoints for easier access
  const parts = {};
  keypoints.forEach(kp => parts[kp.name] = kp);

  // Draw the skeleton lines
  const connections = [
    // Upper body
    [parts.left_shoulder, parts.right_shoulder],
    [parts.left_shoulder, parts.left_elbow],
    [parts.left_elbow, parts.left_wrist],
    [parts.right_shoulder, parts.right_elbow],
    [parts.right_elbow, parts.right_wrist],
    
    // Torso
    [parts.left_shoulder, parts.left_hip],
    [parts.right_shoulder, parts.right_hip],
    [parts.left_hip, parts.right_hip],
    
    // Lower body
    [parts.left_hip, parts.left_knee],
    [parts.left_knee, parts.left_ankle],
    [parts.right_hip, parts.right_knee],
    [parts.right_knee, parts.right_ankle],
    
    // Additional connections for better skeleton
    [parts.left_shoulder, parts.left_ear],
    [parts.right_shoulder, parts.right_ear],
    [parts.left_eye, parts.right_eye],
    [parts.left_eye, parts.nose],
    [parts.right_eye, parts.nose]
  ];

  // Draw all connections
  connections.forEach(([p1, p2]) => drawLine(p1, p2));

  // Draw all keypoints with enhanced visibility
  keypoints.forEach(point => {
    if (point.score > 0.3) {
      // Different colors for different body parts
      if (point.name.includes('head') || point.name.includes('eye') || point.name.includes('ear') || point.name.includes('nose')) {
        keypointConfig.fillStyle = "#ff4757"; // Red for head
      } else if (point.name.includes('shoulder') || point.name.includes('elbow') || point.name.includes('wrist')) {
        keypointConfig.fillStyle = "#3742fa"; // Blue for arms
      } else if (point.name.includes('hip') || point.name.includes('knee') || point.name.includes('ankle')) {
        keypointConfig.fillStyle = "#2ed573"; // Green for legs
      } else {
        keypointConfig.fillStyle = "#ff6b35"; // Orange for others
      }
      
      drawKeypoint(point);
    }
  });

  // Add confidence score display for debugging
  const highConfidencePoints = keypoints.filter(kp => kp.score > 0.7);
  if (highConfidencePoints.length > 0) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "12px Arial";
    ctx.fillText(`Detected: ${highConfidencePoints.length}/${keypoints.length} points`, 10, 20);
  }
};
  