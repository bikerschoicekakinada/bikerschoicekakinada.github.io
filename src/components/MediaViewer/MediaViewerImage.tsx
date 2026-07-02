import React, { useEffect, useState } from "react";
import { useImageZoom } from "@/hooks/useImageZoom";

interface MediaViewerImageProps {
  src: string;
  alt?: string;
  adjacentSrcs?: (string | undefined)[];
}

const MediaViewerImage: React.FC<MediaViewerImageProps> = ({ src, alt = "Bike Accessories", adjacentSrcs = [] }) => {
  const { scale, translateX, translateY, handlers, reset } = useImageZoom();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reset zoom on source change
  useEffect(() => {
    reset();
    setLoading(true);
    setError(false);
  }, [src, reset]);

  // Preload adjacent images
  useEffect(() => {
    adjacentSrcs.forEach((adjSrc) => {
      if (adjSrc) {
        const img = new Image();
        img.src = adjSrc;
      }
    });
  }, [adjacentSrcs]);

  return (
    <div
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
      {...handlers}
    >
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error ? (
        <div className="text-center p-4">
          <p className="text-muted-foreground text-sm">Failed to load image</p>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          className="mv-image-zoomable"
          style={{
            transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
          }}
        />
      )}
    </div>
  );
};

export default MediaViewerImage;
