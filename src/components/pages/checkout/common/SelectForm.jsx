import { Form } from "formik";
import { useEffect } from "react";
import { Col, Input, Label, ModalFooter, Row } from "reactstrap";
import Btn from "@/elements/buttons/Btn";
import { useTranslation } from "react-i18next";
import SearchableSelectInput from "@/utils/commonComponents/inputFields/SearchableSelectInput";
import SimpleInputField from "@/components/widgets/inputFields/SimpleInputField";
import { AllCountryCode } from "@/data/CountryCode";

const SelectForm = ({ values, setFieldValue, isLoading, data, setModal, isFooterDisplay = true }) => {
  const { t } = useTranslation("common");
  // Default the country to Colombia for new addresses once the catalog loads.
  useEffect(() => {
    if (!values?.country_id && data?.length && setFieldValue) {
      const colombia = data.find((c) => c?.name === "Colombia") || data[0];
      colombia && setFieldValue("country_id", colombia.id);
    }
  }, [data]);
  return (
    <Form>
      <Row className="g-3">
        <SimpleInputField
          nameList={[
            { name: "street", placeholder: t("EnterAddress"), toplabel: "Address", colprops: { xs: 12 }, require: "true" },
            { name: "title", placeholder: t("AddressLabelPlaceholder"), toplabel: "AddressLabel", colprops: { xs: 12 }, require: "true" },
          ]}
        />
        <Col xs='12'>
          <div className="country-input position-relative phone-field">
            <SimpleInputField nameList={[{ name: "phone", type: "number", placeholder: t("EnterPhoneNumber"), require: "true", toplabel: "Phone", colclass: "country-input-box" }]} />
            <SearchableSelectInput
              nameList={[
                {
                  toplabel: "Country",
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
        </Col>

        <SearchableSelectInput
          nameList={[
            {
              name: "country_id",
              require: "true",
              title: "Country",
              label: "Country",
              colprops: { sm: 6 },
              inputprops: {
                name: "country_id",
                id: "country_id",
                options: data,
                defaultOption: t("SelectCountry"),
              },
            },
            {
              name: "state_id",
              require: "true",
              title: "State",
              label: "State",
              colprops: { sm: 6 },
              inputprops: {
                name: "state_id",
                id: "state_id",
                options: values?.["country_id"] ? data?.filter((country) => Number(country.id) === Number(values?.["country_id"]))?.[0]?.["state"] : [],
                defaultOption: t("SelectState"),
              },
              disabled: values?.["country_id"] ? false : true,
            },
          ]}
        />
        <SimpleInputField
          nameList={[
            { name: "city", placeholder: t("EnterCity"), toplabel: "City", colprops: { xxl: 6, lg: 12, sm: 6 }, require: "true" },
            { name: "pincode", placeholder: t("EnterPincode"), toplabel: "Pincode", colprops: { xxl: 6, lg: 12, sm: 6 }, require: "true" },
          ]}
        />

        <Col xs={12}>
          <div className="form-box form-checkbox">
            <Input
              id="address-is-default"
              className="checkbox_animated check-box"
              type="checkbox"
              name="is_default"
              checked={Boolean(values?.is_default)}
              onChange={(e) => setFieldValue && setFieldValue("is_default", e.target.checked)}
            />
            <Label className="form-check-label ms-2" htmlFor="address-is-default">
              {t("SaveAsDefault") || "Save as default address"}
            </Label>
          </div>
        </Col>

        {isFooterDisplay && (
          <ModalFooter className="ms-auto justify-content-end save-back-button">
            <Btn size="md" className="btn-outline fw-bold" title="Cancel" onClick={() => setModal(false)} />
            <Btn className="btn-solid" type="submit" title="Submit" loading={Number(isLoading)} />
          </ModalFooter>
        )}
      </Row>
    </Form>
  );
};

export default SelectForm;
