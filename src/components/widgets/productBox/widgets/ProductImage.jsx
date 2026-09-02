"use client";
import { placeHolderImage } from "@/components/widgets/Placeholder";
import { useEffect, useRef, useState } from "react";

/**
 * Foto de la tarjeta de producto con carga diferida y esqueleto.
 *
 *  - `loading="lazy"`: las fotos fuera de pantalla no se descargan hasta
 *    que el cliente se acerca (la home mostraba decenas de PNG de golpe).
 *    Las primeras tarjetas visibles llegan con `priority` y se piden ya.
 *  - Mientras llega la primera foto se ve un brillo (skeleton) del mismo
 *    tamaño 17/20 de la tarjeta, así nada salta al aparecer la imagen.
 *  - Al cambiar de variante (color/talla) la foto anterior se queda hasta
 *    que la nueva está lista, con un brillo suave encima: sin parpadeos.
 *  - Si la URL falla, se muestra el placeholder de producto.
 */
const ProductImage = ({ src, alt = "", priority = false, className = "img-fluid bg-img", width, height }) => {
  const [loaded, setLoaded] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);
  const loadedOnce = useRef(false);

  const resolvedSrc = failed || !src ? placeHolderImage : src;

  // Cambio de URL: primera vez → esqueleto; siguientes → brillo sobre la
  // foto actual. Si el navegador ya la tiene en caché, `onLoad` puede no
  // dispararse: se comprueba `complete` a mano.
  useEffect(() => {
    setFailed(false);
    if (loadedOnce.current) setSwapping(true);
    else setLoaded(false);
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      loadedOnce.current = true;
      setLoaded(true);
      setSwapping(false);
    }
  }, [src]);

  const onLoad = () => {
    loadedOnce.current = true;
    setLoaded(true);
    setSwapping(false);
  };

  const onError = () => {
    if (!failed) setFailed(true);
    else onLoad(); // ni el placeholder cargó: no dejar el esqueleto eterno
  };

  const state = loaded ? "is-loaded" : "is-loading";

  return (
    <span className={`product-img ${state} ${swapping ? "is-swapping" : ""}`.trim()} data-testid="product-img">
      <img
        ref={imgRef}
        src={resolvedSrc}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        width={width}
        height={height}
        onLoad={onLoad}
        onError={onError}
      />
    </span>
  );
};

export default ProductImage;
