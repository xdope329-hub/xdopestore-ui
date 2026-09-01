import CityField from "@/components/widgets/inputFields/CityField";
import SimpleInputField from "@/components/widgets/inputFields/SimpleInputField";
import { AllCountryCode } from "@/data/CountryCode";
import SearchableSelectInput from "@/utils/commonComponents/inputFields/SearchableSelectInput";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { Col, Row } from "reactstrap";

const ShippingAddressForm = ({ values, setFieldValue, data }) => {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(true);
  return (
    <div className="checkbox-main-box">
      <div
        className="checkout-title1 d-flex justify-content-between align-items-center"
        style={{ cursor: "pointer" }}
        onClick={() => setOpen((p) => !p)}
      >
        <h2 className="mb-0">{t("ShippingDetails")}</h2>
        {open ? <RiArrowUpSLine size={22} /> : <RiArrowDownSLine size={22} />}
      </div>
      {open && (
        <Row className="checkout-form g-md-4 g-sm-3 g-2 mt-0">
          <SimpleInputField
            nameList={[
              { name: "shipping_address.title", placeholder: t("EnterTitle"), toplabel: "Title", colprops: { xs: 12 }, require: "true" },
              { name: "shipping_address.street", placeholder: t("EnterAddress"), toplabel: "Address", colprops: { xs: 12 }, require: "true" },
            ]}
          />
          <SearchableSelectInput
            nameList={[
              {
                name: "shipping_address.country_id",
                require: "true",
                title: "Country",
                toplabel: "Country",
                colprops: { xxl: 6, lg: 12, sm: 6 },
                inputprops: {
                  name: "shipping_address.country_id",
                  id: "shipping_address.country_id",
                  options: data,
                  defaultOption: t("SelectCountry"),
                },
              },
              {
                name: "shipping_address.state_id",
                require: "true",
                title: "State",
                toplabel: "State",
                colprops: { xxl: 6, lg: 12, sm: 6 },
                inputprops: {
                  name: "shipping_address.state_id",
                  id: "shipping_address.state_id",
                  options: values?.shipping_address?.country_id ? data?.filter((country) => Number(country.id) === Number(values?.shipping_address?.country_id))?.[0]?.["state"] : [],
                  defaultOption: t("SelectState"),
                },
                disabled: values?.shipping_address?.country_id ? false : true,
              },
            ]}
          />
          <CityField
            values={values}
            setFieldValue={setFieldValue}
            data={data}
            name="shipping_address.city"
            countryIdPath="shipping_address.country_id"
            stateIdPath="shipping_address.state_id"
            colprops={{ md: 6 }}
          />
          <SimpleInputField
            nameList={[{ name: "shipping_address.pincode", placeholder: t("EnterPincodeOptional"), toplabel: "Pincode", colprops: { md: 6 } }]}
          />
          <Col xs={12} className="phone-field">
            <div className="form-box position-relative">
              <div className="country-input">
                <SimpleInputField nameList={[{ name: "shipping_address.phone", type: "number", placeholder: t("EnterPhoneNumber"), require: "true", toplabel: "Phone", colprops: { xs: 12 }, colclass: "country-input-box" }]} />
                <SearchableSelectInput
                  nameList={[
                    {
                      name: "shipping_address.country_code",
                      notitle: "true",
                      inputprops: {
                        name: "shipping_address.country_code",
                        id: "shipping_address.country_code",
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

export default ShippingAddressForm;
