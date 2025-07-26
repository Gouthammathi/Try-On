// T-shirt keypoint detection and overlay utilities

// Define keypoints for t-shirt overlay
export const TSHIRT_KEYPOINTS = {
  LEFT_SHOULDER: 'left_shoulder',
  RIGHT_SHOULDER: 'right_shoulder',
  LEFT_ELBOW: 'left_elbow',
  RIGHT_ELBOW: 'right_elbow',
  LEFT_WRIST: 'left_wrist',
  RIGHT_WRIST: 'right_wrist',
  LEFT_HIP: 'left_hip',
  RIGHT_HIP: 'right_hip',
  NECK: 'neck',
  CHEST_CENTER: 'chest_center'
};

// T-shirt keypoint mapping to body keypoints
export const TSHIRT_TO_BODY_MAPPING = {
  [TSHIRT_KEYPOINTS.LEFT_SHOULDER]: 'left_shoulder',
  [TSHIRT_KEYPOINTS.RIGHT_SHOULDER]: 'right_shoulder',
  [TSHIRT_KEYPOINTS.LEFT_ELBOW]: 'left_elbow',
  [TSHIRT_KEYPOINTS.RIGHT_ELBOW]: 'right_elbow',
  [TSHIRT_KEYPOINTS.LEFT_WRIST]: 'left_wrist',
  [TSHIRT_KEYPOINTS.RIGHT_WRIST]: 'right_wrist',
  [TSHIRT_KEYPOINTS.LEFT_HIP]: 'left_hip',
  [TSHIRT_KEYPOINTS.RIGHT_HIP]: 'right_hip',
  [TSHIRT_KEYPOINTS.NECK]: 'nose', // Using nose as neck approximation
  [TSHIRT_KEYPOINTS.CHEST_CENTER]: 'nose' // Using nose as chest center approximation
};

// Calculate t-shirt keypoints based on body keypoints
export const calculateTshirtKeypoints = (bodyKeypoints) => {
  const keypoints = {};
  
  // Create a map for easy access
  const bodyMap = {};
  bodyKeypoints.forEach(kp => bodyMap[kp.name] = kp);
  
  // Calculate t-shirt keypoints based on body keypoints
  Object.entries(TSHIRT_TO_BODY_MAPPING).forEach(([tshirtKey, bodyKey]) => {
    if (bodyMap[bodyKey]) {
      keypoints[tshirtKey] = {
        x: bodyMap[bodyKey].x,
        y: bodyMap[bodyKey].y,
        score: bodyMap[bodyKey].score,
        name: tshirtKey
      };
    }
  });
  
  // Calculate additional t-shirt specific keypoints
  if (bodyMap.left_shoulder && bodyMap.right_shoulder) {
    // Neck point (midpoint between shoulders, slightly above)
    const shoulderMidX = (bodyMap.left_shoulder.x + bodyMap.right_shoulder.x) / 2;
    const shoulderMidY = (bodyMap.left_shoulder.y + bodyMap.right_shoulder.y) / 2;
    const neckOffset = 20; // Adjust based on t-shirt design
    
    keypoints[TSHIRT_KEYPOINTS.NECK] = {
      x: shoulderMidX,
      y: shoulderMidY - neckOffset,
      score: Math.min(bodyMap.left_shoulder.score, bodyMap.right_shoulder.score),
      name: TSHIRT_KEYPOINTS.NECK
    };
    
    // Chest center point
    keypoints[TSHIRT_KEYPOINTS.CHEST_CENTER] = {
      x: shoulderMidX,
      y: shoulderMidY + neckOffset,
      score: Math.min(bodyMap.left_shoulder.score, bodyMap.right_shoulder.score),
      name: TSHIRT_KEYPOINTS.CHEST_CENTER
    };
  }
  
  return keypoints;
};

