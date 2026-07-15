"use client";
import { homeBannerSettings } from "@/data/sliderSetting/SliderSetting";
import { ImagePath, storageURL } from "@/utils/constants";
import useIsMobile from "@/utils/hooks/useIsMobile";
import Link from "next/link";
import Slider from "react-slick";

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
      : banner.redirect_link.link
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

const HomeSlider = ({ bannerData, height, width, sliderClass }) => {
  const isMobile = useIsMobile();
  const banners = bannerData?.banners ?? [];

  if (banners.length > 1) {
    return (
      <Slider {...homeBannerSettings} className={sliderClass || ""}>
        {banners.map((banner, i) => (
          <SliderSlide key={i} banner={banner} height={height} width={width} isMobile={isMobile} />
        ))}
      </Slider>
    );
  }

  const single = banners[0] ?? bannerData;
  return <SliderSlide banner={single} height={height} width={width} isMobile={isMobile} />;
};

export default HomeSlider;
