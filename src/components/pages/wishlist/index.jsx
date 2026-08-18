"use client";
import NoDataFound from "@/components/widgets/NoDataFound";
import WrapperComponent from "@/components/widgets/WrapperComponent";
import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import WishlistContext from "@/context/wishlistContext";
import Loader from "@/layout/loader";
import Breadcrumbs from "@/utils/commonComponents/breadcrumb";
import { Href } from "@/utils/constants";
import { getWishlistProductId } from "@/utils/customFunctions/SyncLocalWishlist";
import Cookies from "js-cookie";
import Link from "next/link";
import { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RiCloseLine, RiShoppingCartLine } from "react-icons/ri";
import { Table } from "reactstrap";
import emptyImage from "/public/assets/svg/empty-items.svg";

const WishlistContent = () => {
  const { wishlistProducts, WishlistAPILoading, removeWishlist } = useContext(WishlistContext);
  const { t } = useTranslation("common");
  const { setCartCanvas, openAuthModal, setOpenAuthModal } = useContext(ThemeOptionContext);
  const { handleIncDec, openCartSidebar } = useContext(CartContext);
  const removeFromWishlist = (product) => {
    removeWishlist(getWishlistProductId(product), product.id);
  };
  const { convertCurrency } = useContext(SettingContext);

  const addToCart = (product) => {
    setCartCanvas(true);
    handleIncDec(1, product);
  };

  // Clear any leftover scroll-lock from Reactstrap Modal on mount and whenever the modal closes.
  // Checking openAuthModal prevents clearing the lock while the modal is legitimately open.
  useEffect(() => {
    if (!openAuthModal) {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    }
  }, [openAuthModal]);

  return (
    <>
      <Breadcrumbs title={"Wishlist"} subNavigation={[{ name: "Wishlist" }]} />
      <WrapperComponent classes={{ sectionClass: "wishlist-section section-b-space", row: "g-sm-3 g-2", col: "table-responsive", fluidClass: "container" }} colProps={{ sm: "12" }}>
        {!Cookies.get("uat") && wishlistProducts?.length > 0 && (
          <div className="alert alert-light border d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4" role="status">
            <span>{t("GuestWishlistSyncPrompt")}</span>
            <button type="button" className="btn btn-solid btn-sm" onClick={() => setOpenAuthModal(true)}>
              {t("SignInToSync")}
            </button>
          </div>
        )}
        {WishlistAPILoading ? (
          <Loader />
        ) : wishlistProducts?.length > 0 ? (
          <>
            <Table className="cart-table">
              <thead>
                <tr className="table-head">
                  <th scope="col">{t("Image")}</th>
                  <th scope="col">{t("ProductName")}</th>
                  <th scope="col">{t("Price")}</th>
                  <th scope="col">{t("Availability")}</th>
                  <th scope="col">{t("Action")}</th>
                </tr>
              </thead>
              <tbody>
                {wishlistProducts?.map((product, i) => (
                  <tr key={i}>
                    <td>
                      <Link href={`/product/${product?.slug}`}>
                        <img height={90} width={90} src={product?.product_galleries?.[0]?.original_url || product?.product_galleries?.[1]?.original_url} alt={product?.slug} />
                      </Link>
                    </td>
                    <td>
                      <Link href={`/product/${product?.slug}`}>{product?.name}</Link>
                      <div className="mobile-cart-content row">
                        <div className="col">
                          <p>{product?.stock_status?.replaceAll("_", " ")}</p>
                        </div>
                        <div className="col">
                          <h2>
                            {convertCurrency(product?.sale_price)} {product?.sale_price >= product?.price ? null : <del>{convertCurrency(product?.price)}</del>}
                          </h2>
                        </div>
                        <div className="col">
                          <div className="icon-box d-flex gap-2 justify-content-center">
                            <button className="icon btn p-0 border-0 bg-transparent" onClick={() => removeFromWishlist(product)}>
                              <RiCloseLine />
                            </button>
                            <button className="cart btn p-0 border-0 bg-transparent" onClick={() => addToCart(product)}>
                              <RiShoppingCartLine />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <h2>
                        {convertCurrency(product?.sale_price)} {product?.sale_price >= product?.price ? null : <del>{convertCurrency(product?.price)}</del>}
                      </h2>
                    </td>
                    <td>
                      <p>{product?.stock_status?.replaceAll("_", " ")}</p>
                    </td>

                    <td>
                      <div className="icon-box d-flex gap-2 justify-content-center">
                        <button className="icon btn p-0 border-0 bg-transparent" onClick={() => removeFromWishlist(product)}>
                          <RiCloseLine />
                        </button>
                        <button className="cart btn p-0 border-0 bg-transparent" onClick={() => addToCart(product)}>
                          <RiShoppingCartLine />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        ) : (
          <NoDataFound customClass="no-data-added" imageUrl={emptyImage} title="NoItemsAdded" description="NoWishListDescription" height="300" width="300" />
        )}
      </WrapperComponent>
    </>
  );
};

export default WishlistContent;