// Draw t-shirt keypoints for visualization
export const drawTshirtKeypoints = (ctx, tshirtKeypoints) => {
  const keypointConfig = {
    fillStyle: "#ff0000",
    strokeStyle: "#ffffff",
    radius: 6,
    lineWidth: 2
  };

  Object.values(tshirtKeypoints).forEach(point => {
    if (point && point.score > 0.3) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, keypointConfig.radius, 0, 2 * Math.PI);
      ctx.fillStyle = keypointConfig.fillStyle;
      ctx.fill();
      ctx.strokeStyle = keypointConfig.strokeStyle;
      ctx.lineWidth = keypointConfig.lineWidth;
      ctx.stroke();
      
      // Add label
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px Arial";
      ctx.fillText(point.name, point.x + 8, point.y - 8);
    }
  });
};

// Overlay t-shirt image on body
export const overlayTshirt = (ctx, tshirtImage, bodyKeypoints, tshirtKeypoints) => {
  if (!tshirtImage || !bodyKeypoints || !tshirtKeypoints) return;
  
  const bodyMap = {};
  bodyKeypoints.forEach(kp => bodyMap[kp.name] = kp);
  
  // Get key reference points
  const leftShoulder = bodyMap.left_shoulder;
  const rightShoulder = bodyMap.right_shoulder;
  const leftHip = bodyMap.left_hip;
  const rightHip = bodyMap.right_hip;
  
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;
  
  // Calculate t-shirt dimensions and position
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const torsoHeight = Math.abs(
    ((leftHip.y + rightHip.y) / 2) - ((leftShoulder.y + rightShoulder.y) / 2)
  );
  
  // Calculate t-shirt position
  const tshirtX = leftShoulder.x;
  const tshirtY = leftShoulder.y;
  const tshirtWidth = shoulderWidth * 1.2; // Slightly wider than shoulders
  const tshirtHeight = torsoHeight * 1.5; // Extend below hips
  
  // Apply transformation to match body pose
  ctx.save();
  
  // Calculate rotation angle based on shoulder line
  const shoulderAngle = Math.atan2(
    rightShoulder.y - leftShoulder.y,
    rightShoulder.x - leftShoulder.x
  );
  
  // Move to center of t-shirt for rotation
  const centerX = tshirtX + tshirtWidth / 2;
  const centerY = tshirtY + tshirtHeight / 2;
  
  ctx.translate(centerX, centerY);
  ctx.rotate(shoulderAngle);
  ctx.translate(-centerX, -centerY);
  
  // Draw t-shirt with transparency
  ctx.globalAlpha = 0.8;
  ctx.drawImage(tshirtImage, tshirtX, tshirtY, tshirtWidth, tshirtHeight);
  
  ctx.restore();
};

// Advanced t-shirt overlay with perspective transformation
export const overlayTshirtAdvanced = (ctx, tshirtImage, bodyKeypoints) => {
  if (!tshirtImage || !bodyKeypoints) return;
  
  const bodyMap = {};
  bodyKeypoints.forEach(kp => bodyMap[kp.name] = kp);
  
  // Get key points for transformation
  const leftShoulder = bodyMap.left_shoulder;
  const rightShoulder = bodyMap.right_shoulder;
  const leftHip = bodyMap.left_hip;
  const rightHip = bodyMap.right_hip;
  
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;
  
  // Calculate t-shirt dimensions
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const hipWidth = Math.abs(rightHip.x - leftHip.x);
  const torsoHeight = Math.abs(
    ((leftHip.y + rightHip.y) / 2) - ((leftShoulder.y + rightShoulder.y) / 2)
  );
  
  // Source points (t-shirt corners)
  const srcPoints = [
    { x: 0, y: 0 }, // Top-left
    { x: tshirtImage.width, y: 0 }, // Top-right
    { x: tshirtImage.width, y: tshirtImage.height }, // Bottom-right
    { x: 0, y: tshirtImage.height } // Bottom-left
  ];
  
  // Destination points (body positions)
  const dstPoints = [
    { x: leftShoulder.x - shoulderWidth * 0.1, y: leftShoulder.y }, // Top-left
    { x: rightShoulder.x + shoulderWidth * 0.1, y: rightShoulder.y }, // Top-right
    { x: rightHip.x + hipWidth * 0.1, y: rightHip.y }, // Bottom-right
    { x: leftHip.x - hipWidth * 0.1, y: leftHip.y } // Bottom-left
  ];
  
  // Apply perspective transformation
  ctx.save();
  ctx.globalAlpha = 0.9;
  
  // Use canvas transform matrix for perspective
  const matrix = calculatePerspectiveTransform(srcPoints, dstPoints);
  ctx.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
  
  ctx.drawImage(tshirtImage, 0, 0);
  ctx.restore();
};

