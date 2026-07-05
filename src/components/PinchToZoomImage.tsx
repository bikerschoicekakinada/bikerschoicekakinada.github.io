import React, { useState, useRef, useEffect } from "react";
import OptimizedImage from "./OptimizedImage";

interface PinchToZoomImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const PinchToZoomImage: React.FC<PinchToZoomImageProps> = ({ src, alt, className }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const touchStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0, y: 0 });
  const lastTouchTimeRef = useRef(0);
  const initialDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);
  const isDraggingRef = useRef(false);

  // Reset zoom when src changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialDistanceRef.current = dist;
      initialScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTouchTimeRef.current < 300) {
        // Double tap zoom
        if (scale > 1) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.5);
          setPosition({ x: 0, y: 0 });
        }
        lastTouchTimeRef.current = 0;
        return;
      }
      lastTouchTimeRef.current = now;

      if (scale > 1) {
        isDraggingRef.current = true;
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        initialPosRef.current = { x: position.x, y: position.y };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.min(Math.max(1, initialScaleRef.current * (dist / initialDistanceRef.current)), 4);
      setScale(newScale);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDraggingRef.current && scale > 1) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      
      // Calculate drag limits based on scale
      const maxDragX = (scale - 1) * (containerRef.current?.clientWidth || 300) / 2;
      const maxDragY = (scale - 1) * (containerRef.current?.clientHeight || 400) / 2;
      
      const newX = Math.min(Math.max(-maxDragX, initialPosRef.current.x + dx), maxDragX);
      const newY = Math.min(Math.max(-maxDragY, initialPosRef.current.y + dy), maxDragY);
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full relative overflow-hidden select-none flex items-center justify-center bg-black cursor-zoom-in"
    >
      <div
        className="w-full h-full transition-transform duration-75 ease-out flex items-center justify-center"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          touchAction: scale > 1 ? "none" : "pan-y",
        }}
      >
        <OptimizedImage
          src={src}
          alt={alt}
          className={className}
          widthLimit={undefined}
        />
      </div>
      
      {/* Zoom HUD indicator */}
      {scale > 1 && (
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-heading pointer-events-none z-10">
          {scale.toFixed(1)}x Zoom
        </div>
      )}
    </div>
  );
};

export default PinchToZoomImage;
