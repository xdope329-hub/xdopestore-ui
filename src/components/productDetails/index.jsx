"use client";
import NoDataFound from "@/components/widgets/NoDataFound";
import ProductIdsContext from "@/context/productIdsContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import Loader from "@/layout/loader";
import request from "@/utils/axiosUtils";
import { ProductAPI } from "@/utils/axiosUtils/API";
import Breadcrumbs from "@/utils/commonComponents/breadcrumb";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import StickyCheckout from "./common/stickyCheckout";
import Product4Image from "./product4Image";
import ProductAccordion from "./productAccordion";
import ProductColumn from "./productColumn";
import ProductDigital from "./productDigital";
import ProductThumbnailImage from "./productImageOutside";
import ProductSidebarLayout from "./productSidebarLayout";
import ProductSlider from "./productSlider";
import ProductSticky from "./productSticky";
import ProductThumbnail from "./productThumbnail";
import ProductVerticalTab from "./productVerticalTab";

const ProductDetailContent = ({ params }) => {
  const router = useRouter();
  const { themeOption, setWhatsappProduct } = useContext(ThemeOptionContext);
  const { setGetProductIds, isLoading: productLoader } = useContext(ProductIdsContext);
  const searchParams = useSearchParams();
  const queryProductLayout = searchParams.get("layout");
  // Getting Product Layout
  const isProductLayout = useMemo(() => {
    return queryProductLayout ? queryProductLayout : themeOption?.product?.product_layout ?? "product_thumbnail";
  }, [queryProductLayout, themeOption]);

  const [productState, setProductState] = useState({ product: [], attributeValues: [], productQty: 1, selectedVariation: "", variantIds: [], statusIds: [] });

  // Calling Product API on slug
  const { data: ProductData, isLoading, isFetched, isFetching, refetch, error } = useFetchQuery([params], () => request({ url: `${ProductAPI}/${params}` }, router), { enabled: false, refetchOnWindowFocus: false, select: (res) => res?.data });
  // Calling Product API when params is there
  useEffect(() => {
    params && refetch();
  }, [params]);

  // Setting Product API Data on state Variable and getting ids from cross_sell_products,related_products;
  useEffect(() => {
    if (ProductData) {
      (ProductData?.cross_sell_products?.length > 0 || ProductData?.related_products?.length > 0) && setGetProductIds({ ids: Array.from(new Set([...ProductData?.cross_sell_products, ...ProductData?.related_products])).join(",") });
      setProductState({ ...productState, product: ProductData });
    }
  }, [isLoading]);

  // Referencia para el botón flotante de WhatsApp: mientras se está en la
  // ficha, su mensaje lleva este producto y la variante elegida.
  useEffect(() => {
    if (!setWhatsappProduct) return undefined;
    const product = productState?.product;
    setWhatsappProduct(product?.slug ? { name: product.name, slug: product.slug, variation: productState?.selectedVariation || null } : null);
    return () => setWhatsappProduct(null);
  }, [productState?.product?.id, productState?.selectedVariation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleScroll = () => {
      const button = document.querySelector(".scroll-button");
      if (button) {
        const buttonRect = button.getBoundingClientRect();
        if (buttonRect.bottom < window.innerHeight && buttonRect.bottom < 0) {
          document.body.classList.add("stickyCart");
          const stickyBar = document.querySelector(".sticky-bottom-cart");
          document.body.style.paddingBottom = stickyBar ? stickyBar.offsetHeight + "px" : "80px";
        } else {
          document.body.classList.remove("stickyCart");
          document.body.style.paddingBottom = "";
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.classList?.remove("stickyCart");
      document.body.style.paddingBottom = "";
    };
  }, []);

  if (isLoading) return <Loader />;

  // Slug inexistente o producto inactivo: el API responde 404. Antes se
  // pintaba la ficha vacía y su botón de carrito agregaba una línea sin
  // producto ($0 en el carrito local; CastError en el servidor).
  if (isFetched && !isFetching && !ProductData?.id) {
    return (
      <>
        <Breadcrumbs title={params} subNavigation={[{ name: "Product" }, { name: params }]} />
        <NoDataFound customClass="no-data-added" imageUrl="/assets/svg/empty-items.svg" title="NoProductFound" height="300" width="300" />
      </>
    );
  }

  const showProductLayout = {
    product_thumbnail: <ProductThumbnail productState={productState} setProductState={setProductState} />,
    product_images: <Product4Image productState={productState} setProductState={setProductState} />,
    product_sticky: <ProductSticky productState={productState} setProductState={setProductState} />,
    product_slider: <ProductSlider productState={productState} setProductState={setProductState} />,
    product_digital: <ProductDigital productState={productState} setProductState={setProductState} />,
    product_accordion: <ProductAccordion productState={productState} setProductState={setProductState} />,
    product_no_sidebar: <ProductThumbnail productState={productState} setProductState={setProductState} />,
    vertical_tab: <ProductVerticalTab productState={productState} setProductState={setProductState} />,
    product_thumbnail_left_image: <ProductThumbnailImage direction="left" productState={productState} setProductState={setProductState} />,
    product_thumbnail_right_image: <ProductThumbnailImage direction="right" productState={productState} setProductState={setProductState} />,
    product_thumbnail_image_outside: <ProductThumbnailImage productState={productState} setProductState={setProductState} />,
    product_sidebar_left: <ProductSidebarLayout productState={productState} setProductState={setProductState} direction="left" />,
    product_sidebar_right: <ProductSidebarLayout productState={productState} setProductState={setProductState} direction="right" />,
    product_column_thumbnail: <ProductColumn productState={productState} setProductState={setProductState} direction="bottom" />,
  };
  return (
    <>
      {<Breadcrumbs title={params} subNavigation={[{ name: "Product" }, { name: params }]} />}
      {showProductLayout[isProductLayout]}
      {ProductData && <StickyCheckout ProductData={ProductData} isLoading={isLoading} />}
    </>
  );
};

export default ProductDetailContent;
