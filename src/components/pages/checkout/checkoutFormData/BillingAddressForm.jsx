import CityField from "@/components/widgets/inputFields/CityField";
import SimpleInputField from "@/components/widgets/inputFields/SimpleInputField";
import { AllCountryCode } from "@/data/CountryCode";
import SearchableSelectInput from "@/utils/commonComponents/inputFields/SearchableSelectInput";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { Col, Input, Label, Row } from "reactstrap";

const BillingAddressForm = ({ values, setFieldValue, errors, data }) => {
  const { t } = useTranslation("common");
  const same = Boolean(values.billing_address?.same_shipping);
  // Colapsada mientras "misma dirección de envío" esté activa (por defecto).
  const [open, setOpen] = useState(!same);

  // Sincronización EN VIVO: mientras same_shipping esté activo, cualquier
  // cambio en la dirección de envío se refleja de inmediato en facturación
  // (no solo al marcar la casilla).
  const ship = values.shipping_address || {};
  useEffect(() => {
    if (!same) return;
    setFieldValue("billing_address", {
      ...values.billing_address,
      same_shipping: true,
      title: ship.title,
      street: ship.street,
      country_id: ship.country_id,
      state_id: ship.state_id,
      city: ship.city,
      pincode: ship.pincode,
      country_code: ship.country_code,
      phone: ship.phone,
    });
  }, [same, ship.title, ship.street, ship.country_id, ship.state_id, ship.city, ship.pincode, ship.country_code, ship.phone]); // eslint-disable-line

  const toggleSame = (checked) => {
    setFieldValue("billing_address.same_shipping", checked);
    setOpen(!checked);
    if (!checked) {
      setFieldValue("billing_address", {
        same_shipping: false,
        title: "",
        street: "",
        country_id: "",
        state_id: "",
        city: "",
        pincode: "",
        country_code: "57",
        phone: "",
      });
    }
  };

  return (
    <div className="checkbox-main-box">
      <div
        className="checkout-title1 d-flex justify-content-between align-items-center"
        style={{ cursor: "pointer" }}
        onClick={() => setOpen((p) => !p)}
      >
        <h2 className="mb-0">{t(`BillingDetails`)}</h2>
        {open ? <RiArrowUpSLine size={22} /> : <RiArrowDownSLine size={22} />}
      </div>
      <div className="mt-2 mb-1 form-box form-checkbox">
        <Input
          className="checkbox_animated check-box"
          type="checkbox"
          id="billing-same-shipping"
          name="billing_address.same_shipping"
          onChange={(e) => toggleSame(e.target.checked)}
          checked={same}
        />
        <Label className="form-check-label" htmlFor="billing-same-shipping">
          {t("SameAsShippingAddress")}
        </Label>
      </div>
      {same && !open && (
        <p className="text-content mb-0" style={{ fontSize: "13px" }}>{t("BillingUsesShippingAddress")}</p>
      )}
      {open && !same && (
        <Row className="g-md-4 g-sm-3 g-2 checkout-form mt-0">
          <SimpleInputField
            nameList={[
              { name: "billing_address.title", placeholder: t("EnterTitle"), toplabel: "Title", colprops: { md: 12 }, require: "true" },
              { name: "billing_address.street", placeholder: t("EnterAddress"), toplabel: "Address", colprops: { xs: 12 }, require: "true" },
            ]}
          />
          <SearchableSelectInput
            nameList={[
              { name: "billing_address.country_id", require: "true", title: "Country", toplabel: "Country", colprops: { md: 6 }, inputprops: { name: "billing_address.country_id", id: "billing_address.country_id", options: data, defaultOption: t("SelectCountry") } },
              {
                name: "billing_address.state_id", require: "true", title: "State", toplabel: "State", colprops: { md: 6 },
                inputprops: {
                  name: "billing_address.state_id",
                  id: "billing_address.state_id",
                  options: values?.billing_address?.country_id ? data?.filter((country) => Number(country.id) === Number(values?.billing_address?.country_id))?.[0]?.["state"] : [],
                  defaultOption: t("SelectState"),
                },
                disabled: values?.billing_address?.country_id ? false : true,
              },
            ]}
          />
          <CityField
            values={values}
            setFieldValue={setFieldValue}
            data={data}
            name="billing_address.city"
            countryIdPath="billing_address.country_id"
            stateIdPath="billing_address.state_id"
            colprops={{ md: 6 }}
          />
          <SimpleInputField
            nameList={[{ name: "billing_address.pincode", placeholder: t("EnterPincodeOptional"), toplabel: "Pincode", colprops: { md: 6 } }]}
          />
          <Col xs={12} className="phone-field">
            <div className="form-box position-relative">
              <div className="country-input">
                <SimpleInputField nameList={[{ name: "billing_address.phone", type: "number", placeholder: t("EnterPhoneNumber"), require: "true", toplabel: "Phone", colprops: { xs: 12 }, colclass: "country-input-box" }]} />
                <SearchableSelectInput
                  nameList={[
                    {
                      name: "billing_address.country_code",
                      notitle: "true",
                      inputprops: {
                        name: "billing_address.country_code",
                        id: "billing_address.country_code",
                        options: AllCountryCode,
                      },
                    },
                  ]}
                />
              </div>
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default BillingAddressForm;
