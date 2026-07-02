import React, { useState, useRef, useCallback, useEffect } from "react";
import "./BeforeAfterImage.css";

interface BeforeAfterImageProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

/**
 * Interactive Before / After image comparison slider.
 *
 * - Mouse drag, click-to-reposition, touch drag
 * - Keyboard accessible (arrow keys when handle is focused)
 * - Falls back to showing only the "after" image if the before image fails to load
 * - Memoized to prevent unnecessary re-renders
 */
const BeforeAfterImage: React.FC<BeforeAfterImageProps> = React.memo(
  ({
    beforeSrc,
    afterSrc,
    beforeAlt = "Before",
    afterAlt = "After",
    beforeLabel = "Before",
    afterLabel = "After",
    className = "",
  }) => {
    const [position, setPosition] = useState(50); // percentage 0–100
    const [beforeError, setBbeforeError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    // If the before image failed to load, render only the after image (normal display)
    if (beforeError) {
      return (
        <div className={`ba-container ${className}`}>
          <img
            src={afterSrc}
            alt={afterAlt}
            loading="lazy"
            style={{ position: "absolute", inset: 0 }}
          />
        </div>
      );
    }

    const getPositionFromEvent = useCallback(
      (clientX: number): number => {
        if (!containerRef.current) return position;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const pct = (x / rect.width) * 100;
        return Math.max(0, Math.min(100, pct));
      },
      [position]
    );

    // --- Mouse events ---
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        setPosition(getPositionFromEvent(e.clientX));
      },
      [getPositionFromEvent]
    );

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!isDragging.current) return;
        setPosition(getPositionFromEvent(e.clientX));
      },
      [getPositionFromEvent]
    );

    const handleMouseUp = useCallback(() => {
      isDragging.current = false;
    }, []);

    // --- Touch events ---
    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        isDragging.current = true;
        setPosition(getPositionFromEvent(e.touches[0].clientX));
      },
      [getPositionFromEvent]
    );

    const handleTouchMove = useCallback(
      (e: TouchEvent) => {
        if (!isDragging.current) return;
        e.preventDefault(); // prevent page scroll while dragging
        setPosition(getPositionFromEvent(e.touches[0].clientX));
      },
      [getPositionFromEvent]
    );

    const handleTouchEnd = useCallback(() => {
      isDragging.current = false;
    }, []);

    // --- Keyboard ---
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      const step = 2;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPosition((p) => Math.max(0, p - step));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPosition((p) => Math.min(100, p + step));
      }
    }, []);

    // Attach global mouse/touch listeners while dragging
    useEffect(() => {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    return (
      <div
        ref={containerRef}
        className={`ba-container ${className}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        role="figure"
        aria-label={`Before and after comparison: ${beforeAlt} vs ${afterAlt}`}
      >
        {/* After image (full, sits behind) */}
        <div className="ba-after">
          <img src={afterSrc} alt={afterAlt} loading="lazy" />
        </div>

        {/* Before image (clipped from left) */}
        <div
          className="ba-before"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            src={beforeSrc}
            alt={beforeAlt}
            loading="lazy"
            onError={() => setBbeforeError(true)}
          />
        </div>

        {/* Labels */}
        <span
          className="ba-label ba-label--before"
          style={{ opacity: position > 15 ? 1 : 0 }}
        >
          {beforeLabel}
        </span>
        <span
          className="ba-label ba-label--after"
          style={{ opacity: position < 85 ? 1 : 0 }}
        >
          {afterLabel}
        </span>

        {/* Divider line */}
        <div className="ba-divider" style={{ left: `${position}%` }} />

        {/* Draggable handle */}
        <div
          className="ba-handle"
          style={{ left: `${position}%` }}
          tabIndex={0}
          role="slider"
          aria-label="Comparison slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          onKeyDown={handleKeyDown}
        >
          {/* Double arrow icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 18 15 12 9 6" transform="translate(6 0)" />
          </svg>
        </div>
      </div>
    );
  }
);

BeforeAfterImage.displayName = "BeforeAfterImage";

export default BeforeAfterImage;
