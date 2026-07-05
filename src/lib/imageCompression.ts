/**
 * Utility function to compress and resize an image on the client side before uploading.
 * This ensures high-definition visual quality while preventing massive raw file uploads.
 */
export function compressImageClient(
  file: File,
  maxWidth = 1920, // Keep Full HD resolution for high sharpness
  quality = 0.88   // High quality factor for crisp rendering without visible artifacts
): Promise<Blob | File> {
  return new Promise((resolve) => {
    // If it's not a standard image type, bypass compression
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize only if it exceeds the high-res 1920px boundary
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // fallback
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert the canvas drawing into a high-quality JPEG blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file); // fallback
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
