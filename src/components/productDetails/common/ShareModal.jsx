import Btn from "@/elements/buttons/Btn";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiCloseLine } from "react-icons/ri";
import { Input, Modal, ModalBody, ModalHeader } from "reactstrap";

const ShareModal = ({ productState, modal, setModal }) => {
  const socialMediaIcons = ["ri-facebook-line", "ri-twitter-line", "ri-linkedin-line", "ri-whatsapp-line", "ri-mail-line"];
  const { slug } = productState?.product;
  // The shared link must point to THIS storefront, not the API
  // (process.env.API_PROD_URL was used before, producing localhost:5000/API links).
  // window.location is browser-only, so resolve it in an effect.
  const [productUrl, setProductUrl] = useState("");
  const [shareLink, setShareLink] = useState("");
  const { t } = useTranslation("common");

  useEffect(() => {
    if (typeof window !== "undefined" && slug) {
      const url = `${window.location.origin}/product/${slug}`;
      setProductUrl(url);
      setShareLink(url);
    }
  }, [slug]);

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    ToastNotification("success", "LinkCopiedToClipboard");
  };

  // Clicking a network icon now actually opens that network's share dialog
  // (before, it only swapped the text in the input field).
  const handleShare = (shareOn) => {
    const mainMedia = shareOn.split("-")[1];
    const encoded = encodeURIComponent(productUrl);
    if (mainMedia == "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, "_blank");
    } else if (mainMedia == "twitter") {
      window.open(`https://twitter.com/intent/tweet?url=${encoded}`, "_blank");
    } else if (mainMedia == "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, "_blank");
    } else if (mainMedia == "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
    } else if (mainMedia == "mail") {
      const subject = "Check out this awesome product!";
      const body = `I thought you might be interested in this product: ${productUrl}`;
      const emailShareUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = emailShareUrl;
    }
  };
  return (
    <Modal centered isOpen={modal} toggle={() => setModal(false)} className="theme-modal-2">
      <div className="">
        <ModalHeader>
          {t("Share")}
          <Btn className="btn-close" onClick={() => setModal(false)}>
            <RiCloseLine />
          </Btn>
        </ModalHeader>
        <ModalBody>
          <div className="bordered-box">
            <div className="product-social">
              {socialMediaIcons.map((item, i) => (
                <li key={i} onClick={() => handleShare(item)}>
                  <div style={{ cursor: "pointer" }}>
                    <i className={item} />
                  </div>
                </li>
              ))}
            </div>
            <form>
              <div className="gap-3 input-group form-box">
                <Input type="text" value={shareLink} onChange={(e) => setShareLink(e.target.value)} />
                <Btn className={`${shareLink.trim() ? "" : "disabled"} btn-solid buy-button`} onClick={copyLink}>
                  {t("CopyLink")}
                </Btn>
              </div>
            </form>
          </div>
        </ModalBody>
      </div>
    </Modal>
  );
};

export default ShareModal;
