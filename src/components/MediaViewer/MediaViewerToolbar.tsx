import React from "react";
import { X } from "lucide-react";

interface MediaViewerToolbarProps {
  total: number;
  current: number;
  onClose: () => void;
}

const MediaViewerToolbar: React.FC<MediaViewerToolbarProps> = React.memo(({ total, current, onClose }) => {
  return (
    <div className="mv-toolbar">
      <span className="mv-counter">
        {current + 1} / {total}
      </span>
      <button
        onClick={onClose}
        className="mv-close-btn"
        aria-label="Close media viewer"
      >
        <X size={24} />
      </button>
    </div>
  );
});

MediaViewerToolbar.displayName = "MediaViewerToolbar";

export default MediaViewerToolbar;
