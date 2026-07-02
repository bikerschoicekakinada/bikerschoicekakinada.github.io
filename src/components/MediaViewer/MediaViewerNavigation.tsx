import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MediaViewerNavigationProps {
  onPrev: () => void;
  onNext: () => void;
}

const MediaViewerNavigation: React.FC<MediaViewerNavigationProps> = React.memo(({ onPrev, onNext }) => {
  return (
    <>
      <button
        onClick={onPrev}
        className="mv-nav-btn mv-nav-btn--prev"
        aria-label="Previous image"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={onNext}
        className="mv-nav-btn mv-nav-btn--next"
        aria-label="Next image"
      >
        <ChevronRight size={24} />
      </button>
    </>
  );
});

MediaViewerNavigation.displayName = "MediaViewerNavigation";

export default MediaViewerNavigation;
