import { placeHolderImage } from "@/components/widgets/Placeholder";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
  const [state, setState] = useState({ nav1: null, nav2: null });
  const [videoType, setVideoType] = useState(["video/mp4", "video/webm", "video/ogg"]);
  const [audioType, setAudioType] = useState(["audio/mpeg", "audio/wav", "audio/ogg"]);
  const slider1 = useRef();
  const slider2 = useRef();
  const { nav1, nav2 } = state;
  const currentVariation = productState?.selectedVariation?.variation_galleries?.length ? productState?.selectedVariation?.variation_galleries : productState?.product?.product_galleries;

  useEffect(() => {
    setState({
      nav1: slider1.current,
      nav2: slider2.current,
    });
  }, []);
  useEffect(() => {
    if (!slider1.current) return;
    const variation = productState?.selectedVariation;
    if (!variation) return;
    if (variation.variation_galleries?.length) {
      // Variation has its own images — go to first slide
      slider1.current.slickGoTo(0);
    } else if (variation.variation_image?.id) {
      const index = productState?.product?.product_galleries?.findIndex(
        (object) => object.id === variation.variation_image.id
      );
      if (index >= 0) slider1.current.slickGoTo(index);
    }
  }, [productState?.selectedVariation?.id]);

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
              <Slider asNavFor={nav2} ref={slider1} prevArrow={<SlickArrowLeft />} nextArrow={<SlickArrowRight />}>
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
              {!currentVariation?.length && <ProductMainImage src={productState?.product?.product_thumbnail ? productState?.product?.product_thumbnail?.original_url : placeHolderImage} alt={productState?.product?.name} />}

              {productState?.product?.product_type == "digital" && <DigitalImageOptions product={productState?.product} />}
            </div>
          </Col>
          <Col xs={12}>
            {
              <Slider {...thumbnailSlider} className="slider-nav no-arrow thumbnail-slider-box" asNavFor={nav1} ref={slider2} slidesToShow={productState.product?.product_galleries?.length <= 3 ? productState.product?.product_galleries?.length : slideToShow}>
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
            }
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ThumbnailProductImage;
