'use client'
import ImageLink from '@/components/widgets/imageLink'
import WrapperComponent from '@/components/widgets/WrapperComponent'
import BrandIdsContext from '@/context/brandIdsContext'
import ProductIdsContext from '@/context/productIdsContext'
import { horizontalProductSlider } from '@/data/sliderSetting/SliderSetting'
import Loader from '@/layout/loader'
import { ImagePath } from '@/utils/constants'
import useCustomDataQuery from '@/utils/hooks/useCustomDataQuery'
import useIsMobile from '@/utils/hooks/useIsMobile'
import { useSkeletonLoader2 } from '@/utils/hooks/useSkeleton2'
import React, { useContext, useEffect } from 'react'
import { Container, Row } from 'reactstrap'
import HomeBrand from '../../widgets/HomeBrand'
import HomeParallaxBanner from '../../widgets/HomeParallaxBanner'
import HomeProduct from '../../widgets/HomeProduct'
import HomeProductTab from '../../widgets/HomeProductTab'
import HomeServices from '../../widgets/HomeService'
import HomeSlider from '../../widgets/HomeSlider'
import HomeSocialMedia from '../../widgets/HomeSocialMedia'
import HomeTitle from '../../widgets/HomeTitle'

const pickField = (obj, key, isMobile) => (isMobile && obj?.[`${key}_mobile`]) || obj?.[key];
const fontStyle = (obj, prefix, isMobile, base) => {
  const family = pickField(obj, `${prefix}_font_family`, isMobile);
  const size = pickField(obj, `${prefix}_font_size`, isMobile);
  const style = { ...(base || {}) };
  if (family) style.fontFamily = family;
  if (size) style.fontSize = `${size}px`;
  return Object.keys(style).length ? style : undefined;
};

const offerBannerPositionClass = (pos) => {
  switch (pos) {
    case 'right': return ' p-right';
    case 'top-left': return ' p-top';
    case 'top-right': return ' p-top p-right';
    default: return '';
  }
};

