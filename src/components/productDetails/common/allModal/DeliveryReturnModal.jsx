import CustomModal from "@/components/widgets/CustomModal";
import ThemeOptionContext from "@/context/themeOptionsContext";
import { useContext } from "react";
import { trustedHtml } from "@/utils/security/sanitizeHtml";

const DeliveryReturnModal = ({ modal, setModal }) => {
  const { themeOption } = useContext(ThemeOptionContext);
  return (
    <CustomModal modal={modal ? true : false} setModal={setModal} classes={{ modalClass: "theme-modal-2 modal-lg", title: "Delivery&Return", modalBodyClass: "policy-body" }}>
      <div dangerouslySetInnerHTML={trustedHtml(themeOption?.product?.shipping_and_return)} />
    </CustomModal>
  );
};

export default DeliveryReturnModal;
