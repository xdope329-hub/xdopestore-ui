"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RiCloseLine } from "react-icons/ri";

/**
 * Lightbox tap-to-zoom para mobile/touch. Un tap abre la imagen a
 * pantalla completa; double-tap o el boton alterna entre 1x y 2x, y con la
 * imagen ampliada se puede arrastrar con un dedo. Diseño intencional para no
 * pelearse con el scroll de la pagina: mientras la modal esta abierta,
 * bloqueamos overflow y todo el touch-manipulation vive dentro del overlay.
 *
 * No usamos react-image-zooom en mobile porque intercepta touchmove y rompe
 * el pan/scroll: aca la imagen solo se mueve cuando esta ampliada.
 */
export default function MobileImageLightbox({ src, alt, open, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const lastTapRef = useRef(0);

  useEffect(() => setMounted(true), []);

  // Reset al abrir/cerrar
  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [open]);

  // Bloqueo de scroll del fondo + cierre con ESC
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const toggleZoom = useCallback(() => {
    setZoom((z) => (z > 1 ? 1 : 2));
    setOffset({ x: 0, y: 0 });
  }, []);

  // Doble-tap para zoom (mobile) o doble-click (desktop en la modal)
  const onImageClick = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      toggleZoom();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [toggleZoom]);

  const onPointerDown = useCallback((e) => {
    if (zoom <= 1) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
  }, [zoom, offset]);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy });
  }, []);

  const onPointerUp = useCallback((e) => {
    dragRef.current.dragging = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  if (!open || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || "Imagen ampliada"}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Cerrar"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 2,
          background: "rgba(255,255,255,0.1)",
          border: 0,
          borderRadius: "50%",
          width: 40,
          height: 40,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <RiCloseLine size={26} />
      </button>
      <img
        src={src}
        alt={alt || ""}
        draggable={false}
        onClick={(e) => { e.stopPropagation(); onImageClick(); }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          userSelect: "none",
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: dragRef.current.dragging ? "none" : "transform 0.2s ease",
          touchAction: "none",
          cursor: zoom > 1 ? "grab" : "zoom-in",
        }}
      />
    </div>,
    document.body
  );
}
