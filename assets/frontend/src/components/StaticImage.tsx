import { useRef, useEffect, useState } from "react";
import { getJsDelivrUrl } from "../utils/github";

export default function StaticImage({
  src,
  fallbackSrc,
  alt,
  className,
  placeholderClassName,
  onError,
}: {
  src?: string;
  fallbackSrc?: string;
  alt?: string;
  className?: string;
  placeholderClassName?: string;
  onError?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCanvas, setUseCanvas] = useState(false);
  const [errored, setErrored] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);

  const processedSrc = currentSrc ? getJsDelivrUrl(currentSrc) : currentSrc;
  const isGif = processedSrc ? /\.gif(\?|$)/i.test(processedSrc) : false;

  useEffect(() => {
    setErrored(false);
    setUseCanvas(false);
    setCurrentSrc(src);
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (isGif && canvasRef.current) {
      const img = e.currentTarget;
      const canvas = canvasRef.current;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setUseCanvas(true);
      }
    }
  };

  const handleLocalError = () => {
    if (currentSrc !== fallbackSrc && fallbackSrc) {
      console.log(`[StaticImage] Failed to load primary src, trying fallback:`, fallbackSrc);
      setCurrentSrc(fallbackSrc);
    } else {
      console.error("[StaticImage] All sources failed for:", src);
      setErrored(true);
      if (onError) onError();
    }
  };

  if (!processedSrc || errored) {
    return (
      <div className={`flex items-center justify-center bg-[#1e2228] ${className || ""}`}>
        <img
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARgAAAEYCAYAAACHjumMAAAQAElEQVR4AeydB6BlVXX3/+vc96bBwPSBGYYmRZE+UmboChpsiIqJJpZoYmJvSNX4FOmoiTXBqJ8pGiWJxhoLikhHVDQSe4EBmUJngJl59+zv91/n3jdvEMiU96bePXudvfouZ6919j33vTeVeqW3Ar0V6K3AKK1AL8GM0sL23PZWoLcCUi/B9HZBbwV6KzBqK9BLMKO2tD3HG3oFev1v+BXoJZgNfw96I+itwGa7Ar0Es9ne2t7Eeiuw4Vegl2A2/D3ojaC3ApvtCvQSzCjd2p7b3gr0VqD3LVJvD/RWoLcCo7gCvRPMKC5uz3VvBbb0FeglmC19B/Tm31uBNV2BNdDvJZg1WKyeam8FeiuwZivQSzBrtl497d4K9FZgDVagl2DWYLF6qr0V6K3Amq1AL8Gs2Xr1tDf0CvT636RWoJdgNqnb1Rvs8BU4Xhp76uTJOw5MmbLNcH4P33hWoJdgNp570RvJGq7Af+y5/5MGpu/42dOm7/zxB3bf94UD0/faeg1d9NRHeQV6CWaUF7jnfvRWoIqKhNLar5TynIjW3506edwHlu621wFHS32j12vP85qsQLUmylu8bm8BNqoVePedi3+pqrqRQbUU1XSpvKSq+j/5lT33PwRer24EK9BLMBvBTegNYe1WoG/RLb8rpf05rO9VqWmC/VztHSXOfWCPuYf3TjIsyQau3JANPIJe970VWMsVGJAGSSz/UqL6rRTKEi0jR4Tqv//KHnMPTV7vssFWoNpgPfc67q3ACKzAhJ/feFtVyqV2VbgYlMkmnshHprOX7rbvgZJ6+5xFeOw6OtLewo/Ouva8rr8VKG2Vb/AB6Z7o9MmJRoaI6vCq1X/uA7vutUNH1GvW8wr0Esx6XvBedyO/AmffeecPq2hdg+e6STLNldMM+7s6Wq0xr+l9hc3qbIBabYA+e132VmBEV+CcJb+7vZT663VU95NUVvFdVMao6n/FqZMnPHdAGrOKsEeM+gr0EsyoL3Gvg/97BdZZo9RRvsm5ZbHEVd00Y9ygqYp4x6l7Hny4emW9rkAvwazX5e51NlorsNX2z75Jit/xYleSk4pBQ4WUs2tR+eu7dt550hCzh4<TRUNCATED>"
          alt=""
          className={placeholderClassName || "h-8 w-8 opacity-40"}
        />
      </div>
    );
  }

  return (
    <>
      {isGif && <canvas ref={canvasRef} className={className} style={{ display: useCanvas ? undefined : "none" }} />}
      <img
        src={processedSrc}
        alt={alt || ""}
        className={className}
        style={{ display: isGif && useCanvas ? "none" : undefined }}
        onLoad={handleLoad}
        onError={handleLocalError}
      />
    </>
  );
}
