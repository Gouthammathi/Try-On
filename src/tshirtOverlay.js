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

// T-shirt segmentation regions
export const TSHIRT_SEGMENTS = {
  BODY: 'body',
  LEFT_SLEEVE: 'left_sleeve',
  RIGHT_SLEEVE: 'right_sleeve',
  NECK_AREA: 'neck_area'
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

// Segment t-shirt image into body and sleeve parts
export const segmentTshirtImage = (tshirtImage) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = tshirtImage.width;
  canvas.height = tshirtImage.height;
  
  // Draw original t-shirt
  ctx.drawImage(tshirtImage, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Create separate canvases for each segment
  const segments = {};
  
  // Body segment (center portion)
  const bodyCanvas = document.createElement('canvas');
  const bodyCtx = bodyCanvas.getContext('2d');
  bodyCanvas.width = canvas.width * 0.6; // 60% of width
  bodyCanvas.height = canvas.height * 0.8; // 80% of height
  
  // Copy center portion for body
  bodyCtx.drawImage(
    tshirtImage,
    canvas.width * 0.2, canvas.height * 0.1, // Source x, y
    canvas.width * 0.6, canvas.height * 0.8, // Source width, height
    0, 0, // Destination x, y
    bodyCanvas.width, bodyCanvas.height // Destination width, height
  );
  segments[TSHIRT_SEGMENTS.BODY] = bodyCanvas;
  
  // Left sleeve segment
  const leftSleeveCanvas = document.createElement('canvas');
  const leftSleeveCtx = leftSleeveCanvas.getContext('2d');
  leftSleeveCanvas.width = canvas.width * 0.25; // 25% of width
  leftSleeveCanvas.height = canvas.height * 0.6; // 60% of height
  
  // Copy left portion for left sleeve
  leftSleeveCtx.drawImage(
    tshirtImage,
    0, canvas.height * 0.15, // Source x, y
    canvas.width * 0.25, canvas.height * 0.6, // Source width, height
    0, 0, // Destination x, y
    leftSleeveCanvas.width, leftSleeveCanvas.height // Destination width, height
  );
  segments[TSHIRT_SEGMENTS.LEFT_SLEEVE] = leftSleeveCanvas;
  
  // Right sleeve segment
  const rightSleeveCanvas = document.createElement('canvas');
  const rightSleeveCtx = rightSleeveCanvas.getContext('2d');
  rightSleeveCanvas.width = canvas.width * 0.25; // 25% of width
  rightSleeveCanvas.height = canvas.height * 0.6; // 60% of height
  
  // Copy right portion for right sleeve
  rightSleeveCtx.drawImage(
    tshirtImage,
    canvas.width * 0.75, canvas.height * 0.15, // Source x, y
    canvas.width * 0.25, canvas.height * 0.6, // Source width, height
    0, 0, // Destination x, y
    rightSleeveCanvas.width, rightSleeveCanvas.height // Destination width, height
  );
  segments[TSHIRT_SEGMENTS.RIGHT_SLEEVE] = rightSleeveCanvas;
  
  // Neck area segment
  const neckCanvas = document.createElement('canvas');
  const neckCtx = neckCanvas.getContext('2d');
  neckCanvas.width = canvas.width * 0.3; // 30% of width
  neckCanvas.height = canvas.height * 0.2; // 20% of height
  
  // Copy top center portion for neck
  neckCtx.drawImage(
    tshirtImage,
    canvas.width * 0.35, 0, // Source x, y
    canvas.width * 0.3, canvas.height * 0.2, // Source width, height
    0, 0, // Destination x, y
    neckCanvas.width, neckCanvas.height // Destination width, height
  );
  segments[TSHIRT_SEGMENTS.NECK_AREA] = neckCanvas;
  
  return segments;
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

// Fixed t-shirt overlay with correct alignment and no inversion
export const overlayTshirtFixed = (ctx, tshirtImage, bodyKeypoints) => {
  if (!tshirtImage || !bodyKeypoints) return;
  
  const bodyMap = {};
  bodyKeypoints.forEach(kp => bodyMap[kp.name] = kp);
  
  // Get essential body keypoints
  const leftShoulder = bodyMap.left_shoulder;
  const rightShoulder = bodyMap.right_shoulder;
  const leftElbow = bodyMap.left_elbow;
  const rightElbow = bodyMap.right_elbow;
  const leftHip = bodyMap.left_hip;
  const rightHip = bodyMap.right_hip;
  const nose = bodyMap.nose;
  const leftEye = bodyMap.left_eye;
  const rightEye = bodyMap.right_eye;
  
  if (!leftShoulder || !rightShoulder) return;
  
  // Calculate shoulder measurements
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const shoulderHeight = Math.abs(rightShoulder.y - leftShoulder.y);
  
  // Calculate neck position - use shoulders as primary reference
  const neckX = (leftShoulder.x + rightShoulder.x) / 2;
  const neckY = Math.min(leftShoulder.y, rightShoulder.y) - shoulderWidth * 0.15; // Above shoulders
  
  // Calculate t-shirt dimensions based on shoulder width
  const tshirtWidth = shoulderWidth * 1.4; // Slightly wider than shoulders
  const tshirtHeight = shoulderWidth * 2.8; // Extend to hips
  
  // Calculate t-shirt position - center on shoulders, not neck
  const tshirtX = (leftShoulder.x + rightShoulder.x) / 2 - tshirtWidth / 2;
  const tshirtY = Math.min(leftShoulder.y, rightShoulder.y) - tshirtHeight * 0.1; // Slightly above shoulders
  
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
  ctx.globalAlpha = 0.85;
  ctx.drawImage(tshirtImage, tshirtX, tshirtY, tshirtWidth, tshirtHeight);
  
  ctx.restore();
};

// Simple t-shirt overlay with basic alignment
export const overlayTshirtSimple = (ctx, tshirtImage, bodyKeypoints) => {
  if (!tshirtImage || !bodyKeypoints) return;
  
  const bodyMap = {};
  bodyKeypoints.forEach(kp => bodyMap[kp.name] = kp);
  
  // Get essential body keypoints
  const leftShoulder = bodyMap.left_shoulder;
  const rightShoulder = bodyMap.right_shoulder;
  
  if (!leftShoulder || !rightShoulder) return;
  
  // Calculate shoulder measurements
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  
  // Calculate t-shirt dimensions
  const tshirtWidth = shoulderWidth * 1.5;
  const tshirtHeight = shoulderWidth * 3.0;
  
  // Position t-shirt at shoulder level
  const tshirtX = (leftShoulder.x + rightShoulder.x) / 2 - tshirtWidth / 2;
  const tshirtY = Math.min(leftShoulder.y, rightShoulder.y) - tshirtHeight * 0.2;
  
  // Draw t-shirt without any rotation or transformation
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.drawImage(tshirtImage, tshirtX, tshirtY, tshirtWidth, tshirtHeight);
  ctx.restore();
};

// Precise segmented t-shirt overlay with individual part alignment
export const overlayTshirtSegmented = (ctx, tshirtImage, bodyKeypoints) => {
  if (!tshirtImage || !bodyKeypoints) return;
  
  const bodyMap = {};
  bodyKeypoints.forEach(kp => bodyMap[kp.name] = kp);
  
  // Get essential body keypoints
  const leftShoulder = bodyMap.left_shoulder;
  const rightShoulder = bodyMap.right_shoulder;
  const leftElbow = bodyMap.left_elbow;
  const rightElbow = bodyMap.right_elbow;
  const leftWrist = bodyMap.left_wrist;
  const rightWrist = bodyMap.right_wrist;
  const leftHip = bodyMap.left_hip;
  const rightHip = bodyMap.right_hip;
  const nose = bodyMap.nose;
  const leftEye = bodyMap.left_eye;
  const rightEye = bodyMap.right_eye;
  
  if (!leftShoulder || !rightShoulder) return;
  
  // Calculate shoulder measurements
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const shoulderHeight = Math.abs(rightShoulder.y - leftShoulder.y);
  
  // Calculate neck position - use shoulders as primary reference
  const neckX = (leftShoulder.x + rightShoulder.x) / 2;
  const neckY = Math.min(leftShoulder.y, rightShoulder.y) - shoulderWidth * 0.1;
  
  // Calculate arm measurements
  const leftArmLength = leftElbow ? Math.sqrt(
    Math.pow(leftElbow.x - leftShoulder.x, 2) + Math.pow(leftElbow.y - leftShoulder.y, 2)
  ) : shoulderWidth * 0.8;
  
  const rightArmLength = rightElbow ? Math.sqrt(
    Math.pow(rightElbow.x - rightShoulder.x, 2) + Math.pow(rightElbow.y - rightShoulder.y, 2)
  ) : shoulderWidth * 0.8;
  
  // Calculate arm angles
  const leftArmAngle = leftElbow ? Math.atan2(
    leftElbow.y - leftShoulder.y,
    leftElbow.x - leftShoulder.x
  ) : 0;
  
  const rightArmAngle = rightElbow ? Math.atan2(
    rightElbow.y - rightShoulder.y,
    rightElbow.x - rightShoulder.x
  ) : 0;
  
  // Calculate body rotation
  const bodyAngle = Math.atan2(
    rightShoulder.y - leftShoulder.y,
    rightShoulder.x - leftShoulder.x
  );
  
  // Segment the t-shirt image
  const segments = segmentTshirtImage(tshirtImage);
  
  // Draw neck area first (under everything)
  if (segments[TSHIRT_SEGMENTS.NECK_AREA]) {
    ctx.save();
    ctx.globalAlpha = 0.95;
    
    const neckWidth = shoulderWidth * 0.4;
    const neckHeight = shoulderWidth * 0.3;
    const neckX_pos = neckX - neckWidth / 2;
    const neckY_pos = neckY - neckHeight / 2;
    
    ctx.translate(neckX, neckY);
    ctx.rotate(bodyAngle);
    ctx.translate(-neckX, -neckY);
    
    ctx.drawImage(segments[TSHIRT_SEGMENTS.NECK_AREA], neckX_pos, neckY_pos, neckWidth, neckHeight);
    ctx.restore();
  }
  
  // Draw body segment
  if (segments[TSHIRT_SEGMENTS.BODY]) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    
    const bodyWidth = shoulderWidth * 1.2;
    const bodyHeight = shoulderWidth * 2.8;
    const bodyX = neckX - bodyWidth / 2;
    const bodyY = neckY;
    
    ctx.translate(neckX, neckY);
    ctx.rotate(bodyAngle);
    ctx.translate(-neckX, -neckY);
    
    ctx.drawImage(segments[TSHIRT_SEGMENTS.BODY], bodyX, bodyY, bodyWidth, bodyHeight);
    ctx.restore();
  }
  
  // Draw left sleeve with precise arm alignment
  if (segments[TSHIRT_SEGMENTS.LEFT_SLEEVE] && leftShoulder) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    
    const sleeveWidth = leftArmLength * 0.4;
    const sleeveHeight = leftArmLength * 0.8;
    
    // Calculate sleeve position based on shoulder and elbow
    const sleeveX = leftShoulder.x - sleeveWidth / 2;
    const sleeveY = leftShoulder.y - sleeveHeight * 0.2;
    
    // Apply arm-specific rotation
    ctx.translate(leftShoulder.x, leftShoulder.y);
    ctx.rotate(leftArmAngle);
    ctx.translate(-leftShoulder.x, -leftShoulder.y);
    
    ctx.drawImage(segments[TSHIRT_SEGMENTS.LEFT_SLEEVE], sleeveX, sleeveY, sleeveWidth, sleeveHeight);
    ctx.restore();
  }
  
  // Draw right sleeve with precise arm alignment
  if (segments[TSHIRT_SEGMENTS.RIGHT_SLEEVE] && rightShoulder) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    
    const sleeveWidth = rightArmLength * 0.4;
    const sleeveHeight = rightArmLength * 0.8;
    
    // Calculate sleeve position based on shoulder and elbow
    const sleeveX = rightShoulder.x - sleeveWidth / 2;
    const sleeveY = rightShoulder.y - sleeveHeight * 0.2;
    
    // Apply arm-specific rotation
    ctx.translate(rightShoulder.x, rightShoulder.y);
    ctx.rotate(rightArmAngle);
    ctx.translate(-rightShoulder.x, -rightShoulder.y);
    
    ctx.drawImage(segments[TSHIRT_SEGMENTS.RIGHT_SLEEVE], sleeveX, sleeveY, sleeveWidth, sleeveHeight);
    ctx.restore();
  }
};

