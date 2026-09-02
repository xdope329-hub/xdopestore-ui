import HandleQuantity from "@/components/cart/HandleQuantity";
import Avatar from "@/components/widgets/Avatar";
import { placeHolderImage } from "@/components/widgets/Placeholder";
import { getCartLineImage } from "@/utils/customFunctions/cartLineImage";
import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import Btn from "@/elements/buttons/Btn";
import Cookies from "js-cookie";
import Link from "next/link";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiDeleteBinLine, RiPencilLine } from "react-icons/ri";

const SelectedCart = ({ modal, setSelectedVariation, setModal }) => {
  const { convertCurrency } = useContext(SettingContext);
  const { setCartCanvas } = useContext(ThemeOptionContext);
  const { cartProducts, removeCart, getTotal } = useContext(CartContext);
  const { t } = useTranslation("common");
  const onEdit = (data) => {
    setSelectedVariation(() => data);
    setTimeout(() => {
      setModal(true);
    }, 0);
  };
  const total = useMemo(() => {
    return getTotal(cartProducts);
  }, [cartProducts, modal]);

  const handelCheckout = () => {
    Cookies.set("CallBackUrl", "/checkout");
  };

  useEffect(() => {
    cartProducts?.filter((elem) => {
      if (elem?.variation) {
        elem.variation.selected_variation = elem?.variation?.attribute_values?.map((values) => values?.value).join("/");
      } else {
        elem;
      }
    });
  }, [modal]);

  return (
    <>
      <div className="cart_media">
        <ul className="cart_product">
          {cartProducts.map((elem, i) => (
            <li className="product-box-contain" key={i}>
              <div className="media">
                <Link href={`/product/${elem?.product?.slug}`}>
                  <Avatar customClass={""} data={getCartLineImage(elem)} placeHolder={placeHolderImage} name={elem?.product?.name} height={72} width={87} />
                </Link>
                <div className="media-body">
                  <Link href={`/product/${elem?.product?.slug}`}>
                    <h4>{elem?.variation?.name ?? elem?.product?.name}</h4>
                  </Link>
                  <h4 className="quantity">
                    <span>{convertCurrency(elem?.variation?.sale_price ?? elem?.product?.sale_price)}</span>
                  </h4>
                  {elem?.variation && <h5 className="gram">{elem?.variation?.attribute_values?.[0]?.value ? elem?.variation?.attribute_values?.[0]?.value : elem?.selected_variation}</h5>}
                  <HandleQuantity productObj={elem?.product} elem={elem} customIcon={<RiDeleteBinLine />} />
                  <div className="close-circle">
                    {elem?.variation && (
                      <Btn className="close_button delete-button edit-button" color="transparent" onClick={() => onEdit(elem)}>
                        <RiPencilLine />
                      </Btn>
                    )}
                    <Btn className="delete-button close_button" color="transparent" onClick={() => removeCart(elem?.variation_id ? elem?.variation_id : elem?.product_id, elem?.id, elem)}>
                      <RiDeleteBinLine />
                    </Btn>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {cartProducts?.length ? (
          <ul className="cart_total ">
            <li>
              <div className="total">
                <h5>
                  {t("SubTotal")} : <span>{convertCurrency(total)}</span>
                </h5>
              </div>
            </li>
            <li>
              <div className="buttons">
                <Link href={`/cart`} className="btn view-cart" onClick={() => setCartCanvas(false)}>
                  {t("ViewCart")}
                </Link>
                <Link
                  href={"/checkout"}
                  className="btn checkout"
                  onClick={() => {
                    setCartCanvas(false), handelCheckout;
                  }}
                >
                  {t("Checkout")}
                </Link>
              </div>
            </li>
          </ul>
        ) : null}
      </div>
    </>
  );
};

export default SelectedCart;
