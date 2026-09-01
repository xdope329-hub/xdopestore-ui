"use client";
import SettingContext from "@/context/settingContext";
import { useContext } from "react";

/**
 * Cinta de anuncios (estilo koaj.co): tira superior que desplaza en bucle
 * los mensajes activos configurados en el admin (Configuración -> Cinta de
 * anuncios). Solo informativa; se oculta si está apagada o sin mensajes.
 *
 * - Fondo: settings.announcement_bar.bg_color; vacío = color primario del tema.
 * - Se pausa al pasar el mouse y queda estática si el usuario tiene
 *   "reducir movimiento" activado en su sistema.
 */
const AnnouncementBar = () => {
  const { settingData } = useContext(SettingContext);
  const bar = settingData?.announcement_bar;
  const messages = (Array.isArray(bar?.messages) ? bar.messages : [])
    .filter((m) => m?.status && typeof m?.text === "string" && m.text.trim())
    .map((m) => m.text.trim());

  if (!bar?.status || messages.length === 0) return null;

  const bg = bar.bg_color || "var(--theme-color, #2c1810)";
  const color = bar.text_color || "#ffffff";
  const speed = Number(bar.speed) > 0 ? Number(bar.speed) : 30;

  // La secuencia se repite para que la pista sea más ancha que cualquier
  // pantalla; la animación recorre el 50% (= 3 secuencias), así el bucle
  // reinicia sin salto visible.
  const REPEATS = 6;
  const sequence = Array.from({ length: REPEATS }, (_, r) =>
    messages.map((text, i) => (
      <span className="announcement-bar-item" key={`${r}-${i}`} aria-hidden={r > 0 ? "true" : undefined}>
        {text}
        <span className="announcement-bar-sep" aria-hidden="true">✦</span>
      </span>
    ))
  );

  return (
    <div className="announcement-bar" style={{ background: bg, color }} role="region" aria-label="Anuncios">
      <div className="announcement-bar-track" style={{ animationDuration: `${speed}s` }}>
        {sequence}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .announcement-bar {
          overflow: hidden;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 8px 0;
          position: relative;
          z-index: 10;
        }
        .announcement-bar-track {
          display: inline-flex;
          align-items: center;
          animation-name: announcement-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .announcement-bar:hover .announcement-bar-track {
          animation-play-state: paused;
        }
        .announcement-bar-item {
          display: inline-flex;
          align-items: center;
        }
        .announcement-bar-sep {
          margin: 0 28px;
          opacity: 0.65;
          font-size: 10px;
        }
        @keyframes announcement-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .announcement-bar-track { animation: none; }
        }
      ` }} />
    </div>
  );
};

export default AnnouncementBar;