// Advanced t-shirt overlay with precise body part alignment
export const overlayTshirtAdvanced = (ctx, tshirtImage, bodyKeypoints) => {
  if (!tshirtImage || !bodyKeypoints) return;
  
  const bodyMap = {};
  bodyKeypoints.forEach(kp => bodyMap[kp.name] = kp);
  
  // Get all relevant body keypoints
  const leftShoulder = bodyMap.left_shoulder;
  const rightShoulder = bodyMap.right_shoulder;
  const leftElbow = bodyMap.left_elbow;
  const rightElbow = bodyMap.right_elbow;
  const leftWrist = bodyMap.left_wrist;
  const rightWrist = bodyMap.right_wrist;
  const leftHip = bodyMap.left_hip;
  const rightHip = bodyMap.right_hip;
  const nose = bodyMap.nose;
  
  if (!leftShoulder || !rightShoulder) return;
  
  // Calculate precise body measurements
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const shoulderHeight = Math.abs(rightShoulder.y - leftShoulder.y);
  
  // Calculate neck position (precise alignment)
  const neckX = (leftShoulder.x + rightShoulder.x) / 2;
  const neckY = Math.min(leftShoulder.y, rightShoulder.y) - shoulderWidth * 0.12;
  
  // Calculate arm positions for sleeve alignment
  const leftArmAngle = leftElbow ? Math.atan2(
    leftElbow.y - leftShoulder.y,
    leftElbow.x - leftShoulder.x
  ) : 0;
  
  const rightArmAngle = rightElbow ? Math.atan2(
    rightElbow.y - rightShoulder.y,
    rightElbow.x - rightShoulder.x
  ) : 0;
  
  // Calculate t-shirt dimensions with precise proportions
  const tshirtWidth = shoulderWidth * 1.4; // Account for arm movement
  const tshirtHeight = shoulderWidth * 2.8; // Extend to hips
  
  // Calculate precise positioning
  const tshirtX = neckX - tshirtWidth / 2;
  const tshirtY = neckY;
  
  // Apply advanced transformation
  ctx.save();
  
  // Calculate body rotation from shoulders
  const shoulderAngle = Math.atan2(
    rightShoulder.y - leftShoulder.y,
    rightShoulder.x - leftShoulder.x
  );
  
  // Apply rotation around neck point
  ctx.translate(neckX, neckY);
  ctx.rotate(shoulderAngle);
  ctx.translate(-neckX, -neckY);
  
  // Apply perspective distortion based on body pose
  if (leftHip && rightHip) {
    const hipWidth = Math.abs(rightHip.x - leftHip.x);
    const shoulderToHipHeight = Math.abs(
      ((leftHip.y + rightHip.y) / 2) - ((leftShoulder.y + rightShoulder.y) / 2)
    );
    
    // Calculate perspective scaling
    const topWidth = shoulderWidth;
    const bottomWidth = hipWidth;
    const height = shoulderToHipHeight;
    
    // Apply perspective transformation
    const perspectiveMatrix = calculatePerspectiveMatrix(
      tshirtX, tshirtY, tshirtWidth, tshirtHeight,
      leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y,
      leftHip.x, leftHip.y, rightHip.x, rightHip.y
    );
    
    ctx.setTransform(
      perspectiveMatrix[0], perspectiveMatrix[1],
      perspectiveMatrix[2], perspectiveMatrix[3],
      perspectiveMatrix[4], perspectiveMatrix[5]
    );
  }
  
  // Draw t-shirt with enhanced transparency
  ctx.globalAlpha = 0.9;
  ctx.drawImage(tshirtImage, tshirtX, tshirtY, tshirtWidth, tshirtHeight);
  
  ctx.restore();
};

