import SettingContext from "@/context/settingContext";
import Link from "next/link";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import Avatar from "../widgets/Avatar";
import { placeHolderImage } from "../widgets/Placeholder";
import { getCartLineImage } from "@/utils/customFunctions/cartLineImage";

const CartProductDetail = ({ elem }) => {
  const { t } = useTranslation("common");
  const { convertCurrency } = useContext(SettingContext);
  return (
    <td>
      <Link href={`/product/${elem?.product?.slug}`} className="product-image">
        <Avatar customClass="product-image" customImageClass={"img-fluid"} data={getCartLineImage(elem)} placeHolder={placeHolderImage} name={elem?.product?.name} />
      </Link>
    </td>
  );
};

export default CartProductDetail;
