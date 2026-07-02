import { useCallback, useRef, useState } from "react";

interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_DELAY = 300;

/**
 * Manages pinch-to-zoom, mouse-wheel zoom, double-tap/click zoom,
 * and drag/pan while zoomed for a single image element.
 */
export function useImageZoom() {
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, translateX: 0, translateY: 0 });
  const lastTap = useRef(0);
  const lastDistance = useRef(0);
  const lastCenter = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragTranslateStart = useRef({ x: 0, y: 0 });

  const clampScale = (s: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));

  const reset = useCallback(() => {
    setZoom({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  const toggleZoom = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    setZoom((prev) => {
      if (prev.scale > 1) {
        return { scale: 1, translateX: 0, translateY: 0 };
      }
      const targetScale = 2.5;
      const offsetX = (clientX - rect.left - rect.width / 2) * (1 - targetScale);
      const offsetY = (clientY - rect.top - rect.height / 2) * (1 - targetScale);
      return { scale: targetScale, translateX: offsetX, translateY: offsetY };
    });
  }, []);

  // --- Mouse wheel zoom ---
  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    setZoom((prev) => {
      const newScale = clampScale(prev.scale + delta);
      if (newScale <= 1) return { scale: 1, translateX: 0, translateY: 0 };
      const ratio = newScale / prev.scale;
      const originX = e.clientX - rect.left - rect.width / 2;
      const originY = e.clientY - rect.top - rect.height / 2;
      return {
        scale: newScale,
        translateX: prev.translateX + (originX - prev.translateX) * (1 - ratio),
        translateY: prev.translateY + (originY - prev.translateY) * (1 - ratio),
      };
    });
  }, []);

  // --- Double click ---
  const onDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    toggleZoom(e.clientX, e.clientY, rect);
  }, [toggleZoom]);

  // --- Mouse drag while zoomed ---
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom.scale <= 1) return;
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragTranslateStart.current = { x: zoom.translateX, y: zoom.translateY };
  }, [zoom]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    setZoom((prev) => ({
      ...prev,
      translateX: dragTranslateStart.current.x + (e.clientX - dragStart.current.x),
      translateY: dragTranslateStart.current.y + (e.clientY - dragStart.current.y),
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // --- Touch: pinch-to-zoom + double-tap + drag ---
  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Start pinch
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDistance.current = Math.sqrt(dx * dx + dy * dy);
      lastCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1) {
      // Double tap detection
      const now = Date.now();
      if (now - lastTap.current < DOUBLE_TAP_DELAY) {
        const rect = e.currentTarget.getBoundingClientRect();
        toggleZoom(e.touches[0].clientX, e.touches[0].clientY, rect);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
      // Drag start if zoomed
      if (zoom.scale > 1) {
        isDragging.current = true;
        dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        dragTranslateStart.current = { x: zoom.translateX, y: zoom.translateY };
      }
    }
  }, [zoom, toggleZoom]);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scaleDelta = distance / (lastDistance.current || 1);
      lastDistance.current = distance;

      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };

      setZoom((prev) => {
        const newScale = clampScale(prev.scale * scaleDelta);
        if (newScale <= 1) return { scale: 1, translateX: 0, translateY: 0 };
        const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect();
        if (!rect) return prev;
        const originX = center.x - rect.left - rect.width / 2;
        const originY = center.y - rect.top - rect.height / 2;
        const ratio = newScale / prev.scale;
        return {
          scale: newScale,
          translateX: prev.translateX + (originX - prev.translateX) * (1 - ratio) + (center.x - lastCenter.current.x),
          translateY: prev.translateY + (originY - prev.translateY) * (1 - ratio) + (center.y - lastCenter.current.y),
        };
      });
      lastCenter.current = center;
    } else if (e.touches.length === 1 && isDragging.current) {
      e.preventDefault();
      setZoom((prev) => ({
        ...prev,
        translateX: dragTranslateStart.current.x + (e.touches[0].clientX - dragStart.current.x),
        translateY: dragTranslateStart.current.y + (e.touches[0].clientY - dragStart.current.y),
      }));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
    lastDistance.current = 0;
  }, []);

  return {
    scale: zoom.scale,
    translateX: zoom.translateX,
    translateY: zoom.translateY,
    isZoomed: zoom.scale > 1,
    reset,
    handlers: {
      onWheel,
      onDoubleClick,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
