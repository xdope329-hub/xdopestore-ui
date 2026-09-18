import { ModifyString } from "@/utils/customFunctions/ModifyString";
import { useTranslation } from "react-i18next";

const ProductInformation = ({ productState }) => {
  const { t } = useTranslation("common");
  return (
    <div className="bordered-box">
      <h4 className="sub-title">{t("ProductInformation")}</h4>

      <ul className="shipping-info">
        <li>
          {t("SKU")} : {productState?.selectedVariation?.sku ?? productState?.product?.sku}
        </li>

        {productState?.selectedVariation?.unit ? (
          <li>
            {t("Unit")} : {productState?.selectedVariation?.unit ?? productState?.product?.unit}
          </li>
        ) : null}
        {productState?.product?.weight ? (
          <li>
            {t("Weight")} : {productState?.product?.weight} {ModifyString("gms")}
          </li>
        ) : null}
        <li>
          {t("StockStatus")} : {t((productState?.selectedVariation?.stock_status ?? productState?.product?.stock_status) === "out_of_stock" ? "OutOfStock" : "InStock")}
        </li>
        <li>
          {t("Quantity")} : {productState?.selectedVariation?.quantity ?? productState?.product?.quantity} {t("ItemsLeft")}
        </li>
      </ul>
    </div>
  );
};

export default ProductInformation;
