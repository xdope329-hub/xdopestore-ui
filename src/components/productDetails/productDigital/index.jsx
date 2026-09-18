import WrapperComponent from "@/components/widgets/WrapperComponent";
import WishlistContext from "@/context/wishlistContext";
import { Href } from "@/utils/constants";
import { dateFormat } from "@/utils/customFunctions/DateFormat";
import { getWishlistProductId } from "@/utils/customFunctions/SyncLocalWishlist";
import Link from "next/link";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { RiHeartFill, RiHeartLine } from "react-icons/ri";
import { Col } from "reactstrap";
import ProductContent from "../common/ProductContent";
import ProductWholesale from "../common/ProductWholesale";
import VendorContains from "../common/VendorContains";
import DigitalImage from "./DigitalImage";

const ProductDigital = ({ productState, setProductState }) => {
  const { addToWishlist, removeWishlist, wishlistIds } = useContext(WishlistContext);
  const { t } = useTranslation("common");
  const productId = getWishlistProductId(productState?.product);
  const isWishlisted = !!wishlistIds?.[productId];

  const handelWishlist = () => {
    if (isWishlisted) {
      removeWishlist(productId, wishlistIds[productId]);
    } else {
      addToWishlist(productState?.product);
    }
  };
  return (
    <WrapperComponent classes={{ sectionClass: "product-section section-b-space theme-product-section", row: "g-4" }} customCol={true}>
      <Col xl={8} lg={7}>
        <DigitalImage productState={productState} />
      </Col>
      <Col xl={4} lg={5} className="vendor-right-box">
        <div className="right-box-contain">
          <div className="main-right-box-contain">
            <div className="vendor-box">
              <VendorContains productState={productState} />
              <div className="vendor-detail">
                <p>{productState.product.short_description}</p>
              </div>
            </div>

            <ProductContent productState={productState} setProductState={setProductState} />
            <div className="buy-box">
              <a onClick={() => handelWishlist()}>
                {isWishlisted ? <RiHeartFill /> : <RiHeartLine />}
                <span>{t("AddToWishlist")}</span>
              </a>
            </div>

            <div className="pickup-box">
              <div className="product-title">
                <h4>{t("AssetsInformation")}</h4>
              </div>

              <div className="product-info">
                <ul className="product-info-list product-info-list-2">
                  <li>
                    {t("Created")} :<Link href={Href}>{dateFormat(productState?.product?.created_at)}</Link>
                  </li>
                  {productState.product.updated_at && (
                    <li>
                      {t("LastUpdate")} :<Link href={Href}>{dateFormat(productState?.product?.updated_at)}</Link>
                    </li>
                  )}

                  {productState?.product?.tags?.length ? (
                    <li className="d-flex align-items-center">
                      <span>{t("Tags")} :</span>
                      <ul className="tag-list">
                        {productState?.product?.tags?.map((tag, i) => (
                          <li key={i}>
                            <Link href={Href}>{tag.name}</Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </div>
        </div>
        {!productState?.product?.wholesales?.length ? (
          <>
            <ProductWholesale productState={productState} />
          </>
        ) : null}
      </Col>
    </WrapperComponent>
  );
};

export default ProductDigital;
