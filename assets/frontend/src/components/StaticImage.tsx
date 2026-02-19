import { useRef, useEffect, useState } from "react";

export default function StaticImage({
  src,
  alt,
  className,
  placeholderClassName,
}: {
  src?: string;
  alt?: string;
  className?: string;
  placeholderClassName?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCanvas, setUseCanvas] = useState(false);
  const [errored, setErrored] = useState(false);

  const isGif = src ? /\.gif(\?|$)/i.test(src) : false;

  useEffect(() => {
    setErrored(false);
    setUseCanvas(false);
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

  if (!src || errored) {
    return (
      <div className={`flex items-center justify-center bg-[#1e2228] ${className || ""}`}>
        <img src="/spicetifyx-logo.png" alt="" className={placeholderClassName || "h-8 w-8 opacity-40"} />
      </div>
    );
  }

  return (
    <>
      {isGif && <canvas ref={canvasRef} className={className} style={{ display: useCanvas ? undefined : "none" }} />}
      <img
        src={src}
        alt={alt || ""}
        className={className}
        style={{ display: isGif && useCanvas ? "none" : undefined }}
        onLoad={handleLoad}
        onError={() => setErrored(true)}
        crossOrigin="anonymous"
      />
    </>
  );
}
