import React from 'react';
import { X } from 'lucide-react';
import { HoverLift } from '../../../../components/motion';

interface UploadPreviewProps {
  previewUrl: string;
  isUploading: boolean;
  onClear: () => void;
}

export const UploadPreview: React.FC<UploadPreviewProps> = ({
  previewUrl,
  isUploading,
  onClear
}) => {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-md">
      <img
        src={previewUrl}
        alt="Selected skin photo"
        className="w-full h-[400px] object-cover transition-opacity duration-500"
        style={{ opacity: isUploading ? 0.5 : 1 }}
      />
      {!isUploading && (
        <HoverLift className="absolute top-4 right-4">
          <button
            id="upload-clear-btn"
            type="button"
            onClick={onClear}
            className="bg-background/80 hover:bg-background border border-border rounded-full w-10 h-10 flex items-center justify-center text-foreground transition-colors backdrop-blur-md shadow-lg"
            aria-label="Remove selected photo"
          >
            <X className="w-5 h-5" />
          </button>
        </HoverLift>
      )}
    </div>
  );
};
