import CustomModal from '@/components/widgets/CustomModal';
import request from '@/utils/axiosUtils';
import { AddressAPI } from '@/utils/axiosUtils/API';
import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { RiAddLine, RiMapPinLine } from 'react-icons/ri';
import { Row } from 'reactstrap';
import AddAddressForm from './common/AddAddressForm';
import CheckoutCard from './common/CheckoutCard';
import ShowAddress from './ShowAddress';

const DeliveryAddress = ({ type, title, address, modal, mutate, isLoading, setModal, setFieldValue, values, refetchAddresses }) => {
  const { t } = useTranslation('common');

  const selectedId = values?.[`${type}_address_id`];

  // Pre-select the user's default address (the API sorts is_default first, so it's
  // typically address[0], but we explicitly look for is_default to be safe).
  useEffect(() => {
    if (!address?.length) return;
    if (selectedId) return; // user already picked something — respect it
    const preferred = address.find((a) => a?.is_default) || address[0];
    if (preferred?.id || preferred?._id) {
      setFieldValue(`${type}_address_id`, preferred.id || preferred._id);
    }
  }, [address, type]);

  // Whenever the user picks a different billing address, promote it to be
  // their account-wide default. The API endpoint clears the previous default
  // and flips this address to is_default=true; refetching the list then moves
  // the "Default" badge and keeps every other place (account → Saved Address,
  // future checkout sessions, the inline-address pre-selection above) in sync.
  useEffect(() => {
    if (type !== 'billing') return;
    if (!selectedId) return;
    if (!Array.isArray(address) || address.length === 0) return;

    const picked = address.find((a) => (a?.id || a?._id) === selectedId);
    if (!picked) return;
    if (picked.is_default) return; // already the default — nothing to do

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
  }, [type, selectedId, address, refetchAddresses]);

  return (
    <>
      <CheckoutCard icon={<RiMapPinLine />}>
        <div className='checkout-title'>
          <h4>
            {t(`${title}Address`)}
          </h4>
          <a className='d-flex align-items-center fw-bold' onClick={() => setModal(type)}>
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
                    <ShowAddress item={item} key={item?.id || item?._id || i} type={type} index={i} />
                  ))}
                </Row>
              ) : (
                <div className='empty-box'>
                  <h2>{t('NoaddressFound')}</h2>
                </div>
              )}
            </>
          }
          <CustomModal modal={modal == type ? true : false} setModal={setModal} classes={{ modalClass: 'theme-modal-2 address-modal address-modal-2', title: "AddAddress", }}>
            <div className='right-sidebar-box'>
              <AddAddressForm mutate={mutate} isLoading={isLoading} setModal={setModal} type={type} />
            </div>
          </CustomModal>
        </div>
      </CheckoutCard>
    </>
  );
};

export default DeliveryAddress;
