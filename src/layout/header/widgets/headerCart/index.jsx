import CartContext from "@/context/cartContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import useBumpOnIncrease from "@/utils/hooks/useBumpOnIncrease";
import React, { useContext } from "react";
import { RiShoppingCartLine } from "react-icons/ri";
import HeaderCartData from "./HeaderCartData";

const HeaderCart = () => {
  const { setCartCanvas } = useContext(ThemeOptionContext);
  const { cartProducts } = useContext(CartContext);
  const count = cartProducts?.length || 0;
  // Pulse the badge whenever an item is added (count goes up).
  const bumped = useBumpOnIncrease(count);
  return (
    <>
      <RiShoppingCartLine onClick={() => setCartCanvas(true)} />
      {count > 0 && <span className={`cart_qty_cls ${bumped ? "cart-bump" : ""}`}>{count}</span>}
      <HeaderCartData />
    </>
  );
};

export default HeaderCart;
