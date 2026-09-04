import RatingBox from "@/components/collection/collectionSidebar/RatingBox";
import Avatar from "@/components/widgets/Avatar";
import CustomModal from "@/components/widgets/CustomModal";
import { placeHolderImage } from "@/components/widgets/Placeholder";
import Btn from "@/elements/buttons/Btn";
import request from "@/utils/axiosUtils";
import { ReviewAPI } from "@/utils/axiosUtils/API";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input, ModalFooter } from "reactstrap";
import { buildReviewPayload, validateRating } from "./pendingReviewsRules";

const MAX_LENGTH = 2000;

// Calificar un producto recibido: estrellas + opinión. La reseña queda
// pendiente hasta que el administrador la apruebe (el API responde con el
// mensaje que se muestra al cliente).
const RateProductModal = ({ item, onClose, onSubmitted }) => {
  const { t } = useTranslation("common");
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const product = item?.product;

  const close = () => {
    if (saving) return;
    setRating(0);
    setDescription("");
    setError(null);
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    const invalid = validateRating(rating);
    if (invalid) return setError(invalid);
    setError(null);
    setSaving(true);
    const res = await request({ url: ReviewAPI, method: "post", data: buildReviewPayload({ productId: product?.id, rating, description }) });
    setSaving(false);
    if (res?.status === 201) {
      ToastNotification("success", res?.data?.message || "ReviewSent");
      onSubmitted && onSubmitted();
      close();
    } else {
      ToastNotification("error", res?.data?.message || "SomethingWentWrong");
    }
  };

  return (
    <CustomModal modal={!!item} setModal={close} classes={{ modalClass: "theme-modal-2", title: "RateYourPurchase" }}>
      <form className="product-review-form" onSubmit={submit}>
        <div className="product-wrapper">
          <div className="product-image">
            <Avatar data={product?.product_thumbnail} placeHolder={placeHolderImage} customImageClass="img-fluid" name={product?.name} />
          </div>
          <div className="product-content">
            <h5 className="name">{product?.name}</h5>
            {item?.order_number ? (
              <p className="text-content mb-0">
                {t("FromOrder")} <span className="fw-bolder">#{item.order_number}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="review-box">
          <div className="product-review-rating">
            <label>{t("Rating")}</label>
            <div className="product-rating">
              <RatingBox key={product?.id} totalRating={rating} clickAble={true} setFieldValue={(_, value) => setRating(value)} name="rating" />
            </div>
            {error && <p className="text-danger mb-0 mt-1">{t(error)}</p>}
          </div>
        </div>

        <div className="review-box">
          <label className="form-label" htmlFor="review-description">
            {t("YourOpinion")}
          </label>
          <Input id="review-description" type="textarea" rows={4} maxLength={MAX_LENGTH} placeholder={t("ShareYourOpinion")} value={description} onChange={(e) => setDescription(e.target.value)} />
          <p className="text-content mt-2 mb-0" style={{ fontSize: "13px" }}>
            {t("ReviewWillBePublishedAfterReview")}
          </p>
        </div>

        <ModalFooter className="pt-0">
          <Btn className="btn btn-md btn-outline fw-bold" title="Cancel" type="button" onClick={close} />
          <Btn className="btn-solid" title="Submit" type="submit" loading={Number(saving)} disabled={saving} />
        </ModalFooter>
      </form>
    </CustomModal>
  );
};

export default RateProductModal;
