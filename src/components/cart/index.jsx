"use client";
import CapacityHint from "@/components/widgets/capacity/CapacityHint";
import CapacityNotice from "@/components/widgets/capacity/CapacityNotice";
import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import Loader from "@/layout/loader";
import Breadcrumbs from "@/utils/commonComponents/breadcrumb";
import { useContext } from "react";
import WrapperComponent from "../widgets/WrapperComponent";
import CartButtons from "./CartButtons";
import ShowCartData from "./ShowCartData";

const CartContent = () => {
  const { cartProducts, getCartLoading } = useContext(CartContext);
  const { isLoading } = useContext(ThemeOptionContext);
  const { capacityReached } = useContext(SettingContext) || {};

  if (isLoading) return <Loader />;
  return (
    <>
      <Breadcrumbs title={"Cart"} subNavigation={[{ name: "Cart" }]} />
      <WrapperComponent classes={{ sectionClass: "cart-section section-b-space", fluidClass: "container" }} noRowCol={true}>
        {capacityReached && <CapacityNotice className="mb-4" />}
        <CapacityHint className="mb-4" />
        <ShowCartData />
        {cartProducts.length > 0 && !capacityReached && <CartButtons />}
      </WrapperComponent>
    </>
  );
};

export default CartContent;
