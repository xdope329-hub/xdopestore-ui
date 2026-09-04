import { buildAddressPayload, toAddressFormValues } from "@/components/widgets/addressForm/addressRules";
import request from "@/utils/axiosUtils";
import { CountryAPI } from "@/utils/axiosUtils/API";
import { YupObject, addressFieldsSchema } from "@/utils/validation/ValidationSchema";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import { Formik } from "formik";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import SelectForm from "./SelectForm";

// Formulario de dirección del checkout: alta y edición de una dirección
// guardada. `editAddress` con id → modo edición (valores precargados, PUT).
const AddAddressForm = ({ mutate, isLoading, type, editAddress, setEditAddress, modal, setModal, isFooterDisplay, submitTitle }) => {
  const router = useRouter();
  const editing = !!(editAddress?.id || editAddress?._id);
  useEffect(() => {
    modal !== "edit" && setEditAddress && setEditAddress({});
  }, [modal]);
  const { data } = useFetchQuery([CountryAPI], () => request({ url: CountryAPI }, router), {
    refetchOnWindowFocus: false,
    // API responds with { data: [...] }; request() wraps as { data: responseBody, ... }
    select: (res) => (res?.data?.data ?? []).map((country) => ({ id: country.id, name: country.name, state: country.state || [] })),
  });

  const { t } = useTranslation("common");
  return (
    <Formik
      enableReinitialize
      // Nuevas direcciones nacen como predeterminada; al editar se conserva lo guardado.
      initialValues={toAddressFormValues(editAddress, { type: type ? type : null, defaultIsDefault: true })}
      validationSchema={YupObject({ ...addressFieldsSchema })}
      onSubmit={(values) => {
        mutate(buildAddressPayload(values, { editing }));
      }}
    >
      {({ values, setFieldValue }) => <SelectForm values={values} setFieldValue={setFieldValue} setModal={setModal} isLoading={isLoading} data={data} isFooterDisplay={isFooterDisplay} submitTitle={submitTitle} />}
    </Formik>
  );
};

export default AddAddressForm;
