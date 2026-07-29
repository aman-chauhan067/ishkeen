import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { AmbientGlow } from '../../../../components/motion';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCapturing, setIsCapturing] = useState(false);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    stopStream();
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported by your browser.');
        return;
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      setError(
        'Unable to access camera. Please allow camera permissions in your browser or choose a file instead.'
      );
    }
  }, [stopStream]);

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const handleSwitchCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Could not process image canvas.');
      setIsCapturing(false);
      return;
    }

    // Mirror image horizontally if front camera is active
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      blob => {
        setIsCapturing(false);
        if (!blob) {
          setError('Failed to capture photo.');
          return;
        }
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        stopStream();
        onCapture(file);
        onClose();
      },
      'image/jpeg',
      0.95
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#26384B]/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#F6F4EF] rounded-[32px] p-6 sm:p-8 shadow-2xl border border-[#26384B]/10 overflow-hidden">
        <AmbientGlow blur="blur-[80px]" opacity="opacity-[0.08]" />

        <div className="flex items-center justify-between mb-6 border-b border-[#26384B]/10 pb-4">
          <h3 className="text-2xl font-editorial font-bold text-[#26384B]">
            Capture Photo for AI Analysis
          </h3>
          <button
            onClick={onClose}
            className="text-[#4C6072] hover:text-[#26384B] font-bold text-sm uppercase tracking-wider"
          >
            Close
          </button>
        </div>

        {error ? (
          <div className="space-y-6 text-center py-8">
            <Alert variant="error" message={error} />
            <Button onClick={onClose} variant="ghost" className="rounded-full">
              Back to Upload
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="px-4 py-2.5 rounded-full bg-white/80 border border-[#26384B]/20 text-xs font-bold uppercase tracking-widest text-[#26384B] hover:bg-white transition-colors"
              >
                🔄 Switch Camera
              </button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleTakePhoto}
                  disabled={isCapturing || !stream}
                  isLoading={isCapturing}
                  className="rounded-full px-8"
                >
                  📸 Take Photo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
