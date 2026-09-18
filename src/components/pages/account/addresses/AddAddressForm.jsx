import { buildAddressPayload, toAddressFormValues } from "@/components/widgets/addressForm/addressRules";
import request from "@/utils/axiosUtils";
import { CountryAPI } from "@/utils/axiosUtils/API";
import { YupObject, addressFieldsSchema } from "@/utils/validation/ValidationSchema";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import { Formik } from "formik";
import SelectForm from "./SelectForm";

// Formulario del libro de direcciones (cuenta): alta y edición. Comparte
// valores, payload y campos con el del checkout (widgets/addressForm).
const AddAddressForm = ({ mutate, isLoading, type, editAddress, setModal, isFooterDisplay, submitTitle }) => {
  const editing = !!(editAddress?.id || editAddress?._id);
  const { data } = useFetchQuery([CountryAPI], () => request({ url: CountryAPI }), {
    refetchOnWindowFocus: false,
    // API responds with { data: [...] }; request() wraps as { data: responseBody, ... }
    select: (res) => (res?.data?.data ?? []).map((country) => ({ id: country.id, name: country.name, state: country.state || [] })),
  });

  return (
    <Formik
      enableReinitialize
      initialValues={toAddressFormValues(editAddress, { type: type ? type : null })}
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