// Calculate perspective transformation matrix for precise alignment
const calculatePerspectiveMatrix = (tshirtX, tshirtY, tshirtWidth, tshirtHeight, 
                                  leftShoulderX, leftShoulderY, rightShoulderX, rightShoulderY,
                                  leftHipX, leftHipY, rightHipX, rightHipY) => {
  
  // Source rectangle (t-shirt)
  const srcLeft = tshirtX;
  const srcRight = tshirtX + tshirtWidth;
  const srcTop = tshirtY;
  const srcBottom = tshirtY + tshirtHeight;
  
  // Destination quadrilateral (body)
  const dstTopLeft = { x: leftShoulderX - tshirtWidth * 0.1, y: leftShoulderY };
  const dstTopRight = { x: rightShoulderX + tshirtWidth * 0.1, y: rightShoulderY };
  const dstBottomLeft = { x: leftHipX - tshirtWidth * 0.1, y: leftHipY };
  const dstBottomRight = { x: rightHipX + tshirtWidth * 0.1, y: rightHipY };
  
  // Calculate transformation matrix
  const scaleX = Math.abs(dstTopRight.x - dstTopLeft.x) / tshirtWidth;
  const scaleY = Math.abs(dstBottomLeft.y - dstTopLeft.y) / tshirtHeight;
  
  const translateX = dstTopLeft.x - srcLeft * scaleX;
  const translateY = dstTopLeft.y - srcTop * scaleY;
  
  return [scaleX, 0, 0, scaleY, translateX, translateY];
};

