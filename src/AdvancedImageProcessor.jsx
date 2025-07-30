import React, { useState, useRef } from 'react';

export default function AdvancedImageProcessor({ onProcessedImage }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const canvasRef = useRef(null);

  // Advanced background removal using edge detection and flood fill
  const removeBackgroundAdvanced = (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Create a new canvas for the processed image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    const newImageData = ctx.createImageData(width, height);
    const newData = newImageData.data;
    
    // Step 1: Detect edges using Sobel operator
    setProcessingStep('Detecting edges...');
    const edgeMap = detectEdges(data, width, height);
    setProgress(30);
    
    // Step 2: Find background regions using flood fill from edges
    setProcessingStep('Identifying background regions...');
    const backgroundMask = findBackgroundRegions(edgeMap, width, height);
    setProgress(60);
    
    // Step 3: Apply background removal
    setProcessingStep('Removing background...');
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      
      if (backgroundMask[y * width + x]) {
        // Make background pixel transparent
        newData[i] = 0;
        newData[i + 1] = 0;
        newData[i + 2] = 0;
        newData[i + 3] = 0;
      } else {
        // Keep foreground pixel
        newData[i] = data[i];
        newData[i + 1] = data[i + 1];
        newData[i + 2] = data[i + 2];
        newData[i + 3] = 255;
      }
    }
    setProgress(90);
    
    return newImageData;
  };

  // Sobel edge detection
  const detectEdges = (data, width, height) => {
    const edgeMap = new Uint8Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Get surrounding pixels for Sobel operator
        const p00 = getBrightness(data, x - 1, y - 1, width);
        const p01 = getBrightness(data, x, y - 1, width);
        const p02 = getBrightness(data, x + 1, y - 1, width);
        const p10 = getBrightness(data, x - 1, y, width);
        const p12 = getBrightness(data, x + 1, y, width);
        const p20 = getBrightness(data, x - 1, y + 1, width);
        const p21 = getBrightness(data, x, y + 1, width);
        const p22 = getBrightness(data, x + 1, y + 1, width);
        
        // Sobel operators
        const gx = p00 + 2 * p10 + p20 - p02 - 2 * p12 - p22;
        const gy = p00 + 2 * p01 + p02 - p20 - 2 * p21 - p22;
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edgeMap[idx] = magnitude > 50 ? 255 : 0;
      }
    }
    
    return edgeMap;
  };

  const getBrightness = (data, x, y, width) => {
    const idx = (y * width + x) * 4;
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
  };

  // Flood fill to find background regions
  const findBackgroundRegions = (edgeMap, width, height) => {
    const visited = new Uint8Array(width * height);
    const backgroundMask = new Uint8Array(width * height);
    
    // Start flood fill from corners and edges
    const startPoints = [
      [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
      [width / 2, 0], [width / 2, height - 1], [0, height / 2], [width - 1, height / 2]
    ];
    
    startPoints.forEach(([x, y]) => {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        floodFill(edgeMap, visited, backgroundMask, x, y, width, height);
      }
    });
    
    return backgroundMask;
  };

  const floodFill = (edgeMap, visited, backgroundMask, startX, startY, width, height) => {
    const stack = [[startX, startY]];
    
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx]) {
        continue;
      }
      
      visited[idx] = 1;
      
      // If not an edge and not already marked as background
      if (edgeMap[idx] === 0 && backgroundMask[idx] === 0) {
        backgroundMask[idx] = 1;
        
        // Add neighbors to stack
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }
  };

  // Advanced clothing detection using color clustering
  const detectClothingAdvanced = (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Sample colors from the image
    const colorSamples = [];
    const step = Math.max(1, Math.floor((width * height) / 1000));
    
    for (let i = 0; i < data.length; i += step * 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Skip very bright or very dark pixels
      const brightness = (r + g + b) / 3;
      if (brightness > 240 || brightness < 20) continue;
      
      colorSamples.push({ r, g, b });
    }
    
    // Simple clustering to find dominant colors
    const clusters = kMeansClustering(colorSamples, 5);
    
    // Check if clusters contain typical clothing colors
    let clothingScore = 0;
    clusters.forEach(cluster => {
      const { r, g, b } = cluster.center;
      
      // Check for typical clothing colors (not pure white, black, or gray)
      const brightness = (r + g + b) / 3;
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      
      if (brightness > 30 && brightness < 220 && saturation > 20) {
        clothingScore += cluster.points.length;
      }
    });
    
    const totalSamples = colorSamples.length;
    return (clothingScore / totalSamples) > 0.4;
  };

  // Simple k-means clustering
  const kMeansClustering = (points, k) => {
    if (points.length === 0) return [];
    
    // Initialize centers randomly
    const centers = [];
    for (let i = 0; i < k; i++) {
      const randomPoint = points[Math.floor(Math.random() * points.length)];
      centers.push({ ...randomPoint });
    }
    
    const clusters = centers.map(center => ({
      center,
      points: []
    }));
    
    // Simple iteration (not full k-means, but good enough for our use case)
    for (let iteration = 0; iteration < 5; iteration++) {
      // Clear points
      clusters.forEach(cluster => cluster.points = []);
      
      // Assign points to nearest center
      points.forEach(point => {
        let minDistance = Infinity;
        let nearestCluster = 0;
        
        clusters.forEach((cluster, i) => {
          const distance = Math.sqrt(
            Math.pow(point.r - cluster.center.r, 2) +
            Math.pow(point.g - cluster.center.g, 2) +
            Math.pow(point.b - cluster.center.b, 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = i;
          }
        });
        
        clusters[nearestCluster].points.push(point);
      });
      
      // Update centers
      clusters.forEach(cluster => {
        if (cluster.points.length > 0) {
          const avgR = cluster.points.reduce((sum, p) => sum + p.r, 0) / cluster.points.length;
          const avgG = cluster.points.reduce((sum, p) => sum + p.g, 0) / cluster.points.length;
          const avgB = cluster.points.reduce((sum, p) => sum + p.b, 0) / cluster.points.length;
          
          cluster.center = {
            r: Math.round(avgR),
            g: Math.round(avgG),
            b: Math.round(avgB)
          };
        }
      });
    }
    
    return clusters;
  };

  const processImage = async (file) => {
    setIsProcessing(true);
    setProgress(0);
    setProcessingStep('Loading image...');
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          try {
            setProgress(10);
            setProcessingStep('Analyzing image...');
            
            // Create canvas for processing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image to canvas
            ctx.drawImage(img, 0, 0);
            setProgress(20);
            
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setProgress(25);
            
            // Detect if image contains clothing
            setProcessingStep('Detecting clothing...');
            const hasClothing = detectClothingAdvanced(imageData);
            setProgress(30);
            
            if (!hasClothing) {
              alert('No clothing detected in the image. Please upload an image with a t-shirt or shirt.');
              setIsProcessing(false);
              setProgress(0);
              setProcessingStep('');
              return;
            }
            
            // Remove background using advanced algorithm
            const processedImageData = removeBackgroundAdvanced(imageData);
            setProgress(95);
            
            // Put processed image data back to canvas
            ctx.putImageData(processedImageData, 0, 0);
            setProcessingStep('Finalizing...');
            
            // Convert to blob
            canvas.toBlob((blob) => {
              const processedImageUrl = URL.createObjectURL(blob);
              setProcessedImage(processedImageUrl);
              setProgress(100);
              setProcessingStep('Complete!');
              
              // Create an image element for the processed image
              const processedImg = new Image();
              processedImg.onload = () => {
                onProcessedImage(processedImg);
                setIsProcessing(false);
                setProcessingStep('');
                resolve(processedImg);
              };
              processedImg.src = processedImageUrl;
            }, 'image/png');
            
          } catch (error) {
            console.error('Error processing image:', error);
            setIsProcessing(false);
            setProgress(0);
            setProcessingStep('');
          }
        };
        img.src = e.target.result;
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedImage(URL.createObjectURL(file));
      await processImage(file);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-4">
      <h2 className="text-xl font-semibold mb-4">Advanced Image Processing</h2>
      
      <div className="space-y-4">
        {/* Upload Section */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Upload T-Shirt/Shirt Image:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
          />
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{processingStep}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Image Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uploadedImage && (
            <div>
              <h3 className="text-sm font-medium mb-2">Original Image</h3>
              <img 
                src={uploadedImage} 
                alt="Original" 
                className="w-full h-auto rounded border border-gray-600"
              />
            </div>
          )}
          
          {processedImage && (
            <div>
              <h3 className="text-sm font-medium mb-2">Processed Image (Background Removed)</h3>
              <img 
                src={processedImage} 
                alt="Processed" 
                className="w-full h-auto rounded border border-gray-600"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #ccc 25%, transparent 25%), 
                    linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #ccc 75%), 
                    linear-gradient(-45deg, transparent 75%, #ccc 75%)
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
              />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-green-900 p-3 rounded text-sm">
          <h4 className="font-medium mb-2">Advanced Processing Features:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Advanced clothing detection using color clustering</li>
            <li>Edge detection for precise background removal</li>
            <li>Flood fill algorithm for background identification</li>
            <li>Real-time processing progress with detailed steps</li>
            <li>High-quality background removal for virtual try-on</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 