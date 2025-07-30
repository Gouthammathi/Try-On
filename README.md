# Virtual Try-On System

A real-time virtual try-on system that allows users to upload t-shirt images, automatically detect clothing, remove backgrounds, and overlay them on live video feed.

## Features

### 🎯 Advanced Image Processing
- **Automatic Clothing Detection**: Uses color clustering algorithms to detect t-shirts and shirts in uploaded images
- **Background Removal**: Advanced edge detection and flood fill algorithms for precise background removal
- **Real-time Processing**: Live progress tracking with detailed processing steps
- **High-quality Output**: Produces transparent PNG images ready for virtual try-on

### 🎥 Real-time Virtual Try-On
- **Pose Detection**: Uses TensorFlow.js MoveNet model for accurate body keypoint detection
- **Dynamic Overlay**: T-shirt images are automatically scaled and positioned based on body keypoints
- **Match Scoring**: Real-time scoring system showing how well the t-shirt fits the detected pose
- **Interactive Controls**: Toggle keypoints, overlay, and comparison views

## How It Works

### Image Processing Pipeline
1. **Upload**: User uploads an image containing a t-shirt or shirt
2. **Detection**: Advanced algorithms detect clothing items using color clustering
3. **Edge Detection**: Sobel operator identifies edges in the image
4. **Background Removal**: Flood fill algorithm removes background while preserving clothing
5. **Output**: Transparent PNG ready for virtual try-on

### Virtual Try-On Pipeline
1. **Pose Detection**: Real-time body keypoint detection using webcam
2. **Keypoint Calculation**: T-shirt keypoints calculated based on body pose
3. **Overlay**: Processed t-shirt image overlaid on live video
4. **Scoring**: Real-time match score calculation

## Technical Stack

- **Frontend**: React 19 with Vite
- **Computer Vision**: TensorFlow.js, MoveNet pose detection
- **Image Processing**: Custom algorithms for edge detection and background removal
- **Styling**: Tailwind CSS
- **Real-time Processing**: Canvas API for image manipulation

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Upload and Process Images**:
   - Click "Upload T-Shirt/Shirt Image"
   - Wait for automatic processing
   - View original and processed images side by side

4. **Try-On Mode**:
   - Allow camera access for pose detection
   - Toggle controls to customize the experience
   - Watch real-time t-shirt overlay on your body

## Usage Tips

- **Image Quality**: Use high-quality images with good contrast between clothing and background
- **Lighting**: Ensure good lighting for accurate pose detection
- **Clothing**: Upload images with clearly visible t-shirts or shirts
- **Background**: Simple backgrounds work best for automatic removal

## Advanced Features

- **Edge Detection**: Sobel operator for precise edge identification
- **Flood Fill**: Algorithm for background region identification
- **Color Clustering**: K-means clustering for clothing detection
- **Real-time Feedback**: Live progress tracking and processing steps
- **Quality Assurance**: Automatic validation of clothing detection

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

Requires WebGL support for TensorFlow.js operations.
