import CustomModal from '@/components/widgets/CustomModal';
import { addressModalLabels } from '@/components/widgets/addressForm/addressRules';
import request from '@/utils/axiosUtils';
import { AddressAPI } from '@/utils/axiosUtils/API';
import useCreate from '@/utils/hooks/useCreate';
import useUpdate from '@/utils/hooks/useUpdate';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from "react-i18next";
import { RiAddLine, RiMapPinLine } from 'react-icons/ri';
import { Row } from 'reactstrap';
import AddAddressForm from './common/AddAddressForm';
import CheckoutCard from './common/CheckoutCard';
import ShowAddress from './ShowAddress';

const addressId = (a) => a?.id || a?._id;

/**
 * Tarjetas de dirección del checkout (envío / facturación) + modal para
 * agregar o editar. Con sesión las direcciones viven en la cuenta (API);
 * como invitado viven en el estado del checkout (`mutate` / `guestUpdate`
 * los provee CheckoutForm) y el modal se cierra en cuanto se guarda.
 */
const DeliveryAddress = ({ type, title, address, modal, setModal, setFieldValue, values, refetchAddresses, onAddressChange, guest = false, mutate: guestCreate, guestUpdate }) => {
  const { t } = useTranslation('common');
  const other = type === 'shipping' ? 'billing' : 'shipping';
  const selectedId = values?.[`${type}_address_id`];
  const otherSelectedId = values?.[`${other}_address_id`];

  // Pre-select the user's default address (the API sorts is_default first, so it's
  // typically address[0], but we explicitly look for is_default to be safe).
  useEffect(() => {
    if (!address?.length) return;
    if (selectedId) return; // user already picked something — respect it
    const preferred = address.find((a) => a?.is_default) || address[0];
    if (addressId(preferred)) {
      setFieldValue(`${type}_address_id`, addressId(preferred));
    }
  }, [address, type]);

  // Elegir OTRA dirección de facturación la convierte en la predeterminada
  // de la cuenta (el API quita la marca a la anterior; al refrescar la lista
  // la insignia se mueve). Solo reacciona a un cambio de SELECCIÓN: antes
  // también corría al refrescar la lista, y al guardar una dirección nueva
  // como predeterminada volvía a marcar la anterior (la marca iba y venía).
  const addressRef = useRef(address);
  addressRef.current = address;
  useEffect(() => {
    if (guest) return; // invitado: no hay direcciones de cuenta que promover
    if (type !== 'billing') return;
    if (!selectedId) return;
    const picked = (addressRef.current || []).find((a) => addressId(a) === selectedId);
    if (!picked || picked.is_default) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await request({ url: `${AddressAPI}/${selectedId}/default`, method: 'patch' });
        if (!cancelled && res?.ok) {
          refetchAddresses && refetchAddresses();
        }
      } catch (err) {
        // Non-fatal: the user can still complete checkout with the address
        // they picked; we just couldn't persist it as their account default.
        if (typeof console !== 'undefined') {
          console.warn('[DeliveryAddress] could not promote billing address to default:', err);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Modal: agregar / editar ──────────────────────────────────────────
  const [editAddress, setEditAddress] = useState(null);
  const editingId = addressId(editAddress);
  const closeModal = () => {
    setEditAddress(null);
    setModal('');
  };
  const openAdd = () => {
    setEditAddress(null);
    setModal(type);
  };
  const openEdit = (item) => {
    setEditAddress(item);
    setModal(type);
  };

  // Dirección recién creada: queda seleccionada en esta sección y, si la
  // otra sección aún no tiene, también allí (facturar a la misma dirección
  // es el caso común).
  const selectNew = (id) => {
    if (!id) return;
    setFieldValue(`${type}_address_id`, id);
    if (!otherSelectedId) setFieldValue(`${other}_address_id`, id);
  };
  const afterSave = () => {
    refetchAddresses && refetchAddresses();
    onAddressChange && onAddressChange();
    closeModal();
  };
  // El modal solo se cierra cuando el API confirmó; si falla, el cliente
  // ve el error y conserva lo escrito.
  const { mutate: createAddress, isPending: createLoading } = useCreate(AddressAPI, false, false, 'AddressAddedSuccessfully', (res) => {
    if (res?.status === 201 || res?.status === 200) {
      selectNew(addressId(res?.data));
      afterSave();
    }
  });
  const { mutate: updateAddress, isPending: updateLoading } = useUpdate(AddressAPI, editingId, false, 'AddressUpdatedSuccessfully', (res) => {
    if (res?.status === 200) afterSave();
  });

  const submitAddress = (formValues) => {
    if (guest) {
      // Sin cuenta: la dirección vive en el checkout; se guarda al instante.
      if (editingId) guestUpdate && guestUpdate(editingId, formValues);
      else guestCreate && guestCreate(formValues);
      closeModal();
      return;
    }
    if (editingId) updateAddress(formValues);
    else createAddress(formValues);
  };
  const isSaving = guest ? false : editingId ? updateLoading : createLoading;
  const canEdit = guest ? !!guestUpdate : true;
  const labels = addressModalLabels(!!editingId);

  return (
    <>
      <CheckoutCard icon={<RiMapPinLine />}>
        <div className='checkout-title'>
          <h4>
            {t(`${title}Address`)}
          </h4>
          <a className='d-flex align-items-center fw-bold' onClick={openAdd}>
            <RiAddLine className='me-1'></RiAddLine>
            {t('AddNew')}
          </a>
        </div>
        <div className='checkout-detail'>
          {
            <>
              {address?.length > 0 ? (
                <Row className='g-4'>
                  {address?.map((item, i) => (
                    <ShowAddress item={item} key={addressId(item) || i} type={type} index={i} onEdit={canEdit ? openEdit : undefined} />
                  ))}
                </Row>
              ) : (
                <div className='empty-box text-center py-3'>
                  <h2 className='mb-2'>{t('AddYourFirstAddress')}</h2>
                  <p className='text-content mb-3' style={{ fontSize: '14px' }}>{t('AddYourFirstAddressDescription')}</p>
                  <a className='btn btn-theme d-inline-flex align-items-center' onClick={openAdd}>
                    <RiAddLine className='me-1' /> {t('AddAddress')}
                  </a>
                </div>
              )}
            </>
          }
          <CustomModal modal={modal == type ? true : false} setModal={closeModal} classes={{ modalClass: 'theme-modal-2 address-modal address-modal-2', title: labels.title }}>
            <div className='right-sidebar-box'>
              <AddAddressForm mutate={submitAddress} isLoading={isSaving} setModal={closeModal} type={type} editAddress={editingId ? editAddress : undefined} submitTitle={labels.submit} showDefault={!guest} />
            </div>
          </CustomModal>
        </div>
      </CheckoutCard>
    </>
  );
};

export default DeliveryAddress;