// Calculate perspective transformation matrix
const calculatePerspectiveTransform = (src, dst) => {
  // Simplified transformation - in a real implementation, you'd use a proper
  // perspective transformation library or implement the full matrix calculation
  
  // For now, we'll use a simple affine transformation
  const srcCenter = {
    x: (src[0].x + src[1].x + src[2].x + src[3].x) / 4,
    y: (src[0].y + src[1].y + src[2].y + src[3].y) / 4
  };
  
  const dstCenter = {
    x: (dst[0].x + dst[1].x + dst[2].x + dst[3].x) / 4,
    y: (dst[0].y + dst[1].y + dst[2].y + dst[3].y) / 4
  };
  
  const scaleX = Math.abs(dst[1].x - dst[0].x) / Math.abs(src[1].x - src[0].x);
  const scaleY = Math.abs(dst[3].y - dst[0].y) / Math.abs(src[3].y - src[0].y);
  
  return [
    scaleX, 0, 0, scaleY, 
    dstCenter.x - srcCenter.x * scaleX, 
    dstCenter.y - srcCenter.y * scaleY
  ];
};

// Load and preprocess t-shirt image
export const loadTshirtImage = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageUrl;
  });
};

// Validate keypoint matching
export const validateKeypointMatch = (bodyKeypoints, tshirtKeypoints) => {
  const bodyMap = {};
  bodyKeypoints.forEach(kp => bodyMap[kp.name] = kp);
  
  let matchScore = 0;
  let totalPoints = 0;
  
  Object.entries(TSHIRT_TO_BODY_MAPPING).forEach(([tshirtKey, bodyKey]) => {
    if (bodyMap[bodyKey] && tshirtKeypoints[tshirtKey]) {
      const bodyPoint = bodyMap[bodyKey];
      const tshirtPoint = tshirtKeypoints[tshirtKey];
      
      // Calculate distance between matched points
      const distance = Math.sqrt(
        Math.pow(bodyPoint.x - tshirtPoint.x, 2) + 
        Math.pow(bodyPoint.y - tshirtPoint.y, 2)
      );
      
      // Score based on distance and confidence
      const pointScore = Math.max(0, 1 - distance / 50) * 
                        Math.min(bodyPoint.score, tshirtPoint.score);
      
      matchScore += pointScore;
      totalPoints++;
    }
  });
  
  return totalPoints > 0 ? matchScore / totalPoints : 0;
}; 

// Create a sample t-shirt image for testing
export const createSampleTshirtImage = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  // Draw t-shirt shape
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(50, 50, 200, 300);
  
  // Draw neck hole
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(150, 80, 25, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw arm holes
  ctx.beginPath();
  ctx.arc(70, 120, 20, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(230, 120, 20, 0, 2 * Math.PI);
  ctx.fill();
  
  // Add some design
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('VIRTUAL', 150, 200);
  ctx.fillText('TRY-ON', 150, 230);
  
  // Convert to image
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
};

// Enhanced keypoint visualization with different colors for body vs t-shirt
export const drawKeypointComparison = (ctx, bodyKeypoints, tshirtKeypoints) => {
  // Draw body keypoints in blue
  bodyKeypoints.forEach(point => {
    if (point && point.score > 0.3) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
  
  // Draw t-shirt keypoints in red
  Object.values(tshirtKeypoints).forEach(point => {
    if (point && point.score > 0.3) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw connection line to corresponding body keypoint
      const bodyKey = TSHIRT_TO_BODY_MAPPING[point.name];
      const bodyPoint = bodyKeypoints.find(kp => kp.name === bodyKey);
      if (bodyPoint && bodyPoint.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(bodyPoint.x, bodyPoint.y);
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  });
}; 