const Fashion1 = () => {
  const { data, isLoading, refetch, fetchStatus } = useCustomDataQuery({
    params: 'fashion_one',
  })
  const isMobile = useIsMobile()
  const { setGetProductIds, isRefetching: productLoad } =
    useContext(ProductIdsContext)
  const { setGetBrandIds, isLoading: brandLoading } =
    useContext(BrandIdsContext)

  useEffect(() => {
    if (data?.products_ids?.length > 0) {
      setGetProductIds({
        ids: Array.from(new Set(data?.products_ids))?.join(','),
      })
    }
    if (data?.brands?.brand_ids?.length > 0) {
      setGetBrandIds({
        ids: Array.from(new Set(data?.brands?.brand_ids))?.join(','),
      })
    }
  }, [data])

  useEffect(() => {
    refetch()
  }, [])

  useEffect(() => {
    document.body.classList.add('home')
    return () => {
      document.body.classList.remove('home')
    }
  }, [])

  useSkeletonLoader2([productLoad, brandLoading])
  if (isLoading && document.body) return <Loader />

  return (
    <>
      {/* Home Banner Slider */}
      <WrapperComponent
        classes={{
          sectionClass: 'p-0',
          fluidClass: 'home-slider',
        }}
        noRowCol={true}
      >
        <HomeSlider bannerData={data?.home_banner} height={627} width={1835} />
      </WrapperComponent>

      {/* Offer Banners */}
      {(data?.offer_banner?.banner_1?.status || data?.offer_banner?.banner_2?.status) && (
        <WrapperComponent
          classes={{
            sectionClass: 'pb-0 ratio2_1 banner-section',
            fluidClass: 'container',
          }}
        >
          <Row className="g-sm-4 g-3">
            {data?.offer_banner?.banner_1?.status && (
              <div className={data?.offer_banner?.banner_2?.status ? 'col-6' : 'col-12'}>
                <div className={`collection-banner position-relative overflow-hidden d-block${offerBannerPositionClass(data?.offer_banner?.banner_1?.text_position)}`} style={{ height: '260px' }}>
                  <div className="img-part" style={{ height: '100%' }}>
                    <ImageLink
                      imgUrl={data?.offer_banner?.banner_1}
                      placeholder={`${ImagePath}/two_column_banner.png`}
                      height={338}
                      width={676}
                    />
                  </div>
                  {data?.offer_banner?.banner_1?.text_bg && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1, pointerEvents: 'none' }} />
                  )}
                  {(() => {
                    const b1 = data?.offer_banner?.banner_1 || {};
                    const t = (isMobile && b1.title_mobile) || b1.title;
                    const s = (isMobile && b1.subtitle_mobile) || b1.subtitle;
                    return (t || s) ? (
                      <div className="contain-banner banner-3" style={{ pointerEvents: 'none', zIndex: 2 }}>
                        <div style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                          {s && <h4 style={fontStyle(b1, 'subtitle', isMobile, b1.text_color ? { color: b1.text_color } : undefined)}>{s}</h4>}
                          {t && <h2 className="font-smaller" style={fontStyle(b1, 'title', isMobile, b1.text_color ? { color: b1.text_color } : undefined)}>{t}</h2>}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}
            {data?.offer_banner?.banner_2?.status && (
              <div className={data?.offer_banner?.banner_1?.status ? 'col-6' : 'col-12'}>
                <div className={`collection-banner position-relative overflow-hidden d-block${offerBannerPositionClass(data?.offer_banner?.banner_2?.text_position)}`} style={{ height: '260px' }}>
                  <div className="img-part" style={{ height: '100%' }}>
                    <ImageLink
                      imgUrl={data?.offer_banner?.banner_2}
                      placeholder={`${ImagePath}/two_column_banner.png`}
                      height={338}
                      width={676}
                    />
                  </div>
                  {data?.offer_banner?.banner_2?.text_bg && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1, pointerEvents: 'none' }} />
                  )}
                  {(() => {
                    const b2 = data?.offer_banner?.banner_2 || {};
                    const t = (isMobile && b2.title_mobile) || b2.title;
                    const s = (isMobile && b2.subtitle_mobile) || b2.subtitle;
                    return (t || s) ? (
                      <div className="contain-banner banner-3" style={{ pointerEvents: 'none', zIndex: 2 }}>
                        <div style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                          {s && <h4 style={fontStyle(b2, 'subtitle', isMobile, b2.text_color ? { color: b2.text_color } : undefined)}>{s}</h4>}
                          {t && <h2 className="font-smaller" style={fontStyle(b2, 'title', isMobile, b2.text_color ? { color: b2.text_color } : undefined)}>{t}</h2>}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}
          </Row>
        </WrapperComponent>
      )}

      {/* Products Slider */}
      {data?.products_list?.status && (
        <>
          <HomeTitle title={data?.products_list} type="basic" />
          <WrapperComponent
            classes={{
              sectionClass: 'section-b-space pt-0',
              fluidClass: 'container',
            }}
          >
            <div className="product-4 no-arrow">
              <HomeProduct
                slider={true}
                style="vertical"
                productIds={data?.products_list?.product_ids || []}
                sliderOptions={horizontalProductSlider}
              />
            </div>
          </WrapperComponent>
        </>
      )}

      {/* Product Categories */}
      {data?.category_product?.status && (
        <>
          <HomeTitle title={data?.category_product} type="basic" />
          <WrapperComponent
            classes={{
              sectionClass: 'section-b-space category-tab-section pt-0',
              fluidClass: 'container',
            }}
          >
            <HomeProductTab
              categoryIds={data?.category_product?.category_ids}
              style="vertical"
            />
          </WrapperComponent>
        </>
      )}

      {/* Brands */}
      {!!data?.brands?.status && data?.brands?.brand_ids?.length > 0 && (
        <WrapperComponent
          classes={{
            sectionClass: 'section-b-space',
            fluidClass: 'container',
          }}
          noRowCol={true}
        >
          <HomeTitle title={{ title: data?.brands?.title || 'Our Brands' }} type="basic" />
          <HomeBrand brandIds={data?.brands?.brand_ids} />
        </WrapperComponent>
      )}

      {/* Services */}
      {data?.services?.banners?.length > 0 && (
        <Container>
          <WrapperComponent
            classes={{
              sectionClass: 'service border-section small-section',
            }}
            noRowCol={true}
          >
            <HomeServices services={data?.services?.banners || []} />
          </WrapperComponent>
        </Container>
      )}

      {/* Parallax Banner */}
      {data?.parallax_banner?.status && (
        <section className="p-0 game-parallax effect-cls section-t-space">
          <HomeParallaxBanner banners={data?.parallax_banner} />
        </section>
      )}

      {/* Social Media */}
      {data?.social_media?.banners?.length > 0 && data?.social_media?.status && (
        <section className="instagram ratio_square overflow-hidden section-t-space section-b-space">
          <HomeSocialMedia
            media={data?.social_media || []}
            classes="container-fluid"
            type="borderless"
          />
        </section>
      )}
    </>
  )
}

export default Fashion1