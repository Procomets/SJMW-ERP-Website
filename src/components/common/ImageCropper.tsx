import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';

interface ImageCropperProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  aspectRatio?: number;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  open,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 1,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [open]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  };

  const handleSave = async () => {
    if (completedCrop && imgRef.current) {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      const pixelRatio = window.devicePixelRatio;
      canvas.width = completedCrop.width * scaleX * pixelRatio;
      canvas.height = completedCrop.height * scaleY * pixelRatio;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY
      );

      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], `cropped_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        onCropComplete(file);
        onClose();
      }, 'image/jpeg', 0.95);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crop Image</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', justifyContent: 'center' }}>
        {imageSrc && (
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            circularCrop={aspectRatio === 1}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop me"
              style={{ maxHeight: '60vh' }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!completedCrop}>
          Save Crop
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropper;
