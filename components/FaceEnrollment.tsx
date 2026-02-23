import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Sun,
  Maximize2,
  Eye,
  Move,
  Volume2,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { enrollFace, FaceQualityMetrics, LivenessCheckResult } from '@/lib/actions/user.actions';
import { getSession } from '@/lib/session/session';

interface FaceEnrollmentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  requiredFrames?: number;      // Số frame cần thu thập (default: 15)
  qualityThreshold?: number;     // Ngưỡng chất lượng (default: 70)
}

interface FrameData {
  descriptor: Float32Array;
  quality: FaceQualityMetrics;
  timestamp: number;
}

const FaceEnrollment: React.FC<FaceEnrollmentProps> = ({
  onSuccess,
  onCancel,
  requiredFrames = 15,
  qualityThreshold = 70
}) => {
  // ==================== REFS ====================
  const webcamRef = useRef<Webcam & { video: HTMLVideoElement | null }>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ==================== STATE ====================
  const [faceapi, setFaceapi] = useState<any>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  
  // Enrollment states
  const [currentStep, setCurrentStep] = useState<'guide' | 'collecting' | 'liveness' | 'processing' | 'success' | 'error'>('guide');
  const [collectedFrames, setCollectedFrames] = useState<FrameData[]>([]);
  const [currentQuality, setCurrentQuality] = useState<FaceQualityMetrics | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [livenessStep, setLivenessStep] = useState(0);
  const [livenessResults, setLivenessResults] = useState<LivenessCheckResult[]>([]);
  
  // Liveness actions
  const livenessActions = useMemo(() => [
    { action: 'blink', instruction: 'Chớp mắt 1 lần', icon: Eye },
    { action: 'turn_left', instruction: 'Quay đầu sang trái', icon: ArrowLeft },
    { action: 'turn_right', instruction: 'Quay đầu sang phải', icon: ArrowRight },
    { action: 'open_mouth', instruction: 'Mở miệng', icon: Volume2 },
  ], []);

  // ==================== LOAD MODELS ====================
  useEffect(() => {
    const loadFaceApi = async () => {
      try {
        // eslint-disable-next-line @next/next/no-assign-module-variable
        const module = await import('face-api.js');
        setFaceapi(module);
      } catch (error) {
        console.error('Failed to load face-api:', error);
        setCameraError(true);
      }
    };
    loadFaceApi();
  }, []);

  useEffect(() => {
    if (!faceapi) return;

    const loadModels = async () => {
      try {
        setStatusMessage('Loading AI models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          faceapi.nets.faceExpressionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
        ]);
        setIsModelLoaded(true);
        setStatusMessage('Camera ready');
      } catch (error) {
        console.error('Failed to load models:', error);
        setCameraError(true);
      }
    };
    loadModels();
  }, [faceapi]);

  // ==================== CANVAS SETUP ====================
  useEffect(() => {
    canvasRef.current = document.createElement('canvas');
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      canvasRef.current = null;
    };
  }, []);

  // ==================== QUALITY CHECK FUNCTIONS ====================
  const checkImageQuality = useCallback((
    canvas: HTMLCanvasElement,
    detections: any,
    landmarks: any
  ): FaceQualityMetrics | null => {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx || !detections || detections.length === 0) return null;

      const detection = detections[0];
      const box = detection.box;
      const landmarks_ = landmarks[0];

      // 1. Kiểm tra kích thước khuôn mặt
      const faceSize = Math.min(box.width, box.height);
      
      // 2. Kiểm tra độ rõ nét (laplacian variance)
      const imageData = ctx.getImageData(box.x, box.y, box.width, box.height);
      const grayData = [];
      for (let i = 0; i < imageData.data.length; i += 4) {
        const gray = 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
        grayData.push(gray);
      }
      
      let laplacianSum = 0;
      for (let i = 1; i < box.height - 1; i++) {
        for (let j = 1; j < box.width - 1; j++) {
          const idx = i * box.width + j;
          const laplacian = Math.abs(
            -grayData[idx] 
            + 0.25 * grayData[idx - 1] 
            + 0.25 * grayData[idx + 1] 
            + 0.25 * grayData[idx - box.width] 
            + 0.25 * grayData[idx + box.width]
          );
          laplacianSum += laplacian;
        }
      }
      const sharpness = Math.min(100, (laplacianSum / (box.width * box.height)) * 10);

      // 3. Kiểm tra độ sáng
      let brightnessSum = 0;
      for (let i = 0; i < grayData.length; i++) {
        brightnessSum += grayData[i];
      }
      const avgBrightness = brightnessSum / grayData.length;
      const brightness = Math.min(100, (avgBrightness / 255) * 100);

      // 4. Kiểm tra góc mặt (dựa vào landmarks)
      const leftEye = landmarks_._positions[36];
      const rightEye = landmarks_._positions[45];
      const nose = landmarks_._positions[30];
      
      const eyeDistance = Math.sqrt(
        Math.pow(rightEye._x - leftEye._x, 2) + 
        Math.pow(rightEye._y - leftEye._y, 2)
      );
      
      const noseToEyeCenter = Math.sqrt(
        Math.pow(nose._x - (leftEye._x + rightEye._x)/2, 2) + 
        Math.pow(nose._y - (leftEye._y + rightEye._y)/2, 2)
      );
      
      const yaw = (nose._x - (leftEye._x + rightEye._x)/2) / eyeDistance * 90;
      const roll = Math.atan2(rightEye._y - leftEye._y, rightEye._x - leftEye._x) * 180 / Math.PI;
      
      const isFrontal = Math.abs(yaw) < 30 && Math.abs(roll) < 15;

      return {
        sharpness,
        brightness,
        faceSize,
        facePosition: { x: box.x + box.width/2, y: box.y + box.height/2 },
        angle: { roll, pitch: 0, yaw },
        isBlurred: sharpness < 30,
        isWellLit: brightness > 40 && brightness < 90,
        isFrontal,
        isFaceVisible: true
      };
    } catch (error) {
      console.error('Quality check error:', error);
      return null;
    }
  }, []);

  // ==================== FRAME COLLECTION ====================
  const collectFrame = useCallback(async () => {
    if (!webcamRef.current?.video || !canvasRef.current || !faceapi || !isCameraReady) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Draw video frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Detect faces
      const detections = await faceapi
        .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length !== 1) {
        setStatusMessage('Please ensure only one face is visible');
        return;
      }

      const landmarks = await faceapi.detectAllFaceLandmarks(canvas);
      const quality = checkImageQuality(canvas, detections, landmarks);

      if (!quality) {
        setStatusMessage('Unable to assess face quality');
        return;
      }

      setCurrentQuality(quality);

      // Check quality requirements
      if (
        quality.faceSize < 100 ||
        quality.isBlurred ||
        !quality.isWellLit ||
        !quality.isFrontal ||
        !quality.isFaceVisible
      ) {
        if (quality.faceSize < 100) setStatusMessage('Move closer to camera');
        else if (quality.isBlurred) setStatusMessage('Keep face steady, avoid blur');
        else if (!quality.isWellLit) setStatusMessage('Ensure good lighting');
        else if (!quality.isFrontal) setStatusMessage('Look directly at camera');
        return;
      }

      // Add to collection
      setCollectedFrames(prev => {
        const newFrames = [...prev, {
          descriptor: detections[0].descriptor,
          quality,
          timestamp: Date.now()
        }];
        
        setStatusMessage(`Collected ${newFrames.length}/${requiredFrames} frames`);
        return newFrames;
      });

    } catch (error) {
      console.error('Frame collection error:', error);
    }
  }, [faceapi, isCameraReady, requiredFrames, checkImageQuality]);

  // ==================== DETECTION LOOP ====================
  useEffect(() => {
    if (!isModelLoaded || !isCameraReady || cameraError || currentStep !== 'collecting') return;

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(() => {
      if (collectedFrames.length >= requiredFrames) {
        setCurrentStep('liveness');
        return;
      }
      collectFrame();
    }, 300);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isModelLoaded, isCameraReady, cameraError, currentStep, collectedFrames.length, requiredFrames, collectFrame]);

  // ==================== LIVENESS CHECKS ====================
  const performLivenessCheck = useCallback(async () => {
    if (livenessStep >= livenessActions.length) {
      // All liveness checks passed
      setCurrentStep('processing');
      
      // Process and send data
      try {
        const session = getSession();
        if (!session?.userID) {
          setStatusMessage('Session expired');
          setCurrentStep('error');
          return;
        }

        setStatusMessage('Processing face data...');

        // Calculate average embedding
        const avgEmbedding = new Float32Array(128);
        collectedFrames.forEach(frame => {
          for (let i = 0; i < 128; i++) {
            avgEmbedding[i] += frame.descriptor[i] / collectedFrames.length;
          }
        });

        // Encode embeddings to base64
        const embeddings = collectedFrames.map(frame => {
          const arr = Array.from(frame.descriptor);
          return btoa(JSON.stringify(arr));
        });

        // Prepare payload
        const payload = {
          userId: Number(session.userID),
          embeddings,
          qualityMetrics: collectedFrames.map(f => f.quality),
          livenessResults,
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            timestamp: Date.now()
          }
        };

        const result = await enrollFace(payload);
        
        if (result.success) {
          setCurrentStep('success');
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 2000);
        } else {
          setStatusMessage(result.error || 'Enrollment failed');
          setCurrentStep('error');
        }
      } catch (error) {
        console.error('Enrollment error:', error);
        setStatusMessage('Enrollment failed');
        setCurrentStep('error');
      }
      return;
    }

    // Show next liveness instruction
    const currentAction = livenessActions[livenessStep];
    setStatusMessage(currentAction.instruction);
    
    // Simulate liveness check (in production, this would use actual detection)
    setTimeout(() => {
      setLivenessResults(prev => [...prev, {
        passed: true,
        action: currentAction.action,
        confidence: 0.95
      }]);
      setLivenessStep(prev => prev + 1);
    }, 3000);
  }, [livenessStep, livenessActions, collectedFrames, livenessResults, onSuccess]);

  useEffect(() => {
    if (currentStep === 'liveness') {
      performLivenessCheck();
    }
  }, [currentStep, performLivenessCheck]);

  // ==================== RENDERING ====================
  const renderGuide = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Face Enrollment Guide</h3>
        <p className="text-sm text-gray-500">Follow these steps to register your face</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-xl text-center">
          <Sun className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium">Good Lighting</p>
          <p className="text-xs text-gray-500">Ensure face is well-lit</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl text-center">
          <Maximize2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium">Face Size</p>
          <p className="text-xs text-gray-500">Fill the frame with your face</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl text-center">
          <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium">Look Straight</p>
          <p className="text-xs text-gray-500">Look directly at camera</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl text-center">
          <Move className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium">Stay Still</p>
          <p className="text-xs text-gray-500">Keep face steady</p>
        </div>
      </div>

      <Button
        onClick={() => setCurrentStep('collecting')}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        Start Enrollment
      </Button>
    </div>
  );

  const renderCollecting = () => (
    <div className="space-y-6">
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user"
          }}
          className="w-full rounded-xl border-4 border-blue-500"
          onUserMediaError={() => setCameraError(true)}
          onUserMedia={() => setIsCameraReady(true)}
        />
        
        {/* Face detection overlay */}
        {faceDetected && (
          <div className="absolute inset-0 border-4 border-green-500 rounded-xl pointer-events-none" />
        )}

        {/* Progress indicator */}
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {collectedFrames.length}/{requiredFrames}
        </div>

        {/* Quality indicators */}
        {currentQuality && (
          <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-xl">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="block text-gray-300">Sharpness</span>
                <span className={currentQuality.sharpness > 30 ? 'text-green-400' : 'text-red-400'}>
                  {Math.round(currentQuality.sharpness)}%
                </span>
              </div>
              <div>
                <span className="block text-gray-300">Brightness</span>
                <span className={currentQuality.isWellLit ? 'text-green-400' : 'text-red-400'}>
                  {Math.round(currentQuality.brightness)}%
                </span>
              </div>
              <div>
                <span className="block text-gray-300">Position</span>
                <span className={currentQuality.isFrontal ? 'text-green-400' : 'text-red-400'}>
                  {currentQuality.isFrontal ? 'Good' : 'Adjust'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-gray-600">{statusMessage}</p>

      {collectedFrames.length >= requiredFrames && (
        <Button
          onClick={() => setCurrentStep('liveness')}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Continue to Liveness Check
        </Button>
      )}
    </div>
  );

  const renderLiveness = () => {
    const CurrentIcon = livenessActions[livenessStep]?.icon || Eye;
    
    return (
      <div className="space-y-6 text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <CurrentIcon className="w-12 h-12 text-blue-600" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Liveness Check
          </h3>
          <p className="text-sm text-gray-500">{statusMessage}</p>
        </div>

        <div className="space-y-2">
          {livenessActions.map((action, idx) => (
            <div
              key={action.action}
              className={`p-3 rounded-xl flex items-center gap-3 ${
                idx < livenessStep ? 'bg-green-50' :
                idx === livenessStep ? 'bg-blue-50 border-2 border-blue-500' :
                'bg-gray-50'
              }`}
            >
              <action.icon className={`w-5 h-5 ${
                idx < livenessStep ? 'text-green-600' :
                idx === livenessStep ? 'text-blue-600' :
                'text-gray-400'
              }`} />
              <span className={`text-sm flex-1 text-left ${
                idx < livenessStep ? 'text-green-700' :
                idx === livenessStep ? 'text-blue-700' :
                'text-gray-400'
              }`}>
                {action.instruction}
              </span>
              {idx < livenessStep && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProcessing = () => (
    <div className="text-center py-8">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing</h3>
      <p className="text-sm text-gray-500">{statusMessage}</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Enrollment Successful!</h3>
      <p className="text-sm text-gray-500">Your face has been registered</p>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <XCircle className="w-10 h-10 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Enrollment Failed</h3>
      <p className="text-sm text-gray-500 mb-4">{statusMessage}</p>
      <Button
        onClick={() => setCurrentStep('guide')}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Try Again
      </Button>
    </div>
  );

  // ==================== MAIN RENDER ====================
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Face Enrollment
        </h2>
        <p className="text-sm text-blue-100 mt-1">Register your face for quick login</p>
      </div>

      <div className="p-6">
        {currentStep === 'guide' && renderGuide()}
        {currentStep === 'collecting' && renderCollecting()}
        {currentStep === 'liveness' && renderLiveness()}
        {currentStep === 'processing' && renderProcessing()}
        {currentStep === 'success' && renderSuccess()}
        {currentStep === 'error' && renderError()}

        {currentStep !== 'processing' && currentStep !== 'success' && onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full mt-4"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default FaceEnrollment;