import Avatar from "@/components/widgets/Avatar";
import CustomModal from "@/components/widgets/CustomModal";
import { placeHolderImage } from "@/components/widgets/Placeholder";
import SettingContext from "@/context/settingContext";
import Btn from "@/elements/buttons/Btn";
import request from "@/utils/axiosUtils";
import { RefundAPI } from "@/utils/axiosUtils/API";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input, Label } from "reactstrap";
import { buildRefundPayload } from "./refundRules";

// Solicitud de reembolso de una línea del pedido. Antes enviaba
// `pivot.product_id` y `pivot.order_id`, campos que no existen, y el API
// era un stub: la solicitud nunca se guardaba.
const RefundModal = ({ modal, setModal, storeData, orderId, onSubmitted }) => {
  const { t } = useTranslation("common");
  const { convertCurrency } = useContext(SettingContext);
  const [reason, setReason] = useState("");
  const [paymentType, setPaymentType] = useState("original");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const close = () => {
    if (saving) return;
    setReason("");
    setPaymentType("original");
    setError(null);
    setModal("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return setError("Reasonisrequired");
    setError(null);
    setSaving(true);
    const res = await request({ url: RefundAPI, method: "post", data: buildRefundPayload({ orderId, product: storeData, reason, paymentType }) });
    setSaving(false);
    if (res?.status === 201) {
      ToastNotification("success", res?.data?.message || "RefundRequestSubmitted");
      onSubmitted && onSubmitted();
      close();
    } else {
      ToastNotification("error", res?.data?.message || "SomethingWentWrong");
    }
  };

  return (
    <CustomModal modal={modal ? true : false} setModal={close} classes={{ modalClass: "theme-modal-2 refund-modal", modalHeaderClass: "p-0", title: "Refund" }}>
      <form className="product-review-form" onSubmit={submit}>
        <div className="product-wrapper">
          <div className="product-image">
            <Avatar data={storeData?.product_thumbnail ? storeData?.product_thumbnail : placeHolderImage} customImageClass="img-fluid" name={storeData?.name} />
          </div>
          <div className="product-content">
            <h5 className="name">{storeData?.pivot?.variation?.name || storeData?.name}</h5>
            <div className="product-review-rating">
              <div className="product-rating">
                <h6 className="price-number">{convertCurrency(storeData?.pivot?.single_price)}</h6>
              </div>
            </div>
          </div>
        </div>

        <div className="review-box">
          <Label className="form-label" htmlFor="refund-reason">
            {t("Reason")}
          </Label>
          <Input id="refund-reason" type="textarea" rows={3} maxLength={1000} placeholder={t("EnterReason")} value={reason} onChange={(e) => setReason(e.target.value)} />
          {error && <p className="text-danger mb-0 mt-1">{t(error, { defaultValue: "Reason is required" })}</p>}
        </div>
        <div className="review-box">
          <div className="form-box">
            <Label className="form-label" htmlFor="refund-payment-type">
              {t("SelectPaymentOption")}
            </Label>
            <select id="refund-payment-type" className="form-select" name="payment_type" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
              <option value="original">{t("OriginalPaymentMethod", { defaultValue: "Original payment method" })}</option>
              <option value="paypal">{t("Paypal")}</option>
            </select>
          </div>
        </div>
        <div className="refund-footer-button">
          <Btn className="btn-md btn-outline fw-bold" title="Cancel" type="button" onClick={close} />
          <Btn className="btn-solid" title="Submit" type="submit" loading={Number(saving)} disabled={saving} />
        </div>
      </form>
    </CustomModal>
  );
};

export default RefundModal;
