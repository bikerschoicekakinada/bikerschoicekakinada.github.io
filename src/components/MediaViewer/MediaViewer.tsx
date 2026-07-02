import React, { useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaViewer } from "@/hooks/useMediaViewer";
import MediaViewerImage from "./MediaViewerImage";
import MediaViewerToolbar from "./MediaViewerToolbar";
import MediaViewerNavigation from "./MediaViewerNavigation";
import MediaViewerReelButton from "./MediaViewerReelButton";
import BeforeAfterImage from "../BeforeAfterImage";
import "./MediaViewer.css";

const MediaViewer: React.FC = () => {
  const { isOpen, items, currentIndex, close, next, prev } = useMediaViewer();
  const touchStartX = useRef(0);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        close();
      } else if (e.key === "ArrowLeft") {
        prev();
      } else if (e.key === "ArrowRight") {
        next();
      }
    },
    [isOpen, close, next, prev]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Touch Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    // Ignore swipe navigation if touch is inside comparison slider container
    if ((e.target as HTMLElement).closest(".ba-container")) {
      return;
    }
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".ba-container")) {
      return;
    }
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50; // swipe threshold in pixels
    if (diff > threshold) {
      prev();
    } else if (diff < -threshold) {
      next();
    }
  };

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];
  const isComparison = currentItem.comparisonEnabled && !!currentItem.beforeSrc;

  // Preload adjacent images
  const prevItem = items[(currentIndex - 1 + items.length) % items.length];
  const nextItem = items[(currentIndex + 1) % items.length];
  const adjacentSrcs = [prevItem?.src, nextItem?.src];

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="mv-overlay"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          // Close if click is outside target content
          if ((e.target as HTMLElement).classList.contains("mv-content")) {
            close();
          }
        }}
      >
        {/* Toolbar Header */}
        <MediaViewerToolbar
          total={items.length}
          current={currentIndex}
          onClose={close}
        />

        {/* Content Area */}
        <div className="mv-content">
          <div className="mv-image-container">
            {isComparison ? (
              <BeforeAfterImage
                beforeSrc={currentItem.beforeSrc!}
                afterSrc={currentItem.src}
                beforeAlt={currentItem.beforeAlt || "Before"}
                afterAlt={currentItem.afterAlt || currentItem.alt}
                beforeLabel={currentItem.beforeLabel || "Before"}
                afterLabel={currentItem.afterLabel || "After"}
              />
            ) : (
              <MediaViewerImage
                src={currentItem.src}
                alt={currentItem.alt}
                adjacentSrcs={adjacentSrcs}
              />
            )}
          </div>

          {/* Helper overlay for mobile swipe guidance */}
          <div className="mv-swipe-guide md:hidden">Swipe Left / Right</div>
        </div>

        {/* Desktop Navigation Arrows */}
        <MediaViewerNavigation onPrev={prev} onNext={next} />

        {/* Footer info & Optional Reel Link */}
        <div className="mv-footer">
          {currentItem.label && <span className="mv-label">{currentItem.label}</span>}
          <MediaViewerReelButton url={currentItem.instagramUrl} />
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default MediaViewer;
