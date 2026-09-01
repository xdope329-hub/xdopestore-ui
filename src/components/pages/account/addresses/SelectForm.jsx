import AddressFields from "@/components/widgets/addressForm/AddressFields";
import Btn from "@/elements/buttons/Btn";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import { Form, useFormikContext } from "formik";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Col, ModalFooter, Row } from "reactstrap";

// Formulario de dirección de cuenta → direcciones guardadas. Los campos
// viven en el componente compartido AddressFields; aquí solo queda el
// footer del modal.
const SelectForm = ({ values, isLoading, data, setModal, isFooterDisplay = true }) => {
  const { setFieldValue, errors, submitCount } = useFormikContext();
  const { t } = useTranslation("common");
  // Intento de guardar con campos obligatorios vacíos → aviso claro.
  useEffect(() => {
    if (submitCount > 0 && Object.keys(errors || {}).length) {
      ToastNotification("error", t("CompleteRequiredFields"));
    }
  }, [submitCount]); // eslint-disable-line
  return (
    <Form>
      <Row className="g-3">
        <AddressFields values={values} setFieldValue={setFieldValue} data={data} halfCol={{ xxl: 6, lg: 12, sm: 6 }} />
        <Col xs="12">
          {isFooterDisplay && (
            <ModalFooter className="ms-auto justify-content-end save-back-button mt-0">
              <Btn className="btn-md btn-outline fw-bold" color="transparent" onClick={() => setModal(false)}>
                {t("Cancel")}
              </Btn>
              <Btn className="btn-solid" type="submit" loading={Number(isLoading)}>
                {t("Submit")}
              </Btn>
            </ModalFooter>
          )}
        </Col>
      </Row>
    </Form>
  );
};

export default SelectForm;
