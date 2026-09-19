import { placeHolderImage } from "@/components/widgets/Placeholder";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiHeadphoneLine, RiVideoLine } from "react-icons/ri";
import ProductMainImage from "../common/ProductMainImage";
import Slider from "react-slick";
import { Col, Row } from "reactstrap";
import DigitalImageOptions from "../common/DigitalImageOptions";
import SlickArrowLeft from "../common/SlickArrowLeft";
import SlickArrowRight from "../common/SlickArrowRight";

const ThumbnailProductImage = ({ productState, slideToShow }) => {
  const { t } = useTranslation("common");
  // Callback refs en vez de useRef+setState en useEffect: setear al mismo
  // instance no dispara re-render (React compara por Object.is), así que no
  // hay bucle infinito de updates (React error #185) cuando el Slider se
  // remonta al llegar la galería.
  const [slider1, setSlider1] = useState(null);
  const [slider2, setSlider2] = useState(null);
  const [videoType, setVideoType] = useState(["video/mp4", "video/webm", "video/ogg"]);
  const [audioType, setAudioType] = useState(["audio/mpeg", "audio/wav", "audio/ogg"]);
  const currentVariation = productState?.selectedVariation?.variation_galleries?.length ? productState?.selectedVariation?.variation_galleries : productState?.product?.product_galleries;
  const hasGallery = Array.isArray(currentVariation) && currentVariation.length > 0;
  // Con una sola imagen slick clona el slide para su loop interno y en el DOM
  // aparece la misma imagen apilada 2-3 veces; ademas la fila de thumbnails
  // duplica el unico thumb. Simple product con 1 imagen no necesita carrusel:
  // se pinta la unica imagen y se oculta la nav.
  const hasMultipleImages = hasGallery && currentVariation.length > 1;
  const singleImage = hasGallery && !hasMultipleImages ? currentVariation[0] : null;
  // Slick no reinicializa `slidesToShow` cuando cambia en vivo (p.ej. de 1 a
  // 3 al elegir una variante con más imágenes): los thumbnails se salen del
  // track y quedan apilados. Con este key el Slider se remonta cuando cambia
  // la cantidad de slides y Slick recalcula el layout desde cero.
  const gallerySignature = hasGallery ? String(currentVariation.length) : "empty";

  useEffect(() => {
    if (!slider1) return;
    const variation = productState?.selectedVariation;
    if (!variation) return;
    // Al cambiar el key del Slider (remount por gallerySignature), slick
    // deja su innerSlider en null por un tick antes de reinicializarse;
    // llamar slickGoTo en ese hueco tira "Cannot read properties of null".
    // Se difiere al siguiente frame y se ignora si aún no está listo.
    const raf = requestAnimationFrame(() => {
      try {
        if (variation.variation_galleries?.length) {
          slider1.slickGoTo(0);
        } else if (variation.variation_image?.id) {
          const index = productState?.product?.product_galleries?.findIndex(
            (object) => object.id === variation.variation_image.id
          );
          if (index >= 0) slider1.slickGoTo(index);
        }
      } catch (_) { /* slider aún no montado */ }
    });
    return () => cancelAnimationFrame(raf);
  }, [productState?.selectedVariation?.id, slider1]);

  let thumbnailSlider = {
    loop: false,
    focusOnSelect: true,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 450,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
  };

  return (
    <div className="sticky-top-custom">
      <div className="thumbnail-image-slider">
        <Row className="g-sm-4 g-3">
          <Col xs={12}>
            <div className={`product-slick position-relative main-product-box  ${!currentVariation?.length ? "no-arrow" : ""}`}>
              {productState?.product?.is_sale_enable || productState?.product?.is_trending || productState?.product?.is_featured ? (
                <ul className="product-detail-label">
                  {productState?.product.is_sale_enable ? <li className="soldout">{t("Sale")}</li> : ""}
                  {productState?.product.is_trending ? <li className="trending">{t("Trending")}</li> : ""}
                  {productState?.product.is_featured ? <li className="featured">{t("Featured")}</li> : ""}
                </ul>
              ) : null}
              {hasMultipleImages && (
              <Slider key={`main-${gallerySignature}`} asNavFor={slider2} ref={setSlider1} prevArrow={<SlickArrowLeft />} nextArrow={<SlickArrowRight />}>
                {currentVariation?.map((image, i) => (
                  <div key={i}>
                    <div className="slider-image">
                      {videoType.includes(image.mime_type) ? (
                        <>
                          <video className="w-100 " controls>
                            <source src={image ? image?.original_url : ""} type={image?.mime_type}></source>
                          </video>
                        </>
                      ) : audioType.includes(image?.mime_type) ? (
                        <div className="slider-main-img">
                          <audio controls>
                            <source src={image ? image.original_url : ""} type={image.mime_type}></source>
                          </audio>
                        </div>
                      ) : (
                        <ProductMainImage src={image?.original_url} alt={image?.name} />
                      )}
                    </div>
                  </div>
                ))}
              </Slider>
              )}
              {!hasMultipleImages && singleImage && (
                videoType.includes(singleImage.mime_type) ? (
                  <div className="slider-image">
                    <video className="w-100" controls>
                      <source src={singleImage.original_url} type={singleImage.mime_type} />
                    </video>
                  </div>
                ) : audioType.includes(singleImage.mime_type) ? (
                  <div className="slider-main-img">
                    <audio controls>
                      <source src={singleImage.original_url} type={singleImage.mime_type} />
                    </audio>
                  </div>
                ) : (
                  <ProductMainImage src={singleImage.original_url} alt={singleImage.name || productState?.product?.name} />
                )
              )}
              {!hasGallery && <ProductMainImage src={productState?.product?.product_thumbnail ? productState?.product?.product_thumbnail?.original_url : placeHolderImage} alt={productState?.product?.name} />}

              {productState?.product?.product_type == "digital" && <DigitalImageOptions product={productState?.product} />}
            </div>
          </Col>
          <Col xs={12}>
            {hasMultipleImages && (
              <Slider key={`nav-${gallerySignature}`} {...thumbnailSlider} className="slider-nav no-arrow thumbnail-slider-box" asNavFor={slider1} ref={setSlider2} slidesToShow={currentVariation.length <= 3 ? currentVariation.length : slideToShow}>
                {currentVariation?.map((image, i) => (
                  <div key={i} className="slider-image">
                    {videoType.includes(image.mime_type) ? (
                      <>
                        <div className="video-icon">
                          <RiVideoLine />
                        </div>
                        <video width="130" height="130">
                          <source src={image ? image?.original_url : ""} type={image?.mime_type} />
                        </video>
                      </>
                    ) : audioType.includes(image?.mime_type) ? (
                      <span>
                        <RiHeadphoneLine size={100} />
                      </span>
                    ) : (
                      <Image src={image?.original_url} alt={image?.name} className="img-fluid" height={130} width={130} />
                    )}
                  </div>
                ))}
              </Slider>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ThumbnailProductImage;
