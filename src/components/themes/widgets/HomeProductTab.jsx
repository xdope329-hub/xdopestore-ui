import NoDataFound from "@/components/widgets/NoDataFound";
import ProductBox from "@/components/widgets/productBox";
import ProductSkeleton from "@/components/widgets/skeletonLoader/ProductSkeleton";
import CategoryContext from "@/context/categoryContext";
import { dynamicHorizontalSlider } from "@/data/sliderSetting/SliderSetting";
import request from "@/utils/axiosUtils";
import { ProductAPI } from "@/utils/axiosUtils/API";
import { Href } from "@/utils/constants";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import { useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import Slider from "react-slick";
import { Col, Row } from "reactstrap";

const HomeProductTab = ({ categoryIds, slider, style, tab_title_class, tabStyle, classes, type, title, product_box_style, sliderOptions, paginate, isFilterCategoryDataNested, dynamic, customSelect }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [currentCategory, setCurrentCategory] = useState("");
  const { filterCategory } = useContext(CategoryContext);
  const categoryData = filterCategory("product");
  const [skeletonArr, setSkeletonArray] = useState([]); //

  const [customSelectedId, setCustomSelectedId] = useState("");

  const filterCategoryDataNested = (categoryData, categoryIds) => {
    if (!categoryData || !categoryIds) return [];
    const idSet = new Set(categoryIds);
    const seen = new Set();
    const result = [];
    const visit = (category) => {
      if (seen.has(category.id)) return;
      if (idSet.has(category.id)) {
        seen.add(category.id);
        result.push(category);
        category.subcategories?.forEach(visit);
      } else {
        category.subcategories?.forEach(visit);
      }
    };
    categoryData.forEach(visit);
    return result;
  };

  // The API returns a flat list that already includes subcategories — just filter by id directly.
  const filterCategoryData = (categoryData, categoryIds) => {
    if (!categoryData || !categoryIds) return [];
    const idSet = new Set(categoryIds);
    return categoryData.filter((cat) => idSet.has(cat.id));
  };

  const filteredCategoriesRaw = isFilterCategoryDataNested ? filterCategoryDataNested(categoryData, categoryIds) : filterCategoryData(categoryData, categoryIds);

  // Fallback: if the configured category_ids don't resolve to any real
  // category (stale/empty config, or an id-format mismatch), don't leave the
  // tab silently empty — show the product categories that actually have
  // products, preferring those with a product count.
  const filteredCategories = (() => {
    if (filteredCategoriesRaw?.length) return filteredCategoriesRaw;
    const all = categoryData || [];
    const withProducts = all.filter((c) => Number(c?.products_count) > 0);
    return withProducts.length ? withProducts : all;
  })();

  // Auto-select the first category as soon as the tab list is available so the
  // storefront shows its products by default (instead of "No Product Found").
  useEffect(() => {
    if (!currentCategory && filteredCategories?.length > 0) {
      setCurrentCategory(filteredCategories[0].id);
      setActiveTab(0);
    }
  }, [filteredCategories, currentCategory]);

  const { data: product, refetch, fetchStatus, isLoading } = useFetchQuery([currentCategory], () => request({ url: ProductAPI, params: { category_ids: currentCategory || customSelectedId, status: 1, paginate: paginate ? paginate : 4 } }, router), { enabled: !!(currentCategory || customSelectedId), refetchOnWindowFocus: false, select: (res) => res?.data?.data });

  const changeTab = (index, category) => {
    // Clicking the already-active category (always the case when only one
    // category is configured) navigates to that category's product page;
    // clicking a different tab keeps the inline tab-switching behaviour.
    if (activeTab === index && currentCategory === category?.id && category?.slug) {
      router.push(`/category/${category.slug}`);
      return;
    }
    setActiveTab(index);
    setCurrentCategory(category?.id);
  };

  useEffect(() => {
    const length = product?.length ? product?.length : paginate ? paginate : 5;
    const skeletonArray = new Array(length).fill("skeleton");
    setSkeletonArray(skeletonArray);
  }, [isLoading]);

  useEffect(() => {
    const customSelectId = filteredCategories.find((elem) => elem?.products_count)?.id;
    setCustomSelectedId(customSelectId);
  }, [isLoading, categoryIds]);

  // Auto-select first category when categories load for the first time
  useEffect(() => {
    if (currentCategory || !filteredCategories?.length) return;
    const first = filteredCategories.find((c) => c?.products_count) || filteredCategories[0];
    if (first?.id) setCurrentCategory(first.id);
  }, [filteredCategories?.length]); // eslint-disable-line

  const sliderSetting = sliderOptions && sliderOptions(skeletonArr?.length);
  const sliderOptionsMain = dynamic ? dynamicHorizontalSlider(skeletonArr.length) : sliderSetting;

  return (
    <>
      <div className='theme-tab'>
        {tabStyle === "simple" ? (
          <div className='bg-title-part mt-0'>
            <div className='title-basic mb-0'>
              <h2 className='title'>{title?.title}</h2>
            </div>
            <ul className='tabs tab-title w-bg'>
              {filteredCategories?.map((category, index) => (
                <li key={category.id} className={activeTab === index ? "current" : ""}>
                  <a href={Href} onClick={(e) => { e.preventDefault(); changeTab(index, category); }}>
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : tabStyle === "classic" ? (
          <div className='bg-title-part'>
            <h5 className='title-border'>{title?.title}</h5>
            <ul className='tabs tab-title'>
              {filteredCategories?.map((category, index) => (
                <li key={category.id} className={activeTab === index ? "current" : ""}>
                  <a href={Href} onClick={(e) => { e.preventDefault(); changeTab(index, category); }}>
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : tabStyle === "premium" ? (
          <div className='left-side'>
            <div className='left-tab-title'>
              <h4>{title?.tag}</h4>
              <h3>{title?.title}</h3>
            </div>
            <ul className='tabs tab-title'>
              {filteredCategories?.map((category, index) => (
                <li key={category.id} className={activeTab === index ? "current" : ""}>
                  <a href={Href} onClick={(e) => { e.preventDefault(); changeTab(index, category); }}>
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className={`tabs ${tab_title_class ? tab_title_class : "tab-title"}`}>
            {filteredCategories?.map((category, index) => (
              <li key={category.id} className={activeTab === index ? "current" : ""}>
                <a href={Href} onClick={(e) => { e.preventDefault(); changeTab(index, category); }}>
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className='tab-content-cls'>
          <div id='tab-4' className='tab-content active default' style={{ display: "block" }}>
            {slider ? (
              <div className={`product-4  ${classes ? classes : ""}`}>
                {fetchStatus == "fetching" ? (
                  <Slider {...sliderOptionsMain}>
                    {skeletonArr?.map((_, i) => (
                      <div key={i}>
                        <ProductSkeleton style={style} />
                      </div>
                    ))}
                  </Slider>
                ) : product?.length > 0 ? (
                  <Slider {...sliderOptionsMain}>
                    {product?.map((product, i) => (
                      <div key={i}>
                        <ProductBox product={product} style={style} />
                      </div>
                    ))}
                  </Slider>
                ) : (
                  <NoDataFound customClass='no-data-added' title='NoProductFound' />
                )}
              </div>
            ) : fetchStatus == "fetching" ? (
              <Row className={`${classes ? classes : "g-3 g-sm-4 row-cols-2 row-cols-md-3 row-cols-xl-4"} ${product_box_style === "horizontal" ? "product-tab" : ""}`}>
                {skeletonArr?.map((_, i) => (
                  <ProductSkeleton key={i} style={style} />
                ))}
              </Row>
            ) : product?.length > 0 ? (
              <Row className={`${classes ? classes : "g-3 g-sm-4 row-cols-2 row-cols-md-3 row-cols-xl-4"} ${product_box_style === "horizontal" ? "product-tab" : ""}`}>
                {style === "horizontal" && product_box_style === "horizontal"
                  ? product?.map((product,i) => (
                      <div key={i}>
                        <div key={product.id} className='tab-box'>
                          <div className='product-box2'>
                            <ProductBox product={product} style={style} />
                          </div>
                        </div>
                      </div>
                    ))
                  : product?.map((product, i) => (
                      <Col key={i}>
                        <ProductBox key={product.id} product={product} style={style} />
                      </Col>
                    ))}
              </Row>
            ) : (
              <NoDataFound customClass='no-data-added' title='NoProductFound' />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeProductTab;
