import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Container } from '../../components/ui/Container';
import { Fade, PageTransition, BlurReveal } from '../../components/motion';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { ApiError } from '../../lib/api';
import type { SkinAnalysisResponse } from '../../types/analysis';
import { UploadHero, UploadTips, UploadActions, UploadPreview, UploadStatus, CameraModal } from './components/upload';
import { UploadCloud } from 'lucide-react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

type UploadPhase = 'guidance' | 'selected' | 'uploading' | 'success' | 'error';

interface UploadState {
  phase: UploadPhase;
  file: File | null;
  previewUrl: string | null;
  errorMessage: string | null;
  createdId: string | null;
}

function mapUploadError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }
  const detail = error.message ?? '';
  switch (error.status) {
    case 401: return 'Your session has expired. Please sign in again.';
    case 413: return 'This photo is too large. Please choose an image under 10 MB.';
    case 415: return 'This file type isn\'t supported. Please upload a JPEG, PNG, or WebP image.';
    case 403: return 'Please verify your email address to perform an analysis.';
    case 422:
      if (detail.toLowerCase().includes('skin profile') || detail.toLowerCase().includes('questionnaire')) {
        return 'Please complete your skin profile before uploading a photo.';
      }
      if (detail.toLowerCase().includes('dimension') || detail.toLowerCase().includes('small')) {
        return 'This photo is too small. Please use an image at least 500 × 500 pixels.';
      }
      return 'The photo could not be processed. Please choose another image.';
    case 429: return 'You\'ve reached the upload limit for now. Please wait before trying again.';
    default: return 'Unable to reach the server. Please check your connection and try again.';
  }
}

  const GUIDANCE_TIPS = [
    { icon: '🧍', text: 'Ensure you are the only person in frame' },
    { icon: '👤', text: 'Position your face centrally, looking directly at the lens' },
    { icon: '💡', text: 'Use even, natural lighting to avoid harsh shadows' },
    { icon: '🚫', text: 'Remove all filters or digital enhancements' },
    { icon: '🕶️', text: 'Remove glasses and any facial coverings' },
    { icon: '📷', text: 'Ensure the image is sharp and in focus' },
  ];

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const api = useAuthenticatedApi();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>({
    phase: 'guidance',
    file: null,
    previewUrl: null,
    errorMessage: null,
    createdId: null,
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const revokePreview = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  const previewUrlRef = useRef<string | null>(null);
  useEffect(() => {
    previewUrlRef.current = state.previewUrl;
  }, [state.previewUrl]);

  useEffect(() => {
    return () => {
      revokePreview(previewUrlRef.current);
    };
  }, [revokePreview]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setState(current => {
      revokePreview(current.previewUrl);
      return { ...current, previewUrl: null, file: null };
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type as typeof ACCEPTED_TYPES[number])) {
      setState(current => ({ ...current, phase: 'error', errorMessage: 'Only JPEG, PNG, and WebP images are supported.' }));
      return;
    }
    if (file.size > MAX_BYTES) {
      setState(current => ({ ...current, phase: 'error', errorMessage: 'This photo is too large. Please choose an image under 10 MB.' }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setState({ phase: 'selected', file, previewUrl, errorMessage: null, createdId: null });
  }, [revokePreview]);

  const handleCameraCapture = useCallback((file: File) => {
    setState(current => {
      revokePreview(current.previewUrl);
      const previewUrl = URL.createObjectURL(file);
      return { phase: 'selected', file, previewUrl, errorMessage: null, createdId: null };
    });
  }, [revokePreview]);

  const handleClear = useCallback(() => {
    setState(current => {
      revokePreview(current.previewUrl);
      return { phase: 'guidance', file: null, previewUrl: null, errorMessage: null, createdId: null };
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [revokePreview]);

  const handleUpload = useCallback(async () => {
    if (state.phase !== 'selected' && state.phase !== 'error') return;
    if (!state.file) return;

    setState(current => ({ ...current, phase: 'uploading', errorMessage: null }));

    const formData = new FormData();
    formData.append('file', state.file, state.file.name);

    try {
      const result = await api.postForm<SkinAnalysisResponse>('/analyses', formData);
      

      revokePreview(state.previewUrl);
      navigate(`/app/results/${result.id}`);
    } catch (error) {
      const message = mapUploadError(error);
      setState(current => ({ ...current, phase: 'error', errorMessage: message }));
    }
  }, [api, revokePreview, state.file, state.phase, state.previewUrl, navigate]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const { phase, previewUrl, errorMessage, createdId } = state;
  const isUploading = phase === 'uploading';

  return (
    <PageTransition>
      <Container className="max-w-4xl pt-32 pb-24 text-center">
        <UploadHero />

        {phase === 'success' ? (
          <UploadStatus
            createdId={createdId}
            onViewHistory={() => createdId ? navigate(`/app/results/${createdId}`) : navigate('/app/history')}
            onUploadAnother={() => setState({ phase: 'guidance', file: null, previewUrl: null, errorMessage: null, createdId: null })}
          />
        ) : (
          <Fade className="space-y-6">
            {phase === 'error' && errorMessage && (
              <Alert variant="error" message={errorMessage} />
            )}

            {previewUrl ? (
              <UploadPreview
                previewUrl={previewUrl}
                isUploading={isUploading}
                onClear={handleClear}
              />
            ) : (
              <BlurReveal delay={0.2}>
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="w-full text-left group relative z-10 block p-12 transition-all duration-500 ease-[var(--luxury-ease)] focus:outline-none bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50 rounded-[32px] hover:shadow-[0_0_60px_rgba(59,130,246,0.25)] hover:border-blue-300 hover:-translate-y-1"
                >
                  <div className="flex flex-col items-center justify-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-blue-600 shadow-sm border border-blue-200 transition-transform duration-700 group-hover:scale-110">
                      <UploadCloud size={32} strokeWidth={1.5} />
                    </div>
                    <span className="font-bold text-[#26384B] text-lg">Tap to upload a photo</span>
                  </div>
                  <UploadTips tips={GUIDANCE_TIPS} />
                </button>
              </BlurReveal>
            )}

            <input
              ref={fileInputRef}
              id="skin-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="user"
              className="sr-only"
              onChange={handleFileChange}
              aria-label="Choose a skin photo to upload"
              disabled={isUploading}
            />

            <UploadActions
              hasFile={!!previewUrl}
              isUploading={isUploading}
              onSelectClick={triggerFileInput}
              onCameraClick={() => setIsCameraOpen(true)}
              onUploadClick={handleUpload}
            />
          </Fade>
        )}

        <CameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
        />
      </Container>
    </PageTransition>
  );
};
