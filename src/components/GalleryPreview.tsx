import React from "react";
import { MediaItem } from "@/hooks/useMediaViewer";
import { Play } from "lucide-react";

interface GalleryPreviewProps {
  categoryName: string;
  images: MediaItem[];
  onImageClick: (index: number) => void;
  onViewAll: () => void;
}

const GalleryPreview: React.FC<GalleryPreviewProps> = ({
  categoryName,
  images,
  onImageClick,
  onViewAll,
}) => {
  if (images.length === 0) return null;

  const previewCount = Math.min(4, images.length);
  const remaining = images.length - 4;
  const topImage = images[0];
  const bottomImages = images.slice(1, previewCount);

  return (
    <div className="mb-12 max-w-4xl mx-auto px-2">
      {/* Category header */}
      <div className="flex justify-between items-baseline mb-4 border-b border-border/40 pb-2">
        <h3 className="text-lg md:text-xl font-display font-bold text-foreground tracking-wide uppercase">
          {categoryName}
        </h3>
        {images.length > 4 && (
          <button
            onClick={onViewAll}
            className="text-xs font-heading font-semibold text-primary hover:text-primary-foreground hover:underline transition-colors cursor-pointer"
          >
            View All ({images.length})
          </button>
        )}
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-6 gap-3">
        {/* Large Image (Top Row) - Spans all 6 columns */}
        <div
          onClick={() => onImageClick(0)}
          className="col-span-6 relative rounded-xl overflow-hidden cursor-pointer group border border-border/50 hover:border-primary transition-all duration-300 shadow-lg aspect-[16/10] sm:aspect-[16/9]"
        >
          <img
            src={topImage.src}
            alt={topImage.alt || `${categoryName} preview`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1.5 pointer-events-none">
            {topImage.comparisonEnabled && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                B/A Slider
              </span>
            )}
            {topImage.instagramUrl && (
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <Play size={10} fill="currentColor" /> Reel
              </span>
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        </div>

        {/* Small Images (Bottom Row) */}
        {bottomImages.map((img, idx) => {
          const globalIndex = idx + 1;
          const isLast = globalIndex === 3;
          const showMoreOverlay = isLast && remaining > 0;

          return (
            <div
              key={globalIndex}
              onClick={() => (showMoreOverlay ? onViewAll() : onImageClick(globalIndex))}
              className={`relative rounded-lg overflow-hidden cursor-pointer group border border-border/50 hover:border-primary transition-all duration-300 shadow ${
                bottomImages.length === 1
                  ? "col-span-6"
                  : bottomImages.length === 2
                  ? "col-span-3"
                  : "col-span-2"
              } aspect-[4/3]`}
            >
              <img
                src={img.src}
                alt={img.alt || `${categoryName} gallery thumbnail`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />

              {/* Badges */}
              <div className="absolute top-1.5 left-1.5 flex gap-1 pointer-events-none">
                {img.comparisonEnabled && !showMoreOverlay && (
                  <span className="bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.2 rounded-full shadow">
                    B/A
                  </span>
                )}
                {img.instagramUrl && !showMoreOverlay && (
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[8px] font-bold p-1 rounded-full shadow">
                    <Play size={8} fill="currentColor" />
                  </span>
                )}
              </div>

              {/* "+N More" overlay */}
              {showMoreOverlay && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center transition-colors group-hover:bg-background/70">
                  <span className="text-primary font-display font-extrabold text-lg md:text-xl">
                    +{remaining}
                  </span>
                  <span className="text-muted-foreground font-heading font-semibold text-[10px] uppercase tracking-wider">
                    More Images
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GalleryPreview;
