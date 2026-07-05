import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import type { ReactNode } from "react";
import "./SwipeGallery.css";
import OptimizedImage from "./OptimizedImage";

interface SwipeGalleryProps {
  images: string[];
  alts?: string[];
  loop?: boolean;
  autoPlay?: boolean;
  speed?: number;
  className?: string;
  renderSlide?: (image: string, index: number) => ReactNode;
}

const SwipeGallery = ({
  images,
  alts,
  loop = true,
  autoPlay = true,
  speed = 0.5,
  className = "",
  renderSlide,
}: SwipeGalleryProps) => {
  const [emblaRef] = useEmblaCarousel(
    {
      loop,
      align: "start",
      dragFree: true,
    },
    autoPlay
      ? [
          AutoScroll({
            speed,
            startDelay: 0,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
            stopOnFocusIn: false,
          }),
        ]
      : []
  );

  if (images.length === 0) return null;

  return (
    <div className={`swipe-gallery ${className}`}>
      <div className="swipe-gallery__viewport" ref={emblaRef}>
        <div className="swipe-gallery__container">
          {images.map((image, index) => (
            <div className="swipe-gallery__slide" key={`${image}-${index}`}>
              {renderSlide ? (
                renderSlide(image, index)
              ) : (
                <div className="swipe-gallery__slide-inner">
                  <OptimizedImage
                    src={image}
                    alt={alts?.[index] || `Slide ${index + 1}`}
                    widthLimit={600}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SwipeGallery;
