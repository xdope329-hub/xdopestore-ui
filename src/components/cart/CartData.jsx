import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import { WishlistAPI } from "@/utils/axiosUtils/API";
import { Href } from "@/utils/constants";
import useCreate from "@/utils/hooks/useCreate";
import Link from "next/link";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { RiCloseLine } from "react-icons/ri";
import { Col, Row } from "reactstrap";
import CartProductDetail from "./CartProductDetail";
import HandleQuantity from "./HandleQuantity";

const CartData = ({ elem }) => {
  const { t } = useTranslation("common");
  const { removeCart } = useContext(CartContext);
  const { convertCurrency } = useContext(SettingContext);
  const { mutate } = useCreate(WishlistAPI, false);
  const unitPrice = elem?.variation?.sale_price ?? elem?.product?.sale_price;
  const regularPrice = elem?.variation?.price ?? elem?.product?.price;
  const savings = Math.max(0, Number(regularPrice) - Number(unitPrice));

  const removeItem = () => {
    removeCart(elem?.variation_id ? elem?.variation_id : elem.product_id, elem?.id);
  };

  return (
    <tr>
      <CartProductDetail elem={elem} />
      <td>
        <Link href={`/product/${elem?.product?.slug}`}>
          {elem?.product?.name}
          {elem?.variation?.name ? <small className="d-block text-content">{elem.variation.name}</small> : null}
        </Link>
        <Row className="mobile-cart-content">
          <Col>
            <div className="qty-box">
              <HandleQuantity productObj={elem?.product} classes={{ customClass: "quantity-price" }} elem={elem} />
            </div>
          </Col>
          <Col className="table-price">
            <h2 className="td-color">
              {convertCurrency(unitPrice)}
              {savings > 0 ? <del className="text-content">{convertCurrency(regularPrice)}</del> : null}
            </h2>
          </Col>
          <Col>
            <a href={Href} className="icon remove-btn" onClick={removeItem}>
              <RiCloseLine />
            </a>
          </Col>
        </Row>
      </td>
      <td className="table-price">
        <h2>
          {convertCurrency(unitPrice)}
          {savings > 0 ? <del className="text-content">{convertCurrency(regularPrice)}</del> : null}
        </h2>
        {savings > 0 ? (
          <h6 className="theme-color">
            {t("YouSave")}: {convertCurrency(savings)}
          </h6>
        ) : null}
      </td>

      <td>
        <div className="qty-box">
          <HandleQuantity productObj={elem?.product} classes={{ customClass: "quantity-price" }} elem={elem} />
        </div>
      </td>

      <td className="subtotal">
        <h2 className="td-color">{convertCurrency(elem?.sub_total)}</h2>
      </td>

      <td>
        <a href={Href} className="icon remove-btn" onClick={removeItem}>
          <RiCloseLine />
        </a>
      </td>
    </tr>
  );
};

export default CartData;
