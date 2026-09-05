import CartContext from "@/context/cartContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import WishlistContext from "@/context/wishlistContext";
import { Href } from "@/utils/constants";
import useBumpOnIncrease from "@/utils/hooks/useBumpOnIncrease";
import Cookies from "js-cookie";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiHeartLine, RiHome2Line, RiSearch2Line, RiShoppingBagLine, RiUserLine } from "react-icons/ri";

const MobileMenu = () => {
  // Hook de react-i18next, no el `t` global de i18next: el singleton del
  // servidor renderizaba "Home" y el cliente "Inicio", y cada página
  // registraba un error de hidratación de React.
  const { t } = useTranslation("common");
  const { setOpenAuthModal, setCartCanvas } = useContext(ThemeOptionContext);
  const { cartProducts } = useContext(CartContext) || {};
  const cartCount = cartProducts?.length || 0;
  const cartBumped = useBumpOnIncrease(cartCount);

  // Wishlist indicator: show a count badge on the bottom-nav item whenever
  // the wishlist has products, and bump it when something is added.
  const { wishlistIds, wishlistProducts } = useContext(WishlistContext) || {};
  const wishlistCount = useMemo(() => {
    const fromIds = wishlistIds ? Object.keys(wishlistIds).length : 0;
    return fromIds || (wishlistProducts?.length ?? 0);
  }, [wishlistIds, wishlistProducts]);
  const wishlistBumped = useBumpOnIncrease(wishlistCount);

  const isAuthenticated = Cookies.get("uat");
  const router = useRouter();
  const handleProfileClick = (path) => {
    isAuthenticated ? router.push("/account/dashboard") : setOpenAuthModal(true);
    handleActive(5);
  };
  const handleWishlist = () => {
    router.push("/wishlist");
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
          <a href={Href} onClick={() => handleWishlist()} style={{ position: "relative" }}>
            <span className={wishlistBumped ? "cart-bump" : ""} style={{ display: "inline-flex", position: "relative" }}>
              <RiHeartLine />
              {wishlistCount > 0 && <span className="mobile-cart-badge">{wishlistCount}</span>}
            </span>
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
