import SearchableSelectInput from "@/components/widgets/inputFields/SearchableSelectInput";
import SimpleInputField from "@/components/widgets/inputFields/SimpleInputField";
import { AllCountryCode } from "@/data/CountryCode";
import React from "react";
import { useTranslation } from "react-i18next";
import { RiUserLine } from "react-icons/ri";
import { Col, Input, Label, Row } from "reactstrap";
import CheckoutCard from "../common/CheckoutCard";

// Datos de contacto del invitado: misma tarjeta (CheckoutCard) que las
// direcciones, la entrega y el pago del cliente con sesión.
const AccountSection = ({ values, setFieldValue }) => {
  const { t } = useTranslation("common");
  return (
    <CheckoutCard icon={<RiUserLine />}>
      <div className="checkout-title">
        <h4>{t("AccountDetails")}</h4>
      </div>
      <div className="checkout-detail">
      <Row className="checkout-form g-md-4 g-sm-3 g-2">
        <Col sm={6}>
          <div className="form-box">
            <SimpleInputField nameList={[{ name: "name", placeholder: t("EnterName"), toplabel: "FullName", require: "true" }]} />
          </div>
        </Col>
        <Col sm={6}>
          <div className="form-box">
            <SimpleInputField nameList={[{ name: "email", placeholder: t("EnterEmail"), toplabel: "Email", require: "true" }]} />
          </div>
        </Col>
        <Col xs={12} className="phone-field">
          <div className="form-box position-relative">
            <div className="country-input">
              {/* type="tel" (no "number"): conserva ceros a la izquierda, no
                  acepta "e"/"+"/"-", no cambia con la rueda del ratón y el
                  valor llega como texto al esquema (solo dígitos, 7 a 15). */}
              <SimpleInputField nameList={[{ name: "phone", type: "tel", inputMode: "numeric", placeholder: t("EnterPhoneNumber"), require: "true", toplabel: "Phone", colprops: { xs: 12 }, colclass: "country-input-box" }]} />
              <SearchableSelectInput
                nameList={[
                  {
                    name: "country_code",
                    notitle: "true",
                    inputprops: {
                      name: "country_code",
                      id: "country_code",
                      options: AllCountryCode,
                    },
                  },
                ]}
              />
            </div>
          </div>
        </Col>
        <Col xs={12}>
          <div className="form-box form-checkbox">
            <Input
              id="create_account"
              className="checkbox_animated check-box"
              type="checkbox"
              name="create_account"
              onChange={(e) => {
                setFieldValue("create_account", e.target.checked);
              }}
              checked={values.create_account}
            />
            <Label className="form-check-label" htmlFor="create_account">
              {t("CreateAnAccount")}
            </Label>
          </div>
        </Col>
        {values.create_account == true && (
          <Col md={6}>
            <div className="form-box">
              <SimpleInputField nameList={[{ name: "password", placeholder: t("EnterPassword"), type: "password", title: "Password", toplabel: "Password", require: "true" }]} />
            </div>
          </Col>
        )}
      </Row>
      </div>
    </CheckoutCard>
  );
};

export default AccountSection;
