"use client";
import SearchableSelectInput from "@/components/widgets/inputFields/SearchableSelectInput";
import SimpleInputField from "@/components/widgets/inputFields/SimpleInputField";
import request from "@/utils/axiosUtils";
import { ShippingAPI } from "@/utils/axiosUtils/API";
import useFetchQuery from "@/utils/hooks/useFetchQuery";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";

const OTHER = "__other__";

/**
 * Ciudad como lista desplegable (por departamento) para direcciones en
 * Colombia. La ciudad elegida define la zona de envío en el checkout.
 * "Otra ciudad" habilita texto libre (cobra tarifa Zona 2).
 *
 * `data` = catálogo de países (con sus departamentos) ya cargado por el
 * formulario padre; `values`/`setFieldValue` vienen de Formik.
 */
// getPath("a.b", values) — lector de rutas anidadas para nombres tipo
// "shipping_address.city" usados por el checkout de invitados.
const getPath = (path, obj) => String(path).split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);

const CityField = ({ values, setFieldValue, data, name = "city", countryIdPath = "country_id", stateIdPath = "state_id", colprops }) => {
  const { t } = useTranslation("common");
  const [showOther, setShowOther] = useState(false);
  const cityValue = getPath(name, values);
  const countryIdValue = getPath(countryIdPath, values);
  const stateIdValue = getPath(stateIdPath, values);

  const { data: cityData } = useFetchQuery(
    ["shipping-cities"],
    () => request({ url: `${ShippingAPI}/cities` }),
    { refetchOnWindowFocus: false, select: (res) => res?.data?.data || [] }
  );

  // Nombre del departamento seleccionado (los nombres de countries.js y del
  // dataset de ciudades coinciden exactamente).
  const stateName = useMemo(() => {
    const country = (data || []).find((c) => Number(c.id) === Number(countryIdValue));
    const state = (country?.state || []).find((s) => Number(s.id) === Number(stateIdValue));
    return state?.name || "";
  }, [data, countryIdValue, stateIdValue]);

  const cityOptions = useMemo(() => {
    const dep = (cityData || []).find((d) => d.department === stateName);
    const cities = (dep?.cities || []).map((c) => ({ id: c.name, name: c.name }));
    return [...cities, { id: OTHER, name: t("OtherCity") }];
  }, [cityData, stateName, t]);

  // Al editar una dirección cuya ciudad no está en la lista → modo texto libre.
  useEffect(() => {
    if (!cityData?.length || !cityValue || cityValue === OTHER) return;
    const listed = cityOptions.some((c) => c.id === cityValue);
    setShowOther(!listed);
  }, [cityData, stateName]); // eslint-disable-line

  // Elegir "Otra ciudad" limpia el campo y muestra el input de texto.
  useEffect(() => {
    if (cityValue === OTHER) {
      setFieldValue(name, "");
      setShowOther(true);
    }
  }, [cityValue]); // eslint-disable-line

  // Cambiar de departamento invalida una ciudad de la lista que no pertenezca al nuevo.
  useEffect(() => {
    if (!cityValue || showOther || !cityData?.length) return;
    const listed = cityOptions.some((c) => c.id === cityValue && c.id !== OTHER);
    if (!listed) setFieldValue(name, "");
  }, [stateName]); // eslint-disable-line

  if (showOther) {
    return (
      <>
        <SimpleInputField nameList={[{ name, placeholder: t("EnterCity"), toplabel: "City", colprops: colprops || { xxl: 6, lg: 12, sm: 6 }, require: "true" }]} />
        <div className="col-12 mt-1">
          <a
            href="#select-city"
            className="theme-color"
            style={{ fontSize: "13px" }}
            onClick={(e) => {
              e.preventDefault();
              setFieldValue(name, "");
              setShowOther(false);
            }}
          >
            {t("ChooseCityFromList")}
          </a>
        </div>
      </>
    );
  }

  const departmentMissing = !stateIdValue;
  return (
    <div
      onClickCapture={(e) => {
        if (departmentMissing) {
          e.stopPropagation();
          ToastNotification("error", t("SelectDepartmentFirst"));
        }
      }}
    >
    <SearchableSelectInput
      nameList={[
        {
          name,
          require: "true",
          title: "City",
          toplabel: "City",
          colprops: colprops || { xxl: 6, lg: 12, sm: 6 },
          disabled: stateIdValue ? false : true,
          inputprops: {
            name,
            id: name,
            options: cityOptions,
            defaultOption: t("SelectCity"),
          },
        },
      ]}
    />
    </div>
  );
};

export default CityField;
