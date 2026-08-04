import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import { fireConfetti } from "@/utils/customFunctions/Confetti";
import { useRouter } from "next/navigation";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import AddToCartButton from "./AddToCartButton";
import ProductWholesale from "./ProductWholesale";

const StickyCheckoutButtons = ({ productState, setProductState, extraOption, isDisplay = true }) => {
  const { t } = useTranslation("common");
  const { handleIncDec, isLoading } = useContext(CartContext);
  const { setCartCanvas } = useContext(ThemeOptionContext);
  const { convertCurrency } = useContext(SettingContext);

  const router = useRouter();
  const addToCart = () => {
    fireConfetti();
    setCartCanvas(true);
    handleIncDec(productState?.productQty, productState?.product, false, false, false, productState);
  };
  const buyNow = () => {
    fireConfetti();
    handleIncDec(productState?.productQty, productState?.product, false, false, false, productState);
    // Let the confetti play before moving to checkout.
    setTimeout(() => router.push(`/checkout`), 1100);
  };

  return (
    <>
      {productState?.product?.wholesales?.length ? (
        <>
          <ProductWholesale productState={productState} />
          <h4>
            {"Total Price:"} <span className="theme-color">{convertCurrency(productState?.totalPrice)}</span>
          </h4>
        </>
      ) : null}

      {isDisplay && (
        <div>
          <AddToCartButton productState={productState} isLoading={isLoading} addToCart={addToCart} buyNow={buyNow} extraOption={extraOption} />
        </div>
      )}
    </>
  );
};

export default StickyCheckoutButtons;
