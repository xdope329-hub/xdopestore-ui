"use client";
import { safeHref } from "@/utils/security/safeUrl";
import { homeBannerSettings } from "@/data/sliderSetting/SliderSetting";
import { ImagePath, storageURL } from "@/utils/constants";
import useIsMobile from "@/utils/hooks/useIsMobile";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import { progressPercent, resolveAutoplaySeconds, shouldAutoplay } from "./homeSliderRules";

const PROGRESS_TICK_MS = 100;

const resolveUrl = (banner, isMobile) => {
  if (isMobile && banner?.image_url_mobile) return storageURL + banner.image_url_mobile;
  if (banner?.image_url) return storageURL + banner.image_url;
  if (banner?.original_url) return banner.original_url;
  return `${ImagePath}/banner.png`;
};

const colClass = (pos) => {
  switch (pos) {
    case "right": return "col-lg-7 col-sm-10 col-12 ms-auto text-end";
    case "center": return "col-lg-7 col-sm-10 col-12 mx-auto text-center";
    default: return "col-lg-7 col-sm-10 col-12";
  }
};

const pick = (banner, key, isMobile) => (isMobile && banner?.[`${key}_mobile`]) || banner?.[key];
const fontStyle = (banner, prefix, isMobile, colorStyle) => {
  const family = pick(banner, `${prefix}_font_family`, isMobile);
  const size = pick(banner, `${prefix}_font_size`, isMobile);
  const style = { ...(colorStyle || {}) };
  if (family) style.fontFamily = family;
  if (size) style.fontSize = `${size}px`;
  return Object.keys(style).length ? style : undefined;
};

const SliderSlide = ({ banner, height, width, isMobile }) => {
  const src = resolveUrl(banner, isMobile);
  const title = pick(banner, "title", isMobile);
  const subtitle = pick(banner, "subtitle", isMobile);
  const href = banner?.redirect_link?.link
    ? banner.redirect_link.link_type === "collection"
      ? `/category/${banner.redirect_link.link}`
      : safeHref(banner.redirect_link.link, "/collections")
    : "/collections";

  return (
    <div
      className="home d-flex align-items-center"
      style={{ backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}
    >
      {banner?.text_bg && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 0, pointerEvents: "none" }} />
      )}
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div className="row">
          <div className={colClass(banner?.text_position)}>
            <div className="slider-contain">
              <div style={banner?.text_color ? { color: banner.text_color } : undefined}>
                {subtitle && <h4 style={fontStyle(banner, "subtitle", isMobile, banner?.text_color ? { color: banner.text_color } : undefined)}>{subtitle}</h4>}
                {title && <h1 style={fontStyle(banner, "title", isMobile, banner?.text_color ? { color: banner.text_color } : undefined)}>{title}</h1>}
                <Link href={href} className="btn btn-solid hover-solid btn-md" style={fontStyle(banner, "button", isMobile)}>
                  {pick(banner, "button_text", isMobile) || "Shop Now"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Barra de progreso del auto-desplazamiento: se llena durante `seconds` y al
// completarse avanza el slider (`onElapsed`). Se pausa con el cursor encima o
// con la pestaña oculta (y sigue donde iba al volver) y vuelve a empezar cuando
// cambia el banner (`cycle`), también si el cambio lo hizo el cliente con las
// flechas o deslizando. Vive en su propio componente para que el tic no
// vuelva a renderizar los banners.
const AutoplayProgress = ({ seconds, paused, cycle, onElapsed }) => {
  const [progress, setProgress] = useState(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
  }, [cycle, seconds]);

  useEffect(() => {
    if (paused) return undefined;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      elapsedRef.current += now - last;
      last = now;
      if (elapsedRef.current >= seconds * 1000) {
        elapsedRef.current = 0;
        setProgress(0);
        onElapsed();
      } else {
        setProgress(progressPercent(elapsedRef.current, seconds));
      }
    }, PROGRESS_TICK_MS);
    return () => clearInterval(timer);
  }, [paused, seconds, onElapsed]);

  return (
    <div className="home-slider-progress" aria-hidden="true">
      <span style={{ width: `${progress}%` }} />
    </div>
  );
};

const HomeSlider = ({ bannerData, height, width, sliderClass }) => {
  const isMobile = useIsMobile();
  const banners = bannerData?.banners ?? [];
  // Segundos entre banners (Front → Home Banner): vacío = 5, 0 = sin auto-desplazamiento.
  const seconds = resolveAutoplaySeconds(bannerData?.autoplay_interval);
  const autoplay = shouldAutoplay(banners.length, seconds);
  const sliderRef = useRef(null);
  const [cycle, setCycle] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!autoplay || typeof document === "undefined") return undefined;
    const update = () => setHidden(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [autoplay]);

  const next = useCallback(() => sliderRef.current?.slickNext?.(), []);

  if (banners.length > 1) {
    return (
      <div className="home-slider-autoplay" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <Slider ref={sliderRef} {...homeBannerSettings} className={sliderClass || ""} beforeChange={(_, nextSlide) => setCycle(nextSlide)}>
          {banners.map((banner, i) => (
            <SliderSlide key={i} banner={banner} height={height} width={width} isMobile={isMobile} />
          ))}
        </Slider>
        {autoplay && <AutoplayProgress seconds={seconds} paused={hovered || hidden} cycle={cycle} onElapsed={next} />}
      </div>
    );
  }

  const single = banners[0] ?? bannerData;
  return <SliderSlide banner={single} height={height} width={width} isMobile={isMobile} />;
};

export default HomeSlider;
