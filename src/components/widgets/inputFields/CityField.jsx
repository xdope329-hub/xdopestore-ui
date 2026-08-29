"use client";
import SearchableSelectInput from "@/components/widgets/inputFields/SearchableSelectInput";
import SimpleInputField from "@/components/widgets/inputFields/SimpleInputField";
import request from "@/utils/axiosUtils";
import { ShippingAPI } from "@/utils/axiosUtils/API";
import useFetchQuery from "@/utils/hooks/useFetchQuery";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const OTHER = "__other__";

/**
 * Ciudad como lista desplegable (por departamento) para direcciones en
 * Colombia. La ciudad elegida define la zona de envío en el checkout.
 * "Otra ciudad" habilita texto libre (cobra tarifa Zona 2).
 *
 * `data` = catálogo de países (con sus departamentos) ya cargado por el
 * formulario padre; `values`/`setFieldValue` vienen de Formik.
 */
const CityField = ({ values, setFieldValue, data }) => {
  const { t } = useTranslation("common");
  const [showOther, setShowOther] = useState(false);

  const { data: cityData } = useFetchQuery(
    ["shipping-cities"],
    () => request({ url: `${ShippingAPI}/cities` }),
    { refetchOnWindowFocus: false, select: (res) => res?.data?.data || [] }
  );

  // Nombre del departamento seleccionado (los nombres de countries.js y del
  // dataset de ciudades coinciden exactamente).
  const stateName = useMemo(() => {
    const country = (data || []).find((c) => Number(c.id) === Number(values?.country_id));
    const state = (country?.state || []).find((s) => Number(s.id) === Number(values?.state_id));
    return state?.name || "";
  }, [data, values?.country_id, values?.state_id]);

  const cityOptions = useMemo(() => {
    const dep = (cityData || []).find((d) => d.department === stateName);
    const cities = (dep?.cities || []).map((c) => ({ id: c.name, name: c.name }));
    return [...cities, { id: OTHER, name: t("OtherCity") }];
  }, [cityData, stateName, t]);

  // Al editar una dirección cuya ciudad no está en la lista → modo texto libre.
  useEffect(() => {
    if (!cityData?.length || !values?.city || values.city === OTHER) return;
    const listed = cityOptions.some((c) => c.id === values.city);
    setShowOther(!listed);
  }, [cityData, stateName]); // eslint-disable-line

  // Elegir "Otra ciudad" limpia el campo y muestra el input de texto.
  useEffect(() => {
    if (values?.city === OTHER) {
      setFieldValue("city", "");
      setShowOther(true);
    }
  }, [values?.city]); // eslint-disable-line

  // Cambiar de departamento invalida una ciudad de la lista que no pertenezca al nuevo.
  useEffect(() => {
    if (!values?.city || showOther || !cityData?.length) return;
    const listed = cityOptions.some((c) => c.id === values.city && c.id !== OTHER);
    if (!listed) setFieldValue("city", "");
  }, [stateName]); // eslint-disable-line

  if (showOther) {
    return (
      <>
        <SimpleInputField nameList={[{ name: "city", placeholder: t("EnterCity"), toplabel: "City", colprops: { xxl: 6, lg: 12, sm: 6 }, require: "true" }]} />
        <div className="col-12 mt-1">
          <a
            href="#select-city"
            className="theme-color"
            style={{ fontSize: "13px" }}
            onClick={(e) => {
              e.preventDefault();
              setFieldValue("city", "");
              setShowOther(false);
            }}
          >
            {t("ChooseCityFromList")}
          </a>
        </div>
      </>
    );
  }

  return (
    <SearchableSelectInput
      nameList={[
        {
          name: "city",
          require: "true",
          title: "City",
          toplabel: "City",
          colprops: { xxl: 6, lg: 12, sm: 6 },
          disabled: values?.state_id ? false : true,
          inputprops: {
            name: "city",
            id: "city",
            options: cityOptions,
            defaultOption: t("SelectCity"),
          },
        },
      ]}
    />
  );
};

export default CityField;
