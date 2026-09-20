import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createWorker, PSM } from 'tesseract.js';
import {
  Camera,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Keyboard,
  Upload,
  Sparkles,
  ScanLine
} from 'lucide-react';

import { cleanRegNoCandidate, isValidRegNo, parseRegdNumber } from '../utils/ocrUtils';
export { cleanRegNoCandidate, isValidRegNo, parseRegdNumber };

export default function BarcodeScanner({ onScanSuccess, isProcessing = false }) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [ocrStatus, setOcrStatus] = useState('Standby'); // 'Initializing', 'Scanning', 'Detected', 'Uncertain'
  const [ocrMessage, setOcrMessage] = useState('Align Regd. No inside frame');
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);

  const videoRef = useRef(null);
  const reticleRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const ocrTimerRef = useRef(null);
  const isAnalyzingFrameRef = useRef(false);
  const lastScanTimeRef = useRef({ code: null, time: 0 });
  const fileInputRef = useRef(null);
  const candidateRef = useRef({ code: null, count: 0, firstSeen: 0 });
  const barcodeDetectorRef = useRef(null);

  // Initialize native hardware BarcodeDetector if supported in the browser
  useEffect(() => {
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new window.BarcodeDetector({
          formats: ['code_128', 'code_39', 'qr_code', 'ean_13', 'upc_a']
        });
      } catch {
        barcodeDetectorRef.current = null;
      }
    }
  }, []);

  // Audio feedback tone on successful identification
  const playBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880; // A5 tone
      gain.gain.value = 0.12;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        audioCtx.close();
      }, 130);
    } catch {
      // Audio context not allowed or unsupported
    }
  }, []);

  // Handle successful registration number identification
  const handleIdentifiedRegNo = useCallback(
    (regNo) => {
      const cleanCode = regNo.trim().toUpperCase();
      if (!cleanCode) return;

      // Duplicate prevention cooldown (5 seconds for same registration number)
      const now = Date.now();
      if (
        lastScanTimeRef.current.code === cleanCode &&
        now - lastScanTimeRef.current.time < 5000
      ) {
        return;
      }

      lastScanTimeRef.current = { code: cleanCode, time: now };
      setLastScannedCode(cleanCode);
      setOcrStatus('Detected');
      setOcrMessage(`Identified: ${cleanCode}`);
      playBeep();

      if (onScanSuccess) {
        onScanSuccess(cleanCode);
      }
    },
    [onScanSuccess, playBeep]
  );

  // Initialize Tesseract OCR Worker
  useEffect(() => {
    let isCancelled = false;

    async function initTesseract() {
      try {
        setOcrStatus('Initializing');
        setOcrMessage('Initializing OCR engine...');

        const worker = await createWorker('eng');

        // Whitelist alphanumeric characters, dots, colons, hyphens for Regd. No extraction
        await worker.setParameters({
          tessedit_char_whitelist:
            '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.:- ',
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK
        });

        if (!isCancelled) {
          workerRef.current = worker;
          setIsWorkerReady(true);
          setOcrStatus('Standby');
          setOcrMessage('Align Regd. No inside frame');
        } else {
          await worker.terminate();
        }
      } catch (err) {
        console.error('Error initializing Tesseract OCR:', err);
        if (!isCancelled) {
          setOcrMessage('OCR initialization error. Use manual input if needed.');
        }
      }
    }

    initTesseract();

    return () => {
      isCancelled = true;
      if (workerRef.current) {
        workerRef.current.terminate().catch(() => {});
        workerRef.current = null;
      }
    };
  }, []);

  // Enumerate camera devices
  const initCameras = useCallback(async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setCameraError('Camera API is not supported in this browser. Please use manual input.');
        setShowManualInput(true);
        return;
      }

      // Trigger permission query
      const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
      initialStream.getTracks().forEach((t) => t.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');

      if (videoDevices.length > 0) {
        setCameras(videoDevices);
        // Prioritize back/environment facing camera on mobile
        const backCam = videoDevices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('rear')
        );
        setSelectedCameraId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
      } else {
        setCameraError('No camera found on this device. You can use manual input.');
        setShowManualInput(true);
      }
    } catch (err) {
      console.warn('Camera enumeration error:', err);
      setCameraError(
        'Camera permission was denied or device is unavailable. Please grant camera permission or use manual input below.'
      );
      setShowManualInput(true);
    }
  }, []);

  // Start continuous video stream
  const startCamera = useCallback(
    async (deviceId) => {
      try {
        setCameraError(null);

        // Stop any existing stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        let stream;
        try {
          // Attempt HD resolution with continuous auto-focus for maximum text clarity
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: deviceId ? { exact: deviceId } : undefined,
              facingMode: deviceId ? undefined : { ideal: 'environment' },
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
              advanced: [{ focusMode: 'continuous' }]
            },
            audio: false
          });
        } catch {
          // Fallback to standard 720p constraints if advanced options are not supported
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: deviceId ? { exact: deviceId } : undefined,
              facingMode: deviceId ? undefined : { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });
        }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setIsScanning(true);
        setOcrStatus('Scanning');
        setOcrMessage('Align Regd. No inside frame');
      } catch (err) {
        console.error('Failed to start camera:', err);
        setCameraError(`Camera initialization failed: ${err.message || err}`);
        setIsScanning(false);
      }
    },
    []
  );

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setOcrStatus('Standby');
  }, []);

  // Initialize camera list on mount
  useEffect(() => {
    initCameras();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (ocrTimerRef.current) {
        clearInterval(ocrTimerRef.current);
      }
    };
  }, [initCameras]);

  // Preprocess cropped canvas: upscale, grayscale, contrast stretch with smooth S-curve
  const preprocessCanvas = useCallback((sourceCanvas) => {
    const sw = sourceCanvas.width;
    const sh = sourceCanvas.height;
    if (sw === 0 || sh === 0) return null;

    // 2x scale for crisp font stroke definition
    const scale = 2.0;
    const tw = Math.round(sw * scale);
    const th = Math.round(sh * scale);

    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = tw;
    targetCanvas.height = th;
    const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, sw, sh, 0, 0, tw, th);

    const imgData = ctx.getImageData(0, 0, tw, th);
    const d = imgData.data;

    let min = 255;
    let max = 0;
    const grays = new Uint8Array(tw * th);

    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      const gray = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
      grays[j] = gray;
      if (gray < min) min = gray;
      if (gray > max) max = gray;
    }

    const range = max - min || 1;

    // Dynamic contrast stretch: darkens text, brightens background, preserves anti-aliased character edges
    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      let val = Math.round(((grays[j] - min) / range) * 255);
      // Gentle S-curve to remove background noise while keeping digit strokes intact
      if (val < 130) {
        val = Math.max(0, Math.round(val * 0.75));
      } else {
        val = Math.min(255, Math.round(val * 1.15));
      }
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    }

    ctx.putImageData(imgData, 0, 0);
    return targetCanvas;
  }, []);

  // Process single frame from video focusing on the reticle region
  const captureAndRecognizeFrame = useCallback(async () => {
    if (
      !isScanning ||
      !isWorkerReady ||
      !workerRef.current ||
      isAnalyzingFrameRef.current ||
      isProcessing ||
      !videoRef.current ||
      !reticleRef.current
    ) {
      return;
    }

    const video = videoRef.current;
    const reticle = reticleRef.current;

    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    isAnalyzingFrameRef.current = true;

    try {
      const videoRect = video.getBoundingClientRect();
      const reticleRect = reticle.getBoundingClientRect();

      // Compute scale between rendered video element and native video resolution
      const scaleX = video.videoWidth / (videoRect.width || 1);
      const scaleY = video.videoHeight / (videoRect.height || 1);

      // Focus strictly on the reticle bounding box
      const sx = Math.max(0, (reticleRect.left - videoRect.left) * scaleX);
      const sy = Math.max(0, (reticleRect.top - videoRect.top) * scaleY);
      const sw = Math.min(video.videoWidth - sx, reticleRect.width * scaleX);
      const sh = Math.min(video.videoHeight - sy, reticleRect.height * scaleY);

      if (sw <= 10 || sh <= 10) {
        isAnalyzingFrameRef.current = false;
        return;
      }

      // Crop reticle area to offscreen canvas
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = sw;
      cropCanvas.height = sh;
      const cropCtx = cropCanvas.getContext('2d');
      cropCtx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

      // 1. Check for physical barcode or QR code with 100% hardware precision
      if (barcodeDetectorRef.current) {
        try {
          const detectedBarcodes = await barcodeDetectorRef.current.detect(cropCanvas);
          if (detectedBarcodes && detectedBarcodes.length > 0) {
            const rawVal = detectedBarcodes[0].rawValue?.trim();
            if (rawVal) {
              const cleaned = cleanRegNoCandidate(rawVal);
              if (isValidRegNo(cleaned)) {
                candidateRef.current = { code: null, count: 0, firstSeen: 0 };
                handleIdentifiedRegNo(cleaned);
                isAnalyzingFrameRef.current = false;
                return;
              }
            }
          }
        } catch {
          // Fall through to OCR
        }
      }

      // 2. High-Precision OCR with contrast enhancement
      const processedCanvas = preprocessCanvas(cropCanvas);
      if (!processedCanvas) {
        isAnalyzingFrameRef.current = false;
        return;
      }

      // Execute OCR
      const { data } = await workerRef.current.recognize(processedCanvas);
      const text = data?.text || '';

      if (text.trim().length > 3) {
        const extractedRegNo = parseRegdNumber(text);
        if (extractedRegNo) {
          const now = Date.now();
          // Frame Stabilization: require 2 matching readings within 2.5 seconds to eliminate misreadings
          if (
            candidateRef.current.code === extractedRegNo &&
            now - candidateRef.current.firstSeen < 2500
          ) {
            candidateRef.current.count += 1;
            if (candidateRef.current.count >= 2) {
              candidateRef.current = { code: null, count: 0, firstSeen: 0 };
              handleIdentifiedRegNo(extractedRegNo);
            } else {
              setOcrStatus('Scanning');
              setOcrMessage(`Verifying ${extractedRegNo}...`);
            }
          } else {
            // First time this candidate is observed
            candidateRef.current = { code: extractedRegNo, count: 1, firstSeen: now };
            setOcrStatus('Scanning');
            setOcrMessage(`Checking ${extractedRegNo}...`);
          }
        } else {
          // If no code detected for >1.5s, clear stale candidate
          if (Date.now() - candidateRef.current.firstSeen > 1500) {
            candidateRef.current = { code: null, count: 0, firstSeen: 0 };
          }
          setOcrMessage('Align Regd. No inside frame');
        }
      }
    } catch (err) {
      console.warn('Frame recognition error:', err);
    } finally {
      isAnalyzingFrameRef.current = false;
    }
  }, [isScanning, isWorkerReady, isProcessing, preprocessCanvas, handleIdentifiedRegNo]);

  // Continuous frame analysis loop (runs every 480ms while scanning)
  useEffect(() => {
    if (isScanning && isWorkerReady && !isProcessing) {
      ocrTimerRef.current = setInterval(() => {
        captureAndRecognizeFrame();
      }, 480);
    } else {
      if (ocrTimerRef.current) {
        clearInterval(ocrTimerRef.current);
        ocrTimerRef.current = null;
      }
    }

    return () => {
      if (ocrTimerRef.current) {
        clearInterval(ocrTimerRef.current);
        ocrTimerRef.current = null;
      }
    };
  }, [isScanning, isWorkerReady, isProcessing, captureAndRecognizeFrame]);

  // Camera switch handler
  const handleCameraChange = (e) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    if (isScanning) {
      startCamera(newId);
    }
  };

  // Manual code submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const cleaned = cleanRegNoCandidate(manualCode.trim());
    if (isValidRegNo(cleaned)) {
      handleIdentifiedRegNo(cleaned);
    } else {
      setOcrMessage(`Invalid Registration Number: ${manualCode}`);
    }
  };

  // Process uploaded card image
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !workerRef.current) return;

    setOcrStatus('Scanning');
    setOcrMessage('Reading uploaded ID card image...');

    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const processed = preprocessCanvas(canvas) || canvas;
          const { data } = await workerRef.current.recognize(processed);
          const regNo = parseRegdNumber(data?.text || '');

          if (regNo) {
            handleIdentifiedRegNo(regNo);
          } else {
            setOcrMessage('Could not find a valid Registration Number on this image.');
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image upload OCR error:', err);
      setOcrMessage('Error processing image. Please try another photo.');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col items-center">
      {/* Header & Controls Bar */}
      <div className="w-full bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isScanning
                ? 'bg-emerald-400 animate-ping'
                : isWorkerReady
                ? 'bg-amber-400'
                : 'bg-slate-500'
            }`}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {isScanning
              ? 'OCR Camera Active'
              : isWorkerReady
              ? 'Camera Standby (OCR Ready)'
              : 'Initializing OCR Engine...'}
          </span>
        </div>

        {cameras.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCameraId || ''}
              onChange={handleCameraChange}
              className="bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1 border border-slate-700 focus:ring-1 focus:ring-indigo-400 outline-none"
            >
              {cameras.map((c) => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label || `Camera ${c.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Video Viewport & Reticle */}
      <div className="w-full relative bg-black flex flex-col items-center justify-center min-h-[320px] max-h-[480px] overflow-hidden">
        {/* Live video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full max-h-[460px] object-cover transition-opacity duration-300 ${
            isScanning ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Reticle Viewfinder Overlay when camera is active */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
            {/* Viewfinder Target Box (focused on Regd. No card line) */}
            <div
              ref={reticleRef}
              className="relative w-[300px] sm:w-[340px] h-[100px] border-2 border-dashed border-indigo-400/90 rounded-2xl shadow-2xl bg-indigo-950/10 backdrop-blur-[0.5px]"
            >
              {/* Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

              {/* Animated Laser Beam */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-laser" />

              {/* Viewfinder Instruction Badge */}
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="text-[11px] font-medium tracking-wide bg-black/70 text-white/95 px-3 py-0.5 rounded-full shadow-sm">
                  {ocrMessage}
                </span>
              </div>
            </div>

            {/* OCR Live Indicator */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs border border-white/10 text-white text-[11px]">
              <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
              <span>Front ID Card OCR • Continuous Reader</span>
            </div>
          </div>
        )}

        {/* Camera Standby Placeholder */}
        {!isScanning && !cameraError && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400">
              <Camera className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">ID Card OCR Camera Ready</h4>
            <p className="text-xs text-slate-400 max-w-xs mb-5">
              Point your camera at the front side of the student ID card to automatically extract the
              printed Registration Number.
            </p>
            <button
              onClick={() => startCamera(selectedCameraId || cameras[0]?.deviceId)}
              disabled={!isWorkerReady}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>{isWorkerReady ? 'Start Camera Scanner' : 'Loading OCR Engine...'}</span>
            </button>
          </div>
        )}

        {/* Camera Permission / Access Error */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white">
            <ShieldAlert className="w-12 h-12 text-rose-400 mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">Camera Access Issue</h4>
            <p className="text-xs text-slate-300 max-w-sm mb-4">{cameraError}</p>
            <div className="flex gap-2">
              <button
                onClick={initCameras}
                className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
              <button
                onClick={() => setShowManualInput(true)}
                className="inline-flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg transition"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Manual Regd. No</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Actions & Manual Input Bar */}
      <div className="w-full p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {isScanning ? (
            <button
              onClick={stopCamera}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition border border-rose-200"
            >
              Stop Camera
            </button>
          ) : (
            <button
              onClick={() => startCamera(selectedCameraId || cameras[0]?.deviceId)}
              disabled={!isWorkerReady}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition border border-indigo-200 disabled:opacity-50"
            >
              Start Camera
            </button>
          )}

          <div className="flex items-center gap-2">
            {/* Optional Photo Upload for testing or mobile photo upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-2xs hover:bg-slate-50 transition"
              title="Upload photo of ID card front"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Upload Card Image</span>
            </button>

            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-2xs hover:bg-slate-50 transition"
            >
              <Keyboard className="w-3.5 h-3.5 text-slate-500" />
              <span>{showManualInput ? 'Hide Manual Input' : 'Type Regd. No'}</span>
            </button>
          </div>
        </div>

        {/* Fallback Manual Registration Number Input */}
        {showManualInput && (
          <form
            onSubmit={handleManualSubmit}
            className="pt-2 border-t border-slate-200/60 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter Regd. No (e.g. A23126511092)"
                className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim() || isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50 shrink-0"
            >
              {isProcessing ? 'Checking...' : 'Lookup Student'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
