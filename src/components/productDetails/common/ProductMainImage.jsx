import { useEffect, useState } from "react";
import ImageZoom from "react-image-zooom";
import MobileImageLightbox from "./MobileImageLightbox";

export default function ProductMainImage({ src, alt }) {
  const [canZoom, setCanZoom] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)");
    const update = () => setCanZoom(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Desktop con mouse: hover-zoom in-place con react-image-zooom.
  // Touch / mobile: tap para abrir el lightbox (MobileImageLightbox) con
  // double-tap o boton para alternar 1x/2x. La libreria de hover-zoom
  // cancela touchmove — no la queremos activa en touch.
  if (canZoom) {
    return <ImageZoom src={src} alt={alt} zoom="200" className="img-fluid" height={670} width={670} />;
  }
  return (
    <>
      <img
        src={src}
        alt={alt || ""}
        className="img-fluid product-main-touch-image"
        width={670}
        height={670}
        draggable={false}
        onClick={() => setLightboxOpen(true)}
        style={{ cursor: "zoom-in" }}
      />
      <MobileImageLightbox src={src} alt={alt} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </>
  );
}
