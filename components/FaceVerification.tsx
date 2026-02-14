'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { verifyFaceId } from '@/lib/actions/user.actions';

interface FaceVerificationProps {
  userId: number;
  onSuccess: () => void;
  onFallback: () => void;
  onError: (error: string) => void;
}

const FaceVerification: React.FC<FaceVerificationProps> = ({
  userId,
  onSuccess,
  onFallback,
  onError
}) => {
  const webcamRef = useRef<Webcam & { video: HTMLVideoElement | null }>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing camera...');
  const [cameraError, setCameraError] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [faceapi, setFaceapi] = useState<any>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    // Tạo canvas element
    canvasRef.current = document.createElement('canvas');
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    const loadFaceApi = async () => {
      try {
        const faceApiModule = await import('face-api.js');
        setFaceapi(faceApiModule);
      } catch (error) {
        console.error('Failed to load face-api:', error);
        setCameraError(true);
        onError('Failed to load face detection library');
      }
    };
    
    loadFaceApi();
  }, [onError]);

  useEffect(() => {
    if (!faceapi) return;

    const loadModels = async () => {
      try {
        setStatusMessage('Loading face detection models...');
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
        ]);
        
        setIsModelLoaded(true);
        setStatusMessage('Look at the camera');
      } catch (error) {
        console.error('Failed to load models:', error);
        setCameraError(true);
        onError('Failed to initialize face detection');
      }
    };
    
    loadModels();
  }, [faceapi, onError]);

  useEffect(() => {
    if (!isModelLoaded || !webcamRef.current || cameraError || verificationSuccess || !faceapi || !isCameraReady || !canvasRef.current) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    let isProcessing = false;
    let frameCount = 0;

    intervalRef.current = setInterval(async () => {
      if (isProcessing) return;
      isProcessing = true;

      try {
        if (!webcamRef.current?.video || !canvasRef.current) {
          isProcessing = false;
          return;
        }

        const video = webcamRef.current.video;
        
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
          isProcessing = false;
          return;
        }

        if (video.videoWidth === 0 || video.videoHeight === 0) {
          isProcessing = false;
          return;
        }

        // Cấu hình canvas cho performance
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          isProcessing = false;
          return;
        }

        // Resize canvas theo video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Vẽ frame hiện tại lên canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Chỉ detect mỗi 3 frame để giảm tải
        frameCount++;
        if (frameCount % 3 !== 0) {
          isProcessing = false;
          return;
        }

        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5
        });
        
        // Detect faces từ canvas
        const faces = await faceapi.detectAllFaces(canvas, options);
        
        if (faces && Array.isArray(faces) && faces.length > 0) {
          const validFaces = faces.filter((face: any) => {
            if (!face || !face.box) return false;
            const box = face.box;
            return box && 
                   typeof box.x === 'number' && !isNaN(box.x) &&
                   typeof box.y === 'number' && !isNaN(box.y) &&
                   typeof box.width === 'number' && !isNaN(box.width) &&
                   typeof box.height === 'number' && !isNaN(box.height) &&
                   box.width > 50 && 
                   box.height > 50;
          });

          if (validFaces.length > 0) {
            try {
              // Detect chi tiết từ canvas
              const detections = await faceapi
                .detectAllFaces(canvas, options)
                .withFaceLandmarks()
                .withFaceDescriptors();

              if (detections && detections.length > 0) {
                const validDetections = detections.filter((d: any) => {
                  if (!d || !d.detection || !d.detection.box) return false;
                  
                  const box = d.detection.box;
                  return box && 
                         typeof box.x === 'number' && !isNaN(box.x) &&
                         typeof box.y === 'number' && !isNaN(box.y) &&
                         typeof box.width === 'number' && !isNaN(box.width) &&
                         typeof box.height === 'number' && !isNaN(box.height) &&
                         box.width > 50 && 
                         box.height > 50 &&
                         d.descriptor && 
                         d.descriptor instanceof Float32Array &&
                         d.descriptor.length > 0;
                });
                
                setFaceDetected(validDetections.length > 0);
                
                if (validDetections.length > 0 && !isVerifying && !verificationSuccess) {
                  handleFaceVerification(validDetections[0].descriptor);
                }
              } else {
                setFaceDetected(true);
              }
            } catch (detailError) {
              console.error('Detailed detection error:', detailError);
              setFaceDetected(true);
            }
          } else {
            setFaceDetected(false);
          }
        } else {
          setFaceDetected(false);
        }
      } catch (error) {
        console.error('Face detection error:', error);
      } finally {
        isProcessing = false;
      }
    }, 200); // Giảm xuống 200ms

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isModelLoaded, isVerifying, verificationSuccess, cameraError, faceapi, isCameraReady]);

  const handleFaceVerification = useCallback(async (descriptor: Float32Array) => {
    setIsVerifying(true);
    setStatusMessage('Verifying...');

    try {
      const descriptorArray = Array.from(descriptor);
      const descriptorBase64 = btoa(JSON.stringify(descriptorArray));

      const result = await verifyFaceId(userId, descriptorBase64);

      if (result.success) {
        setVerificationSuccess(true);
        setStatusMessage('Success!');
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        const newFailCount = failCount + 1;
        setFailCount(newFailCount);
        
        if (newFailCount >= 2) {
          setStatusMessage('Failed 2 times. Use password');
          setTimeout(() => {
            onFallback();
          }, 1500);
        } else {
          setStatusMessage(`Try again (${newFailCount}/2)`);
          setIsVerifying(false);
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatusMessage('Error. Try again');
      setIsVerifying(false);
    }
  }, [userId, failCount, onSuccess, onFallback]);

  const retryFaceVerification = () => {
    setFailCount(0);
    setIsVerifying(false);
    setCameraError(false);
    setStatusMessage('Look at the camera');
  };

  if (!isModelLoaded && !cameraError) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">{statusMessage}</p>
      </div>
    );
  }

  if (cameraError) {
    return (
      <div className="flex flex-col items-center space-y-6 p-8 bg-white rounded-lg shadow-lg">
        <XCircle className="w-16 h-16 text-red-500" />
        <h3 className="text-xl font-semibold text-gray-900">Camera Error</h3>
        <p className="text-gray-600 text-center">Please use password to login</p>
        <Button onClick={onFallback} className="bg-blue-600 hover:bg-blue-700">
          Use Password
        </Button>
      </div>
    );
  }

  if (verificationSuccess) {
    return (
      <div className="flex flex-col items-center space-y-6 p-8 bg-white rounded-lg shadow-lg">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h3 className="text-xl font-semibold text-gray-900">Login Successful</h3>
        <p className="text-gray-600">Welcome back!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-900">Face Verification</h2>
      
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
          className="rounded-lg border-4 border-blue-500"
          onUserMediaError={() => setCameraError(true)}
          onUserMedia={() => setIsCameraReady(true)}
        />
        {faceDetected && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            Face Detected
          </div>
        )}
        {isVerifying && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Camera className="w-5 h-5 text-blue-500" />
        <p className="text-gray-700">{statusMessage}</p>
      </div>

      {failCount > 0 && (
        <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p>Failed {failCount}/2. Use password after 2 fails.</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button
          onClick={retryFaceVerification}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </Button>
        
        <Button
          onClick={onFallback}
          variant="ghost"
          className="text-gray-500"
        >
          Use Password
        </Button>
      </div>
    </div>
  );
};

export default FaceVerification;