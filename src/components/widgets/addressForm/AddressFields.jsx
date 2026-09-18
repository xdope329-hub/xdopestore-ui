"use client";
import CityField from "@/components/widgets/inputFields/CityField";
import SearchableSelectInput from "@/components/widgets/inputFields/SearchableSelectInput";
import SimpleInputField from "@/components/widgets/inputFields/SimpleInputField";
import { AllCountryCode } from "@/data/CountryCode";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Col } from "reactstrap";

// Lector de rutas anidadas ("shipping_address.country_id") sobre values.
const getPath = (path, obj) => String(path).split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);

/**
 * Campos de dirección COMPARTIDOS por todos los formularios de dirección:
 *  - modal del checkout (usuario logueado)      → prefix=""
 *  - checkout de invitados, envío               → prefix="shipping_address"
 *  - checkout de invitados, facturación         → prefix="billing_address"
 *  - cuenta → direcciones guardadas             → prefix=""
 *
 * Cualquier cambio de campos, placeholders, orden o validación visual se
 * hace UNA sola vez aquí y aplica en todos lados. El wrapper de cada
 * contexto conserva lo que le es propio (checkbox "predeterminada",
 * "misma dirección de envío", footer del modal, etc.).
 */
const AddressFields = ({ values, setFieldValue, data, prefix = "", halfCol = { sm: 6 } }) => {
  const { t } = useTranslation("common");
  const p = prefix ? `${prefix}.` : "";
  const countryId = getPath(`${p}country_id`, values);

  // Para direcciones nuevas, el país por defecto es Colombia al cargar el catálogo.
  useEffect(() => {
    if (!countryId && data?.length && setFieldValue) {
      const colombia = data.find((c) => c?.name === "Colombia") || data[0];
      colombia && setFieldValue(`${p}country_id`, colombia.id);
    }
  }, [data]); // eslint-disable-line

  return (
    <>
      <SimpleInputField
        nameList={[
          { name: `${p}street`, placeholder: t("EnterAddress"), toplabel: "Address", colprops: { xs: 12 }, require: "true" },
          { name: `${p}title`, placeholder: t("AddressLabelPlaceholder"), toplabel: "AddressLabel", colprops: { xs: 12 }, require: "true" },
        ]}
      />
      <Col xs="12">
        <div className="country-input position-relative phone-field">
          {/* type="tel": conserva ceros a la izquierda, rechaza "e"/"+"/"-" y
              entrega texto al esquema (solo dígitos, 7 a 15). */}
          <SimpleInputField nameList={[{ name: `${p}phone`, type: "tel", inputMode: "numeric", placeholder: t("EnterPhoneNumber"), require: "true", toplabel: "Phone", colclass: "country-input-box" }]} />
          <SearchableSelectInput
            nameList={[
              {
                name: `${p}country_code`,
                notitle: "true",
                inputprops: { name: `${p}country_code`, id: `${p}country_code`, options: AllCountryCode },
              },
            ]}
          />
        </div>
      </Col>
      <SearchableSelectInput
        nameList={[
          {
            name: `${p}country_id`,
            require: "true",
            title: "Country",
            toplabel: "Country",
            colprops: halfCol,
            inputprops: { name: `${p}country_id`, id: `${p}country_id`, options: data, defaultOption: t("SelectCountry") },
          },
          {
            name: `${p}state_id`,
            require: "true",
            title: "State",
            toplabel: "State",
            colprops: halfCol,
            inputprops: {
              name: `${p}state_id`,
              id: `${p}state_id`,
              options: countryId ? data?.filter((country) => Number(country.id) === Number(countryId))?.[0]?.["state"] : [],
              defaultOption: t("SelectState"),
            },
            disabled: countryId ? false : true,
          },
        ]}
      />
      <CityField values={values} setFieldValue={setFieldValue} data={data} name={`${p}city`} countryIdPath={`${p}country_id`} stateIdPath={`${p}state_id`} colprops={halfCol} />
      <SimpleInputField nameList={[{ name: `${p}pincode`, placeholder: t("EnterPincodeOptional"), toplabel: "Pincode", colprops: halfCol }]} />
    </>
  );
};

export default AddressFields;
