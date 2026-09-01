import AddressFields from "@/components/widgets/addressForm/AddressFields";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { Row } from "reactstrap";

// Dirección de envío del checkout de invitados. Los campos viven en el
// componente compartido AddressFields (prefix="shipping_address"); aquí
// solo queda la cabecera colapsable de la sección.
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
          <AddressFields values={values} setFieldValue={setFieldValue} data={data} prefix="shipping_address" halfCol={{ md: 6 }} />
        </Row>
      )}
    </div>
  );
};

export default ShippingAddressForm;
