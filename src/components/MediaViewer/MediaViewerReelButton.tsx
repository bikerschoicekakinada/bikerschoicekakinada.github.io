import React from "react";
import { Play } from "lucide-react";

interface MediaViewerReelButtonProps {
  url?: string | null;
}

const MediaViewerReelButton: React.FC<MediaViewerReelButtonProps> = React.memo(({ url }) => {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mv-reel-btn"
      title="Watch Reel on Instagram"
    >
      <Play size={14} fill="currentColor" />
      <span>Watch Installation Reel</span>
    </a>
  );
});

MediaViewerReelButton.displayName = "MediaViewerReelButton";

export default MediaViewerReelButton;
