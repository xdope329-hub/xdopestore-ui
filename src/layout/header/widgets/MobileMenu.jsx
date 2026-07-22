import CartContext from "@/context/cartContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import { Href } from "@/utils/constants";
import useBumpOnIncrease from "@/utils/hooks/useBumpOnIncrease";
import { t } from "i18next";
import Cookies from "js-cookie";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useContext, useState } from "react";
import { RiHeartLine, RiHome2Line, RiSearch2Line, RiShoppingBagLine, RiUserLine } from "react-icons/ri";

const MobileMenu = () => {
  const { setOpenAuthModal, setCartCanvas } = useContext(ThemeOptionContext);
  const { cartProducts } = useContext(CartContext) || {};
  const cartCount = cartProducts?.length || 0;
  const cartBumped = useBumpOnIncrease(cartCount);

  const isAuthenticated = Cookies.get("uat");
  const router = useRouter();
  const handleProfileClick = (path) => {
    isAuthenticated ? router.push("/account/dashboard") : setOpenAuthModal(true);
    handleActive(5);
  };
  const handleWishlist = () => {
    isAuthenticated ? router.push("/wishlist") : setOpenAuthModal(true);
    handleActive(4);
  };
  const [active, setActive] = useState(1);
  const handleActive = (num) => {
    setActive(num);
  };
  return (
    <div className="mobile-menu d-md-none d-block mobile-cart">
      <ul>
        <li className={active == "1" ? "active" : ""} onClick={() => handleActive(1)}>
          <Link href={"/"}>
            <RiHome2Line />
            <span>{t("Home")}</span>
          </Link>
        </li>
        <li className={active == "2" ? "active" : ""}>
          <Link href={"/search"} onClick={() => handleActive(2)}>
            <RiSearch2Line />
            <span>{t("Search")}</span>
          </Link>
        </li>
        <li className={active == "3" ? "active" : ""}>
          <a href={Href} onClick={() => setCartCanvas(true)} style={{ position: "relative" }}>
            <span className={cartBumped ? "cart-bump" : ""} style={{ display: "inline-flex", position: "relative" }}>
              <RiShoppingBagLine />
              {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
            </span>
            <span>{t("Cart")}</span>
          </a>
        </li>
        <li className={active == "4" ? "active" : ""}>
          <a href={Href} onClick={() => handleWishlist()}>
            <RiHeartLine />
            <span>{t("Wishlist")}</span>
          </a>
        </li>
        <li className={active == "5" ? "active" : ""} onClick={() => handleProfileClick()}>
          <a href={Href}>
            <RiUserLine />
            <span>{t("User")}</span>
          </a>
        </li>
      </ul>
    </div>
  );
};

export default MobileMenu;
