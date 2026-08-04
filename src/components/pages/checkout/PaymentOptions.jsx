import CheckoutCard from "./common/CheckoutCard";
import { Col, Input, Label, Row } from "reactstrap";
import { RiBankCardLine } from "react-icons/ri";
import { useTranslation } from "react-i18next";
import { Fragment, useContext, useEffect, useState } from "react";
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
  // Pre-select the first ACTIVE payment method from settings (never a hidden
  // one — previously this hardcoded "cod", which broke once COD was disabled).
  useEffect(() => {
    const methods = settingData?.payment_methods || [];
    const firstActiveIndex = methods.findIndex((m) => m?.status);
    if (firstActiveIndex !== -1) {
      setFieldValue("payment_method", methods[firstActiveIndex].name);
      setInitial(firstActiveIndex);
    }
  }, [settingData?.payment_methods]);
  return (
    <CheckoutCard icon={<RiBankCardLine />}>
      <div className="checkout-title">
        <h4>{t("PaymentOption")}</h4>
      </div>
      <div className="checkout-detail">
        <Row className="g-sm-4 g-3">
          {settingData?.payment_methods?.length &&
            settingData?.payment_methods?.map((elem, i) => (
              <Fragment key={i}>
                {elem?.status && (
                  <Col xxl={6}>
                    <div className="payment-option">
                      <div className="payment-category w-100">
                        <div className="form-check custom-form-check hide-check-box w-100">
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
                          </Label>
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
