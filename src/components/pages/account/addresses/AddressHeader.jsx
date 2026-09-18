import CustomModal from "@/components/widgets/CustomModal";
import NoDataFound from "@/components/widgets/NoDataFound";
import { addressModalLabels, applyAddressUpdate } from "@/components/widgets/addressForm/addressRules";
import AccountContext from "@/context/accountContext";
import Btn from "@/elements/buttons/Btn";
import { AddressAPI } from "@/utils/axiosUtils/API";
import useCreate from "@/utils/hooks/useCreate";
import useUpdate from "@/utils/hooks/useUpdate";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody } from "reactstrap";
import AddAddressForm from "./AddAddressForm";
import AddressData from "./AddressData";

const AddressHeader = () => {
  const { t } = useTranslation("common");
  const [addressState, setAddressState] = useState([]);
  const [editAddress, setEditAddress] = useState();
  const [modal, setModal] = useState("");
  const { accountData, refetch } = useContext(AccountContext);
  useEffect(() => {
    // También cuando queda vacía (se borró la última dirección).
    Array.isArray(accountData?.address) && setAddressState([...accountData.address]);
  }, [accountData]);

  const closeModal = () => {
    setModal("");
    setEditAddress(undefined);
  };

  const { mutate, isLoading } = useCreate(AddressAPI, false, false, "AddressAddedSuccessfully", (resDta) => {
    if (resDta?.status === 201 || resDta?.status === 200) {
      setAddressState((prev) => applyAddressUpdate(prev, resDta?.data));
      refetch();
      closeModal();
    }
  });
  const editingId = editAddress?.id || editAddress?._id;
  // Edición: PUT /address/:id. La lista local se actualiza al instante y, si
  // la dirección quedó como predeterminada, las demás pierden la marca.
  const { mutate: editMutate, isPending: editLoader } = useUpdate(AddressAPI, editingId, false, "AddressUpdatedSuccessfully", (resDta) => {
    if (resDta?.status === 200) {
      setAddressState((prev) => applyAddressUpdate(prev, resDta?.data));
      refetch();
      closeModal();
    }
  });
  const labels = addressModalLabels(modal === "edit");
  return (
    <Card>
      <CardBody>
        <div className="top-sec">
          <h3>{t("AddressBook")}</h3>
          <Btn tag="a" size="sm" color="transparent" className=" btn-solid" onClick={() => { setEditAddress(undefined); setModal("add"); }}>
            + {t("AddNew")}
          </Btn>
        </div>
        {addressState?.length > 0 ? (
          <>
            <div className="address-book-section">
              <AddressData addressState={addressState} setAddressState={setAddressState} modal={modal} setModal={setModal} setEditAddress={setEditAddress} />
            </div>
          </>
        ) : (
          <NoDataFound customClass="no-data-added" imageUrl={`/assets/svg/empty-items.svg`} title="NoAddressFound" description="NoAddressDescription" height="300" width="300" />
        )}
        <div className="checkout-detail">
          <CustomModal modal={modal == "add" || modal == "edit" ? true : false} setModal={closeModal} classes={{ modalClass: "theme-modal-2 view-modal address-modal", title: labels.title }}>
            <div className="right-sidebar-box">
              <AddAddressForm mutate={modal == "add" ? mutate : editMutate} isLoading={modal == "add" ? isLoading : editLoader} setModal={closeModal} editAddress={modal == "edit" ? editAddress : undefined} submitTitle={labels.submit} />
            </div>
          </CustomModal>
        </div>
      </CardBody>
    </Card>
  );
};

export default AddressHeader;
