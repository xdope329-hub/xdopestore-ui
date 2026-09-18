"use client";
import SettingContext from "@/context/settingContext";
import i18next from "i18next";
import { useContext } from "react";

const CROSSES = [30, 90, 150, 210, 270, 330].map((angle) => {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { cx: 50 + 30 * Math.cos(rad), cy: 50 + 30 * Math.sin(rad) };
});

const EmbroideryLoader = () => (
  <div className="loader-embroidery">
    <svg viewBox="0 0 100 100" width="190" height="190" xmlns="http://www.w3.org/2000/svg">
      {/* Wooden hoop */}
      <circle cx="50" cy="50" r="47" fill="none" stroke="#6b4423" strokeWidth="5.5" />
      <circle cx="50" cy="50" r="44" fill="#fdf8ee" />
      <circle cx="50" cy="50" r="41.5" fill="none" stroke="#9b7040" strokeWidth="0.75" opacity="0.5" />

      {/* Running stitch border — marches continuously */}
      <circle
        cx="50" cy="50" r="36"
        fill="none" stroke="#8b1a4a" strokeWidth="1.5"
        strokeDasharray="4.5 3.5"
        className="emb-border"
      />

      {/* 6 petals, each drawn in sequence */}
      {[0, 60, 120, 180, 240, 300].map((rot, i) => (
        <path
          key={i}
          transform={`rotate(${rot}, 50, 50)`}
          d="M50,50 C43,37 43,27 50,24 C57,27 57,37 50,50"
          fill="none"
          stroke="#c4205a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="64"
          strokeDashoffset="64"
          className={`emb-petal emb-petal-${i + 1}`}
        />
      ))}

      {/* Cross-stitch marks between petals */}
      {CROSSES.map(({ cx, cy }, i) => (
        <g key={i} className={`emb-cross emb-cross-${i + 1}`}>
          <line x1={cx - 2.8} y1={cy - 2.8} x2={cx + 2.8} y2={cy + 2.8}
            stroke="#c4911a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={cx + 2.8} y1={cy - 2.8} x2={cx - 2.8} y2={cy + 2.8}
            stroke="#c4911a" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}

      {/* Center dot */}
      <circle
        cx="50" cy="50" r="5"
        fill="#c4911a"
        className="emb-center"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    </svg>
    <p className="emb-label">{i18next.t("Loading", { defaultValue: "Cargando" })}</p>
  </div>
);

const Loader = ({ classes }) => {
  const settingCtx = useContext(SettingContext);
  const general = settingCtx?.settingData?.general;
  const useCustom = general?.use_custom_loader;
  const gifUrl = general?.loader_gif_image?.original_url;

  return (
    <div className={`loader-wrapper ${classes || ""}`}>
      {useCustom && gifUrl ? (
        <div className="loader-custom-gif">
          <img src={gifUrl} alt="Loading..." />
        </div>
      ) : (
        <EmbroideryLoader />
      )}
    </div>
  );
};

export default Loader;