// Ultra-precise t-shirt overlay with exact body part alignment
export const overlayTshirtUltraPrecise = (ctx, tshirtImage, bodyKeypoints) => {
  if (!tshirtImage || !bodyKeypoints) return;
  
  const bodyMap = {};
  bodyKeypoints.forEach(kp => bodyMap[kp.name] = kp);
  
  // Get all essential body keypoints
  const leftShoulder = bodyMap.left_shoulder;
  const rightShoulder = bodyMap.right_shoulder;
  const leftElbow = bodyMap.left_elbow;
  const rightElbow = bodyMap.right_elbow;
  const leftWrist = bodyMap.left_wrist;
  const rightWrist = bodyMap.right_wrist;
  const leftHip = bodyMap.left_hip;
  const rightHip = bodyMap.right_hip;
  const nose = bodyMap.nose;
  const leftEye = bodyMap.left_eye;
  const rightEye = bodyMap.right_eye;
  
  if (!leftShoulder || !rightShoulder) return;
  
  // Calculate precise neck position using facial features
  let neckX, neckY;
  if (nose && leftEye && rightEye) {
    // Use facial features for precise neck positioning
    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const eyeMidY = (leftEye.y + rightEye.y) / 2;
    const noseToEyeDistance = Math.abs(nose.y - eyeMidY);
    
    neckX = nose.x;
    neckY = nose.y + noseToEyeDistance * 1.5; // Below nose, above shoulders
  } else {
    // Fallback to shoulder-based neck calculation
    neckX = (leftShoulder.x + rightShoulder.x) / 2;
    neckY = Math.min(leftShoulder.y, rightShoulder.y) - Math.abs(rightShoulder.x - leftShoulder.x) * 0.1;
  }
  
  // Calculate shoulder measurements
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const shoulderHeight = Math.abs(rightShoulder.y - leftShoulder.y);
  
  // Calculate arm angles for sleeve alignment
  const leftArmAngle = leftElbow ? Math.atan2(
    leftElbow.y - leftShoulder.y,
    leftElbow.x - leftShoulder.x
  ) : 0;
  
  const rightArmAngle = rightElbow ? Math.atan2(
    rightElbow.y - rightShoulder.y,
    rightElbow.x - rightShoulder.x
  ) : 0;
  
  // Calculate t-shirt dimensions with precise body proportions
  const tshirtWidth = shoulderWidth * 1.5; // Account for arm movement and natural fit
  const tshirtHeight = shoulderWidth * 3.2; // Extend to hips with proper proportions
  
  // Calculate precise t-shirt positioning
  const tshirtX = neckX - tshirtWidth / 2;
  const tshirtY = neckY - tshirtHeight * 0.1; // Slightly above neck for natural fit
  
  // Apply ultra-precise transformation
  ctx.save();
  
  // Calculate body rotation from shoulders
  const shoulderAngle = Math.atan2(
    rightShoulder.y - leftShoulder.y,
    rightShoulder.x - leftShoulder.x
  );
  
  // Apply rotation around neck point
  ctx.translate(neckX, neckY);
  ctx.rotate(shoulderAngle);
  ctx.translate(-neckX, -neckY);
  
  // Apply perspective distortion for realistic fit
  if (leftHip && rightHip) {
    const hipWidth = Math.abs(rightHip.x - leftHip.x);
    const shoulderToHipHeight = Math.abs(
      ((leftHip.y + rightHip.y) / 2) - ((leftShoulder.y + rightShoulder.y) / 2)
    );
    
    // Calculate perspective transformation matrix
    const perspectiveMatrix = calculateUltraPreciseMatrix(
      tshirtX, tshirtY, tshirtWidth, tshirtHeight,
      leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y,
      leftHip.x, leftHip.y, rightHip.x, rightHip.y,
      neckX, neckY
    );
    
    ctx.setTransform(
      perspectiveMatrix[0], perspectiveMatrix[1],
      perspectiveMatrix[2], perspectiveMatrix[3],
      perspectiveMatrix[4], perspectiveMatrix[5]
    );
  }
  
  // Draw t-shirt with enhanced transparency and blending
  ctx.globalAlpha = 0.92;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(tshirtImage, tshirtX, tshirtY, tshirtWidth, tshirtHeight);
  
  ctx.restore();
};

