import WrapperComponent from "@/components/widgets/WrapperComponent";
import { Col } from "reactstrap";
import CustomerOrderCount from "../common/CustomerOrderCount";
import PaymentOptions from "../common/PaymentOptions";
import ProductBundle from "../common/ProductBundle";
import ProductContent from "../common/ProductContent";
import ProductDeliveryInformation from "../common/ProductDeliveryInformation";
import ProductDetailsTab from "../common/ProductDetailsTab";
import ProductInformation from "../common/ProductInformation";
import ProductStatus from "../common/ProductStatus";
import WishlistCompareShare from "../common/WishlistCompareShare";
import FourImage from "./FourImage";
import RelatedProduct from "../common/RelatedProduct";

const Product4Image = ({ productState, setProductState }) => {
  return (
    <WrapperComponent classes={{ sectionClass: "collection-wrapper ratio_asos", fluidClass: "container", row: "g-4" }} customCol={true}>
      <Col lg={6}>
        <FourImage productState={productState} />
      </Col>
      <Col lg={6} className="rtl-text">
        <div className="product-page-details">
          <CustomerOrderCount productState={productState} />
          <ProductContent productState={productState} setProductState={setProductState} />
          <WishlistCompareShare productState={productState} />
          <ProductStatus productState={productState} />
          <ProductInformation productState={productState} />
          <ProductDeliveryInformation productState={productState} />
          <PaymentOptions productState={productState} />
          {(productState?.product?.cross_sell_products?.length > 0 || productState?.product?.type === "bundle") && (
            <Col xs={12} className="related-product-2">
              <ProductBundle productState={productState} setProductState={setProductState} />
            </Col>
          )}
        </div>
      </Col>
      <WrapperComponent classes={{ sectionClass: "tab-product product-details-contain m-0 section-b-space", fluidClass: "container" }} customCol={true}>
        <ProductDetailsTab productState={productState} setProductState={setProductState} />
      </WrapperComponent>
      {productState?.product?.related_products?.length > 0 && <RelatedProduct productState={productState} setProductState={setProductState} />}

    </WrapperComponent>
  );
};

export default Product4Image;
