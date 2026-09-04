import AddressFields from "@/components/widgets/addressForm/AddressFields";
import Btn from "@/elements/buttons/Btn";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import { Form, useFormikContext } from "formik";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Col, Input, Label, ModalFooter, Row } from "reactstrap";

// Modal de dirección del checkout (usuario logueado). Los campos viven en
// el componente compartido AddressFields; aquí solo queda lo propio del
// modal: aviso de campos obligatorios, checkbox "predeterminada" y footer.
const SelectForm = ({ values, setFieldValue, isLoading, data, setModal, isFooterDisplay = true, submitTitle = "Submit", showDefault = true }) => {
  const { t } = useTranslation("common");
  // Intento de guardar con campos obligatorios vacíos → aviso claro.
  const { errors, submitCount } = useFormikContext();
  useEffect(() => {
    if (submitCount > 0 && Object.keys(errors || {}).length) {
      ToastNotification("error", t("CompleteRequiredFields"));
    }
  }, [submitCount]); // eslint-disable-line
  return (
    <Form>
      <Row className="g-3">
        <AddressFields values={values} setFieldValue={setFieldValue} data={data} />

        {showDefault && (
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
        )}

        {isFooterDisplay && (
          <ModalFooter className="ms-auto justify-content-end save-back-button">
            <Btn size="md" className="btn-outline fw-bold" title="Cancel" onClick={() => setModal(false)} />
            <Btn className="btn-solid" type="submit" title={submitTitle} loading={Number(isLoading)} disabled={!!isLoading} />
          </ModalFooter>
        )}
      </Row>
    </Form>
  );
};

export default SelectForm;