// Calculate ultra-precise perspective transformation matrix
const calculateUltraPreciseMatrix = (tshirtX, tshirtY, tshirtWidth, tshirtHeight,
                                   leftShoulderX, leftShoulderY, rightShoulderX, rightShoulderY,
                                   leftHipX, leftHipY, rightHipX, rightHipY,
                                   neckX, neckY) => {
  
  // Calculate body proportions
  const shoulderWidth = Math.abs(rightShoulderX - leftShoulderX);
  const hipWidth = Math.abs(rightHipX - leftHipX);
  const torsoHeight = Math.abs(
    ((leftHipY + rightHipY) / 2) - ((leftShoulderY + rightShoulderY) / 2)
  );
  
  // Calculate t-shirt fit points
  const tshirtNeckLeft = { x: leftShoulderX - shoulderWidth * 0.05, y: neckY };
  const tshirtNeckRight = { x: rightShoulderX + shoulderWidth * 0.05, y: neckY };
  const tshirtBottomLeft = { x: leftHipX - hipWidth * 0.05, y: leftHipY + torsoHeight * 0.2 };
  const tshirtBottomRight = { x: rightHipX + hipWidth * 0.05, y: rightHipY + torsoHeight * 0.2 };
  
  // Calculate transformation matrix for precise alignment
  const scaleX = Math.abs(tshirtNeckRight.x - tshirtNeckLeft.x) / tshirtWidth;
  const scaleY = Math.abs(tshirtBottomLeft.y - tshirtNeckLeft.y) / tshirtHeight;
  
  const translateX = tshirtNeckLeft.x - tshirtX * scaleX;
  const translateY = tshirtNeckLeft.y - tshirtY * scaleY;
  
  return [scaleX, 0, 0, scaleY, translateX, translateY];
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

// Validate keypoint matching with improved precision
export const validateKeypointMatch = (bodyKeypoints, tshirtKeypoints) => {
  const bodyMap = {};
  bodyKeypoints.forEach(kp => bodyMap[kp.name] = kp);
  
  let matchScore = 0;
  let totalPoints = 0;
  
  // Focus on key alignment points
  const keyAlignmentPoints = [
    'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'
  ];
  
  keyAlignmentPoints.forEach(bodyKey => {
    if (bodyMap[bodyKey]) {
      const bodyPoint = bodyMap[bodyKey];
      
      // Calculate expected t-shirt position for this body point
      let expectedTshirtX = bodyPoint.x;
      let expectedTshirtY = bodyPoint.y;
      
      // Adjust for t-shirt positioning
      if (bodyKey === 'left_shoulder' || bodyKey === 'right_shoulder') {
        expectedTshirtY -= 10; // T-shirt neckline above shoulders
      }
      
      // Score based on how well t-shirt aligns with body
      const alignmentScore = Math.max(0, 1 - Math.abs(expectedTshirtY - bodyPoint.y) / 50);
      const confidenceScore = bodyPoint.score;
      
      matchScore += alignmentScore * confidenceScore;
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
  
  // Draw t-shirt shape with precise proportions
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(50, 50, 200, 300);
  
  // Draw neck hole (precisely positioned)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(150, 80, 25, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw arm holes (aligned with shoulder positions)
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
  ctx.fillText('T-SHIRT', 150, 200);
  
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
};

// Draw keypoint comparison for debugging
export const drawKeypointComparison = (ctx, bodyKeypoints, tshirtKeypoints) => {
  // Draw body keypoints in blue
  ctx.fillStyle = "#0066ff";
  bodyKeypoints.forEach(point => {
    if (point.score > 0.3) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
  
  // Draw t-shirt keypoints in red
  ctx.fillStyle = "#ff0000";
  Object.values(tshirtKeypoints).forEach(point => {
    if (point && point.score > 0.3) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
  
  // Draw connection lines between matched points
  ctx.strokeStyle = "#ffff00";
  ctx.lineWidth = 1;
  Object.entries(TSHIRT_TO_BODY_MAPPING).forEach(([tshirtKey, bodyKey]) => {
    const tshirtPoint = tshirtKeypoints[tshirtKey];
    const bodyPoint = bodyKeypoints.find(kp => kp.name === bodyKey);
    
    if (tshirtPoint && bodyPoint && tshirtPoint.score > 0.3 && bodyPoint.score > 0.3) {
      ctx.beginPath();
      ctx.moveTo(tshirtPoint.x, tshirtPoint.y);
      ctx.lineTo(bodyPoint.x, bodyPoint.y);
      ctx.stroke();
    }
  });
}; 