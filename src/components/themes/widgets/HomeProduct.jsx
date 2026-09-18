import NoDataFound from "@/components/widgets/NoDataFound";
import ProductBox from "@/components/widgets/productBox";
import ProductIdsContext from "@/context/productIdsContext";
import request from "@/utils/axiosUtils";
import { ProductAPI } from "@/utils/axiosUtils/API";
import useFetchQuery from "@/utils/hooks/useFetchQuery";
import { useRouter } from "next/navigation";
import React, { useContext, useEffect, useMemo } from "react";
import Slider from "react-slick";
import { Row } from "reactstrap";
const HomeProduct = ({ type, style, slider = false, productIds, product_box_style, classForVertical, sliderOptions, rowClass }) => {
  const { filteredProduct } = useContext(ProductIdsContext);
  const router = useRouter();

  // The saved homepage config may list the same product id more than once —
  // dedupe before fetching so the slider never sizes itself for phantom items.
  const uniqueIds = useMemo(() => Array.from(new Set(productIds || [])), [productIds]);

  // Check if productIds is defined and not empty
  const {
    data: fetchedProducts,
    refetch,
    fetchStatus,
    isLoading,
  } = useFetchQuery(
    ["NewProds", uniqueIds], // Include productIds in the query key
    () => request({ url: ProductAPI, params: { ids: uniqueIds?.join(","), status: 1 } }, router),
    {
      enabled: !!uniqueIds?.length, // Only fetch if productIds has values
      refetchOnWindowFocus: false,
      select: (res) => res?.data?.data,
    }
  );

  // Defensive dedupe of the fetched list as well (by product id).
  const products = useMemo(() => {
    const seen = new Set();
    return (fetchedProducts || []).filter((p) => {
      const key = p?.id ?? p?._id ?? p?.slug;
      if (key == null || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [fetchedProducts]);

  // Size the carousel from the REAL product count (fetched), falling back to
  // the deduped id list before data arrives — otherwise react-slick clones
  // slides to fill empty slots and the same product appears repeated.
  const sliderSettingMain = sliderOptions && sliderOptions(products?.length || uniqueIds?.length);

  useEffect(() => {
    refetch();
  }, [uniqueIds]);

  return (
    <>
      {style === "horizontal" ? (
        slider ? (
          products?.length ? (
            <Slider {...sliderSettingMain}>
              {products?.map((product, index) => (
                <div key={index}>
                  <div className="theme-card center-align d-block">
                    <div className="offer-slider">
                      <div className="sec-1">
                        <div className="product-box2">
                          <ProductBox product={product} style={style} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          ) : (
            <NoDataFound title="NoProductFound" customClass={"no-data-added"} />
          )
        ) : product_box_style == "single_product" ? (
          products?.map((product, i) => <ProductBox key={i} product={product} style={style} boxStyle={product_box_style} />)
        ) : product_box_style === "horizontal" ? (
          <div className="row g-3">
            {products?.map((product, index) => (
              <div key={index} className="col-xl-3 col-md-6 col-sm-12">
                <div className="theme-card center-align">
                  <div className="offer-slider">
                    <div className="sec-1">
                      <div className="product-box2 product-box">
                        <ProductBox product={product} style={style} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {products?.length === 0 && <NoDataFound title="NoProductFound" customClass={"no-data-added"} />}
          </div>
        ) : (
          <div>
            {products?.map((product, index) => (
              <ProductBox key={index} product={product} style={style} boxStyle={product_box_style} />
            ))}
            {products?.length === 0 && <NoDataFound title="NoProductFound" customClass={"no-data-added"} />}
          </div>
        )
      ) : style === "vertical" ? (
        slider ? (
          <div className={`product-4 ${classForVertical || ""}`}>
            {products?.length ? (
              <Slider {...sliderSettingMain}>
                {products?.map((product, index) => (
                  <div key={index}>
                    <div className={classForVertical}>
                      {/* Las primeras diapositivas están a la vista: foto inmediata. */}
                      <ProductBox product={product} style={style} priority={index < 4} />
                    </div>
                  </div>
                ))}
              </Slider>
            ) : (
              <NoDataFound title="NoProductFound" customClass="no-data-added" />
            )}
          </div>
        ) : (
          <>
            <Row className={rowClass ? rowClass : "row-cols-xl-4 row-cols-md-3 row-cols-2 g-sm-4 g-3 m-0"}>
              {products?.map((product, index) => (
                <div key={index} className={classForVertical}>
                  {/* Primera fila (hasta 4 columnas) a la vista: foto inmediata;
                      el resto carga en diferido al hacer scroll. */}
                  <ProductBox product={product} style={style} priority={index < 4} />
                </div>
              ))}
            </Row>
            {products?.length === 0 && <NoDataFound title="NoProductFound" customClass="no-data-added" />}
          </>
        )
      ) : null}
    </>
  );
};
export default HomeProduct;
