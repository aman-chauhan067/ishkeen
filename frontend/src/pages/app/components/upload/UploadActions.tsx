import React from 'react';
import { Button } from '../../../../components/ui/Button';
import { HoverLift } from '../../../../components/motion';

interface UploadActionsProps {
  hasFile: boolean;
  isUploading: boolean;
  onSelectClick: () => void;
  onUploadClick: () => void;
}

export const UploadActions: React.FC<UploadActionsProps> = ({
  hasFile,
  isUploading,
  onSelectClick,
  onUploadClick
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-6">
      <HoverLift y={-2} className="flex-1">
        <Button
          id="upload-choose-btn"
          type="button"
          variant={hasFile ? 'ghost' : 'primary'}
          onClick={onSelectClick}
          disabled={isUploading}
          className="w-full rounded-full"
        >
          {hasFile ? 'Change Image' : 'Select Image'}
        </Button>
      </HoverLift>

      {hasFile && (
        <HoverLift y={-2} className="flex-1">
          <Button
            id="upload-submit-btn"
            type="button"
            variant="primary"
            onClick={onUploadClick}
            isLoading={isUploading}
            disabled={isUploading}
            className="w-full rounded-full"
          >
            {isUploading ? 'Processing...' : 'Commence Analysis'}
          </Button>
        </HoverLift>
      )}
    </div>
  );
};
