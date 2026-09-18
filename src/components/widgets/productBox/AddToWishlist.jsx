import WishlistContext from "@/context/wishlistContext";
import { Href } from "@/utils/constants";
import { getWishlistProductId } from "@/utils/customFunctions/SyncLocalWishlist";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { RiHeartFill, RiHeartLine } from "react-icons/ri";

const AddToWishlist = ({ productObj, customClass }) => {
  const { t } = useTranslation("common");
  const { addToWishlist, removeWishlist, wishlistIds } = useContext(WishlistContext);

  const productId = getWishlistProductId(productObj);
  const isWishlisted = !!wishlistIds?.[productId];

  const handelWishlist = () => {
    if (isWishlisted) {
      removeWishlist(productId, wishlistIds[productId]);
    } else {
      addToWishlist(productObj);
    }
  };

  return (
    <>
      {customClass ? (
        <a onClick={handelWishlist} href={Href} className={customClass ? customClass : ""}>
          {isWishlisted ? <RiHeartFill className="theme-color" /> : <RiHeartLine />}
        </a>
      ) : (
        <li title={t("WishlistTitle")} onClick={handelWishlist}>
          <a className={"heart-icon"}>{isWishlisted ? <RiHeartFill className="theme-color" /> : <RiHeartLine />}</a>
        </li>
      )}
    </>
  );
};

export default AddToWishlist;
