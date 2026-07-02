import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface MediaItem {
  src: string;
  alt?: string;
  instagramUrl?: string | null;
  label?: string;
  beforeSrc?: string | null;
  beforeAlt?: string | null;
  afterAlt?: string | null;
  beforeLabel?: string | null;
  afterLabel?: string | null;
  comparisonEnabled?: boolean;
}

interface MediaViewerContextType {
  isOpen: boolean;
  items: MediaItem[];
  currentIndex: number;
  open: (items: MediaItem[], startIndex?: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  setCurrentIndex: (index: number) => void;
}

const MediaViewerContext = createContext<MediaViewerContextType | undefined>(undefined);

export const MediaViewerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const open = useCallback((newItems: MediaItem[], startIndex: number = 0) => {
    setItems(newItems);
    setCurrentIndex(Math.max(0, Math.min(newItems.length - 1, startIndex)));
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const next = useCallback(() => {
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Lock body scroll when the media viewer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <MediaViewerContext.Provider
      value={{
        isOpen,
        items,
        currentIndex,
        open,
        close,
        next,
        prev,
        setCurrentIndex,
      }}
    >
      {children}
    </MediaViewerContext.Provider>
  );
};

export const useMediaViewer = () => {
  const context = useContext(MediaViewerContext);
  if (!context) {
    throw new Error("useMediaViewer must be used within a MediaViewerProvider");
  }
  return context;
};
