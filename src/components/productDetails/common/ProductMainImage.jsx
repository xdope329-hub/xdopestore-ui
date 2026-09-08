import { useEffect, useState } from "react";
import ImageZoom from "react-image-zooom";

export default function ProductMainImage({ src, alt }) {
  const [canZoom, setCanZoom] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)");
    const update = () => setCanZoom(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // The zoom library cancels touchmove. Touch devices need native page panning.
  return canZoom ? (
    <ImageZoom src={src} alt={alt} zoom="200" className="img-fluid" height={670} width={670} />
  ) : (
    <img src={src} alt={alt || ""} className="img-fluid product-main-touch-image" width={670} height={670} draggable={false} />
  );
}
