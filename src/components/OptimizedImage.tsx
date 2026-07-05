import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  widthLimit?: number; // Optional width constraint for Supabase resizing
}

export const OptimizedImage = ({
  src,
  alt,
  className,
  wrapperClassName,
  widthLimit,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState("");
  const [hasFallbackOccurred, setHasFallbackOccurred] = useState(false);

  useEffect(() => {
    if (!src) return;

    setHasFallbackOccurred(false);
    setIsLoaded(false);

    // Auto-append Supabase resizing parameters if it is a Supabase Storage URL
    if (widthLimit && src.includes("supabase.co/storage/v1/object/public/")) {
      const transformedUrl = src.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
      const separator = transformedUrl.includes("?") ? "&" : "?";
      setOptimizedSrc(`${transformedUrl}${separator}width=${widthLimit}&quality=75&resize=contain`);
    } else {
      setOptimizedSrc(src);
    }
  }, [src, widthLimit]);

  const handleImageError = () => {
    if (optimizedSrc !== src && !hasFallbackOccurred) {
      setHasFallbackOccurred(true);
      setOptimizedSrc(src);
    }
  };

  return (
    <div className={cn("relative w-full overflow-hidden bg-muted/20", !wrapperClassName?.includes("aspect-") && "h-full", wrapperClassName)}>
      {/* Animated gradient skeleton loader */}
      {!isLoaded && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 animate-pulse" />
      )}
      {optimizedSrc && (
        <img
          src={optimizedSrc}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={handleImageError}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
