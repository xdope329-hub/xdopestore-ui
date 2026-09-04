import request from "@/utils/axiosUtils";
import { CountryAPI } from "@/utils/axiosUtils/API";
import useFetchQuery from "@/utils/hooks/useFetchQuery";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AccountSection from "./checkoutFormData/AccountSection";
import DeliverySection from "./checkoutFormData/DeliverySection";
import PaymentSection from "./checkoutFormData/PaymentSection";
import DeliveryAddress from "./DeliveryAddress";
import GuestDraftSync from "./GuestDraftSync";

// Campos que viajan al API como dirección inline del pedido (sin los
// metadatos locales de la tarjeta: id, type, is_default).
const toInlineAddress = (a) => ({
  title: a.title,
  street: a.street,
  city: a.city,
  country_code: a.country_code,
  phone: a.phone,
  pincode: a.pincode || "",
  country_id: a.country_id,
  state_id: a.state_id,
});

/**
 * Checkout de INVITADOS con la MISMA experiencia de direcciones que un
 * usuario logueado: tarjetas "Dirección de Envío" / "Dirección de
 * Facturación" + modal "Agregar dirección" (un único formulario de
 * dirección en toda la tienda).
 *
 * Diferencia con el flujo logueado: las direcciones del invitado no van al
 * API — viven en el estado del checkout (values.guest_addresses) y, al
 * seleccionarlas, se copian como objetos inline a values.shipping_address /
 * values.billing_address, que es lo que /payment/initialize espera de un
 * invitado.
 */
const CheckoutForm = ({ values, setFieldValue, errors, modal, setModal }) => {
  const router = useRouter();

  const { data } = useFetchQuery([CountryAPI], () => request({ url: CountryAPI }, router), {
    refetchOnWindowFocus: false,
    // request() returns { data: responseBody, ... } and the API returns { data: [...] },
    // so the actual array lives at res.data.data.
    select: (res) => (res?.data?.data ?? []).map((country) => ({ id: country.id, name: country.name, state: country.state || [] })),
  });

  const guestAddresses = Array.isArray(values.guest_addresses) ? values.guest_addresses : [];

  // "mutate" local: en vez de POST /address (no hay cuenta), la dirección
  // del modal se agrega a la lista local y queda seleccionada para la
  // sección desde la que se abrió el modal (shipping o billing).
  const guestMutate = (formValues) => {
    const id = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const addr = { ...formValues, id };
    setFieldValue("guest_addresses", [...guestAddresses, addr]);
    const type = formValues.type || "shipping";
    setFieldValue(`${type}_address_id`, id);
    // Primera dirección: seleccionarla también para la otra sección, para
    // que el caso común (facturar a la misma dirección) sea cero clics.
    if (guestAddresses.length === 0) {
      const other = type === "shipping" ? "billing" : "shipping";
      if (!values[`${other}_address_id`]) setFieldValue(`${other}_address_id`, id);
    }
  };

  // Edición de una tarjeta local: se reemplaza en la lista (la selección se
  // conserva porque el id no cambia) y el efecto de abajo vuelve a copiar
  // la dirección inline al payload.
  const guestUpdate = (id, formValues) => {
    setFieldValue(
      "guest_addresses",
      guestAddresses.map((a) => (a.id === id ? { ...a, ...formValues, id } : a))
    );
  };

  // Selección de tarjeta → objeto inline para el payload del pedido.
  useEffect(() => {
    const pick = (id) => guestAddresses.find((a) => a.id === id);
    const s = pick(values.shipping_address_id);
    const b = pick(values.billing_address_id);
    if (s) setFieldValue("shipping_address", toInlineAddress(s));
    if (b) setFieldValue("billing_address", toInlineAddress(b));
  }, [values.shipping_address_id, values.billing_address_id, values.guest_addresses]); // eslint-disable-line

  return (
    <>
      {/* Un refresh no borra lo escrito por el invitado. */}
      <GuestDraftSync />
      <AccountSection setFieldValue={setFieldValue} values={values} />
      <DeliveryAddress
        key="guest-shipping"
        type="shipping"
        title={"Shipping"}
        guest
        values={values}
        setFieldValue={setFieldValue}
        address={guestAddresses}
        modal={modal}
        setModal={setModal}
        mutate={guestMutate}
        guestUpdate={guestUpdate}
      />
      <DeliveryAddress
        key="guest-billing"
        type="billing"
        title={"Billing"}
        guest
        values={values}
        setFieldValue={setFieldValue}
        address={guestAddresses}
        modal={modal}
        setModal={setModal}
        mutate={guestMutate}
        guestUpdate={guestUpdate}
      />
      <DeliverySection values={values} setFieldValue={setFieldValue} />
      <PaymentSection values={values} setFieldValue={setFieldValue} />
    </>
  );
};

export default CheckoutForm;
