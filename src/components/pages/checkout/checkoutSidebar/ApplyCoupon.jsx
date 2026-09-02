import SettingContext from "@/context/settingContext";
import Btn from "@/elements/buttons/Btn";
import request from "@/utils/axiosUtils";
import { CouponAPI } from "@/utils/axiosUtils/API";
import { Href, ImagePath } from "@/utils/constants";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiCouponLine } from "react-icons/ri";
import { Col, Input, Row } from "reactstrap";
import CouponModal from "./CouponModal";

// `mutate` es el recompute del sidebar: POST /checkout con TODO el contexto
// del pedido (productos del invitado, ciudad, cupón). Llamar al API solo con
// { coupon_code } hacía que el invitado recibiera "carrito vacío".
const ApplyCoupon = ({ data, setFieldValue, storeCoupon, setStoreCoupon, values, appliedCoupon, setAppliedCoupon, errorCoupon, mutate, isLoading, sessionToken }) => {
  const { t } = useTranslation("common");
  const { convertCurrency } = useContext(SettingContext);
  const [toggle, setToggle] = useState(false);
  const router = useRouter();

  // GET /coupon exige sesión: para un invitado devolvía 401 en cada visita
  // al checkout (y ese 401 era el que disparaba la renovación silenciosa de
  // la sesión anterior). El invitado sigue pudiendo escribir su código.
  const { data: couponData } = useFetchQuery([CouponAPI], () => request({ url: CouponAPI, params: { status: 1 } }, router), {
    enabled: Boolean(sessionToken),
    refetchOnWindowFocus: false,
    select: (res) => res?.data?.data ?? [],
  });

  // Escribir el código solo actualiza el campo: el API se consulta al
  // pulsar "Aplicar", no en cada tecla.
  const onCouponChange = (value) => {
    setFieldValue("coupon", value);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setFieldValue("coupon", "");
    setStoreCoupon("");
    mutate && mutate({ coupon_code: "" });
  };

  const onCouponApplyClick = () => {
    const code = String(values?.coupon || "").trim();
    if (!code) {
      ToastNotification("error", t("EnterCouponCode"));
      return;
    }
    setFieldValue("coupon", code);
    setStoreCoupon(code);
    mutate && mutate({ coupon_code: code });
  };

  const onCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    ToastNotification("success", "CodeCopiedToClipboard");
  };

  return (
    <div className="promo-code-box">
      <div className="promo-title">
        <h5>{t("PromoCode")}</h5>
        {sessionToken && (
          <a href={Href} onClick={() => setToggle(true)}>
            <RiCouponLine /> {t("ViewAll")}
          </a>
        )}
      </div>
      <Row className="g-sm-3 g-2 mb-3">
        {couponData?.slice(0, 2).map((item, i) => (
          <Col xl="6" key={i}>
            <div className="coupon-box">
              <div className="card-name">
                <h6>{item?.title}</h6>
              </div>
              <div className="coupon-content">
                <div className="coupon-apply">
                  <h6 className="coupon-code success-color">#{item?.code}</h6>
                  <Btn color="transparent" title={"CopyCode"} className="theme-btn border-btn copy-btn mt-0" onClick={() => onCopyCode(item?.code)} />
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
      {appliedCoupon == "applied" ? (
        <div className="offer-apply-box">
          <Image src={`${ImagePath}/offer.gif`} className="img-fluid" height={20} width={20} alt="offer" />
          <div>
            <h4>
              {t("Yousaved")} <span>{convertCurrency(data?.data?.coupon_total_discount || 0)}</span> {t("withthiscode")} 🎉 <p>{t("CouponApplied")}</p>
            </h4>
          </div>
          <a style={{ cursor: "pointer" }} className="close-coupon" onClick={() => removeCoupon()}>
            {t("Remove")}
          </a>
        </div>
      ) : (
        <>
          <div className="coupon-input-box">
            <Input type="text" name="coupon" value={values["coupon"] || ""} placeholder={t("EnterCoupon")} onChange={(e) => onCouponChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onCouponApplyClick(); } }} />
            <div>
              <Btn className="apply-button" onClick={onCouponApplyClick} disabled={Boolean(isLoading)}>
                {t("ApplyNow")}
              </Btn>
            </div>
          </div>
          {errorCoupon ? <p className="text-danger coupon-error mt-2 mb-0" style={{ fontSize: "13px" }}>{t(errorCoupon, { defaultValue: errorCoupon })}</p> : null}
        </>
      )}
      <CouponModal couponData={couponData} onCopyCode={onCopyCode} toggle={toggle} setToggle={setToggle} />
    </div>
  );
};

export default ApplyCoupon;
