import NoDataFound from "@/components/widgets/NoDataFound";
import BrandIdsContext from "@/context/brandIdsContext";
import { BrandSlider } from "@/data/sliderSetting/SliderSetting";
import Link from "next/link";
import React, { useContext, useEffect, useMemo } from "react";
import Slider from "react-slick";
import { Container } from "reactstrap";

const HomeBrand = ({ bgLight, brandIds, sliderOptions }) => {
  const { setGetBrandIds, filteredBrand } = useContext(BrandIdsContext);

  // Defensive dedupe — theme options may list the same brand id repeatedly.
  const uniqueBrands = useMemo(() => {
    const seen = new Set();
    return (filteredBrand || []).filter((b) => {
      const key = b?.id ?? b?.slug ?? b?.name;
      if (key == null || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filteredBrand]);

  const brandMainSettings = sliderOptions && sliderOptions(uniqueBrands.length);
  const brandSliderOption = brandMainSettings ? brandMainSettings : BrandSlider(uniqueBrands.length);

  useEffect(() => {
    if (brandIds?.length > 0) {
      setGetBrandIds({ ids: Array.from(new Set(brandIds))?.join(",") });
    }
  }, [brandIds]);

  return (
    <>
      <Container>
        {uniqueBrands?.length ? (
          <div className={`row ${bgLight ? "bg-light" : ""}`}>
            <div className="brand-slider-box no-arrow">
              <Slider {...brandSliderOption}>
                {uniqueBrands?.map((item, index) => (
                  <div key={index}>
                    <Link className="logo-block" key={index} href={`/brand/${item?.slug}`}>
                      {item.brand_image?.original_url ? <img src={item.brand_image?.original_url} alt="" className="img-fluid" /> : <h4>{item?.name}</h4>}
                    </Link>
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        ) : (
          <NoDataFound customClass="no-data-added" title="NoBrandFound" />
        )}
      </Container>
    </>
  );
};

export default HomeBrand;
