import request from "@/utils/axiosUtils";
import { CountryAPI } from "@/utils/axiosUtils/API";
import { YupObject, addressFieldsSchema } from "@/utils/validation/ValidationSchema";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import { Formik } from "formik";
import { useTranslation } from "react-i18next";
import SelectForm from "./SelectForm";

const AddAddressForm = ({ mutate, isLoading, type, editAddress, setModal, isFooterDisplay, method }) => {

  const { data } = useFetchQuery([CountryAPI], () => request({ url: CountryAPI }), {
    refetchOnWindowFocus: false,
    // API responds with { data: [...] }; request() wraps as { data: responseBody, ... }
    select: (res) => (res?.data?.data ?? []).map((country) => ({ id: country.id, name: country.name, state: country.state || [] })),
  });

  const { t } = useTranslation("common");
  return (
    <Formik
      initialValues={{
        title: editAddress ? editAddress?.title : "",
        street: editAddress ? editAddress?.street : "",
        country_id: editAddress ? editAddress?.country_id : "",
        state_id: editAddress ? editAddress?.state_id : "",
        city: editAddress ? editAddress?.city : "",
        pincode: editAddress ? editAddress?.pincode : "",
        phone: editAddress ? editAddress?.phone : "",
        type: type ? type : null,
        country_code: editAddress ? editAddress?.country_code : "57",
        is_default: editAddress ? Boolean(editAddress?.is_default) : false,
      }}
      validationSchema={YupObject({ ...addressFieldsSchema })}
      onSubmit={(values) => {
        if (editAddress) {
          values["_method"] = method ? method : "PUT";
        }

        values["pincode"] = values["pincode"] ? values["pincode"].toString() : "";
        mutate(values);
        setModal(false);
      }}
    >
      {({ values, setFieldValue }) => <SelectForm values={values} setFieldValue={setFieldValue} setModal={setModal} isLoading={isLoading} data={data} isFooterDisplay={isFooterDisplay} />}
    </Formik>
  );
};

export default AddAddressForm;
