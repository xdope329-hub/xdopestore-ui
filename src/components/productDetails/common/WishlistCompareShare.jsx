import WishlistContext from "@/context/wishlistContext";
import { audioFile } from "@/utils/constants";
import { getWishlistProductId } from "@/utils/customFunctions/SyncLocalWishlist";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiHeartFill, RiHeartLine, RiShareLine } from "react-icons/ri";
import ShareModal from "./ShareModal";

const WishlistCompareShare = ({ productState }) => {
  const [addToWishlistAudio, setAddToWishlistAudio] = useState(null);
  const { t } = useTranslation("common");
  const { addToWishlist, removeWishlist, wishlistIds } = useContext(WishlistContext);
  const [modal, setModal] = useState(false);
  const productId = getWishlistProductId(productState?.product);
  const productWishlist = !!wishlistIds?.[productId];

  const handelWishlist = () => {
    addToWishlistAudio?.play();
    if (productWishlist) {
      removeWishlist(productId, wishlistIds[productId]);
    } else {
      addToWishlist(productState?.product);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAddToWishlistAudio(new Audio(audioFile));
    }
  }, []);

  return (
    <>
      <div className="buy-box compare-box">
        <a onClick={handelWishlist}>
          {productWishlist ? <RiHeartFill /> : <RiHeartLine />}
          <span>{t("AddToWishlist")}</span>
        </a>
        {productState?.product?.social_share ? (
          <a onClick={() => setModal(true)}>
            <RiShareLine />
            <span>{t("Share")}</span>
          </a>
        ) : null}
      </div>
      <ShareModal productState={productState} modal={modal} setModal={setModal} />
    </>
  );
};

export default WishlistCompareShare;
