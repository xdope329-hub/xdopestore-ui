import WishlistContext from "@/context/wishlistContext";
import Btn from "@/elements/buttons/Btn";
import { audioFile, Href } from "@/utils/constants";
import { getWishlistProductId } from "@/utils/customFunctions/SyncLocalWishlist";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiHeartFill, RiHeartLine } from "react-icons/ri";

const WishlistButton = ({ productstate, customClass, hideAction, customAnchor }) => {
  const { t } = useTranslation("common");
  const [addToWishlistAudio] = useState(() => (typeof window !== "undefined" ? new Audio(audioFile) : null));
  const { addToWishlist, removeWishlist, wishlistIds } = useContext(WishlistContext);

  const productId = getWishlistProductId(productstate);
  const isWishlisted = !!wishlistIds?.[productId];

  const handelWishlist = () => {
    addToWishlistAudio?.play();
    if (isWishlisted) {
      removeWishlist(productId, wishlistIds[productId]);
    } else {
      addToWishlist(productstate);
    }
  };

  return (
    <>
      {customClass ? (
        <Btn className={customClass ? customClass : ""} onClick={handelWishlist}>
          {isWishlisted ? <RiHeartFill className="theme-color" /> : <RiHeartLine />}
        </Btn>
      ) : customAnchor ? (
        <a href={Href} title={t("AddToWishlist")} className={`wishlist-icon ${isWishlisted ? "theme-color" : ""}`} onClick={handelWishlist}>
          <i className={`ri-heart-${isWishlisted ? "fill" : "line"}`}></i>
        </a>
      ) : (
        !hideAction?.includes("wishlist") && (
          <div title={t("WishlistTitle")} onClick={handelWishlist} className="wishlist-icon">
            <a className={"heart-icon"}>{isWishlisted ? <RiHeartFill className="theme-color" /> : <RiHeartLine />}</a>
          </div>
        )
      )}
    </>
  );
};

export default WishlistButton;
