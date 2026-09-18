import CheckoutCard from "./common/CheckoutCard";
import { Col, Input, Label, Row } from "reactstrap";
import { RiBankCardLine } from "react-icons/ri";
import { useTranslation } from "react-i18next";
import { Fragment, useContext, useEffect, useState } from "react";
import { loadDraft } from "./guestCheckoutDraft";
import SettingContext from "@/context/settingContext";
import { ModifyString } from "@/utils/customFunctions/ModifyString";

// Friendly display data per gateway; anything unknown falls back to the raw
// name in uppercase (previous behaviour).
const PAYMENT_METHOD_META = {
  cod: { labelKey: "PaymentMethodCod", descriptionKey: "PaymentMethodCodDescription" },
  mercadopago: { labelKey: "PaymentMethodMercadoPago", descriptionKey: "PaymentMethodMercadoPagoDescription" },
};

const PaymentOptions = ({ values, setFieldValue }) => {
  const { t } = useTranslation("common");
  const { settingData } = useContext(SettingContext);
  const [initial, setInitial] = useState("");
  // Preselección: el método ya elegido si sigue activo; si no, el que el
  // invitado había elegido antes de un refresh (borrador en sessionStorage,
  // el mismo que restaura GuestDraftSync: ambos efectos corren en el mismo
  // tick y antes este pisaba al borrador y el cliente volvía a Mercado Pago
  // sin notarlo); si no, Mercado Pago si está activo; si no, el primer
  // método activo (nunca uno oculto).
  useEffect(() => {
    const methods = settingData?.payment_methods || [];
    const activeIndex = (name) => (name ? methods.findIndex((m) => m?.status && m?.name === name) : -1);
    const chosen = activeIndex(values?.payment_method);
    if (chosen !== -1) {
      setInitial(chosen);
      return;
    }
    const draft = typeof window !== "undefined" ? loadDraft(window.sessionStorage) : null;
    let idx = activeIndex(draft?.payment_method);
    if (idx === -1) idx = activeIndex("mercadopago");
    if (idx === -1) idx = methods.findIndex((m) => m?.status);
    if (idx !== -1) {
      setFieldValue("payment_method", methods[idx].name);
      setInitial(idx);
    }
  }, [settingData?.payment_methods, values?.payment_method]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <CheckoutCard icon={<RiBankCardLine />}>
      <div className="checkout-title">
        <h4>{t("PaymentOption")}</h4>
      </div>
      <div className="checkout-detail">
        <Row className="g-sm-4 g-3">
          {settingData?.payment_methods?.length > 0 &&
            settingData?.payment_methods?.map((elem, i) => (
              <Fragment key={i}>
                {/* !!: un método desactivado (status 0) pintaba un "0" suelto en la sección */}
                {!!elem?.status && (
                  <Col xs={12} xxl={elem?.name === "mercadopago" ? 12 : 6}>
                    <div className="payment-option">
                      <div className="payment-category w-100">
                        <div className="d-flex align-items-start w-100">
                          <div className="form-check custom-form-check hide-check-box flex-grow-1">
                            <Input
                              className="form-check-input"
                              id={elem?.name}
                              checked={i == initial}
                              type="radio"
                              name="payment_method"
                              onChange={() => {
                                setFieldValue("payment_method", elem.name);
                                setInitial(i);
                              }}
                            />
                            <Label className="form-check-label" htmlFor={elem.name}>
                              {PAYMENT_METHOD_META[elem?.name] ? t(PAYMENT_METHOD_META[elem.name].labelKey) : ModifyString(elem?.name, "upper")}
                              {PAYMENT_METHOD_META[elem?.name]?.descriptionKey && (
                                <small className="d-block text-muted">{t(PAYMENT_METHOD_META[elem.name].descriptionKey)}</small>
                              )}
                              {elem?.name === "mercadopago" && (
                                <img
                                  src="/assets/images/payment/mercadopago-methods.jpg"
                                  alt={t("MercadoPagoMethodsAlt")}
                                  className="payment-methods-full"
                                />
                              )}
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                )}
              </Fragment>
            ))}
        </Row>
      </div>
    </CheckoutCard>
  );
};

export default PaymentOptions;
