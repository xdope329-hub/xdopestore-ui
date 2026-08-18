import { useContext, useMemo, useState } from "react";
import { Progress } from "reactstrap";
import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import { Href } from "@/utils/constants";
import { useTranslation } from "react-i18next";
import { RiShoppingCartLine, RiTruckLine } from "react-icons/ri";
import CartVariationModal from "./CartVariationModal";
import SelectedCart from "./SelectedCart";

const HeaderCartBottom = ({ modal, setModal, shippingFreeAmt, shippingCal }) => {
  const { convertCurrency } = useContext(SettingContext);
  const [selectedVariation, setSelectedVariation] = useState("");
  const { t } = useTranslation("common");
  const { cartProducts, getTotal, clearCart, clearCartLoader } = useContext(CartContext);
  // Getting total when cartProducts changes
  const total = useMemo(() => {
    return getTotal(cartProducts);
  }, [cartProducts, modal]);

  return (
    <>
      {cartProducts?.length > 0 && (
        <>
          <div className="pere-text-box success-box">
            {shippingFreeAmt > total ? (
              <p>
                {t("Spend")} <span className="shipping">{convertCurrency(shippingFreeAmt - total)}</span> {t("moreandenjoy")} <span className="shipping">{t("FREESHIPPING!")}</span>
              </p>
            ) : (
              <p>
                <span className="shipping">{t("Congratulations")}!</span> {t("Enjoyfreeshippingonus")}!
              </p>
            )}
            <Progress multi>
              {shippingCal <= 30 ? (
                <Progress striped animated color="danger" value={shippingCal}>
                  <div className="progress-icon">
                    <RiTruckLine />
                  </div>
                </Progress>
              ) : shippingCal >= 31 && shippingCal <= 80 ? (
                <Progress striped animated color="warning" value={shippingCal}>
                  <div className="progress-icon">
                    <RiTruckLine />
                  </div>
                </Progress>
              ) : (
                <Progress striped animated value={shippingCal}>
                  <div className="progress-icon">
                    <RiTruckLine />
                  </div>
                </Progress>
              )}
            </Progress>
          </div>
          <div className="sidebar-title">
            <a
              href={Href}
              aria-disabled={clearCartLoader}
              onClick={(event) => {
                event.preventDefault();
                clearCart();
              }}
            >
              {t("ClearCart")}
            </a>
          </div>
          <SelectedCart setSelectedVariation={setSelectedVariation} setModal={setModal} modal={modal} />
        </>
      )}
      <CartVariationModal modal={modal} setModal={setModal} selectedVariation={selectedVariation} />
      {!cartProducts?.length && (
        <div className="cart_media empty-cart">
          <ul className="empty-cart-box">
            <div>
              <div className="icon">
                <RiShoppingCartLine />
              </div>
              <h5>{t("EmptyCartDescription")}</h5>
            </div>
          </ul>
        </div>
      )}
    </>
  );
};

export default HeaderCartBottom;
