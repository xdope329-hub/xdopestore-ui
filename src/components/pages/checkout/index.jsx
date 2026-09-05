"use client";
import WrapperComponent from "@/components/widgets/WrapperComponent";
import AccountContext from "@/context/accountContext";
import SettingContext from "@/context/settingContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import Loader from "@/layout/loader";
import request from "@/utils/axiosUtils";
import { AddToCartAPI, AddressAPI } from "@/utils/axiosUtils/API";
import Breadcrumbs from "@/utils/commonComponents/breadcrumb";
import { buildCheckoutValidationSchema } from "@/utils/validation/ValidationSchema";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import { Form, Formik } from "formik";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Fragment, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Col, Row } from "reactstrap";
import CheckoutForm from "./CheckoutForm";
import CheckoutSidebar from "./checkoutSidebar";
import DeliveryAddress from "./DeliveryAddress";
import DeliveryOptions from "./DeliveryOptions";
import PaymentOptions from "./PaymentOptions";

const CheckoutContent = () => {
  const { t } = useTranslation("common");
  const { accountData, refetch } = useContext(AccountContext);
  const { settingData } = useContext(SettingContext);
  const [address, setAddress] = useState([]);
  const [modal, setModal] = useState("");
  const router = useRouter();
  const [accessToken, setAccessToken] = useState(null);
  const { isLoading: themeLoad, openAuthModal, setOpenAuthModal } = useContext(ThemeOptionContext);

  // Re-read the auth cookie whenever the auth modal opens/closes, so once a
  // guest logs in from the checkout prompt the address/payment UI appears
  // without a manual refresh.
  useEffect(() => {
    setAccessToken(Cookies.get("uat"));
  }, [openAuthModal]);

  // La sesión puede restaurarse en silencio DESPUÉS de montar la página (el
  // refresh automático tras un 401, o un login en otra pestaña). Re-leer la
  // cookie al volver el foco mantiene la vista de checkout sincronizada con
  // la sesión real, para no mostrar el formulario de invitado a un usuario
  // que ya está autenticado.
  useEffect(() => {
    const syncAuth = () => setAccessToken(Cookies.get("uat"));
    window.addEventListener("focus", syncAuth);
    document.addEventListener("visibilitychange", syncAuth);
    return () => {
      window.removeEventListener("focus", syncAuth);
      document.removeEventListener("visibilitychange", syncAuth);
    };
  }, []);

  const { data: addressData, refetch: refetchAddresses } = useFetchQuery(
    [AddressAPI],
    () => request({ url: AddressAPI }, router),
    { enabled: false, select: (res) => res?.data?.data ?? [] }
  );

  useEffect(() => {
    if (accessToken) refetchAddresses();
  }, [accessToken]);

  useEffect(() => {
    // También cuando queda vacía (se borró la última dirección en otra pestaña).
    if (Array.isArray(addressData)) setAddress(addressData);
  }, [addressData]);

  // Direcciones nuevas/editadas con sesión: las guarda DeliveryAddress
  // (POST/PUT /address); aquí solo se refresca la cuenta para que el libro
  // de direcciones quede al día.
  const onAddressChange = () => refetch && refetch();

  // Calling Add to Cart API
  const { data: addToCartData, isLoading: addToCartLoader, refetch: addToCartRefetch } = useFetchQuery([AddToCartAPI], () => request({ url: AddToCartAPI }, router), { enabled: false, refetchOnWindowFocus: false, cacheTime: 0, select: (res) => res?.data });

  useEffect(() => {
    if (accessToken && !addToCartLoader) {
      addToCartRefetch();
    }
  }, [addToCartLoader, accessToken]);

  // Reglas según quién compra (ver checkoutSchema.js): el invitado valida
  // contacto + direcciones inline; con sesión no hay campos de invitado que
  // validar. Carrito solo digital → sin dirección de envío.
  const isGuest = !accessToken;
  const validationSchema = buildCheckoutValidationSchema({ isGuest, requiresShipping: !addToCartData?.is_digital_only });

  if (themeLoad) return <Loader />;
  return (
    <Fragment>
      <Breadcrumbs title={"Checkout"} subNavigation={[{ name: "Checkout" }]} />
      <WrapperComponent classes={{ sectionClass: "section-b-space checkout-section-2", fluidClass: "container" }} noRowCol={true}>
        <div className="checkout-page checkout-form">
          <Formik
            initialValues={{
              products: [],
              shipping_address_id: "",
              billing_address_id: "",
              // Direcciones locales del invitado (tarjetas del checkout)
              guest_addresses: [],
              points_amount: "",
              wallet_balance: "",
              coupon: "",
              delivery_description: "",
              delivery_interval: "",
              payment_method: "",
              create_account: false,
              name: "",
              email: "",
              country_code: "57",
              phone: "",
              password: "",
              shipping_address: {
                title: "",
                street: "",
                city: "",
                country_code: "57",
                phone: "",
                pincode: "",
                country_id: "",
                state_id: "",
              },
              billing_address: {
                same_shipping: true,
                title: "",
                street: "",
                city: "",
                country_code: "57",
                phone: "",
                pincode: "",
                country_id: "",
                state_id: "",
              },
            }}
            validationSchema={validationSchema}
            // El único camino para pedir es el botón "Realizar pedido"
            // (PlaceOrder). Antes, Enter en cualquier campo enviaba el
            // formulario y disparaba POST /address con los valores del
            // checkout (401 para el invitado, dirección basura con sesión).
            onSubmit={() => {}}
          >
            {({ values, setFieldValue, errors }) => (
              <Form className="checkout-form">
                <Row className="g-sm-4 g-3">
                  <Col lg="7">
                    <div className="left-sidebar-checkout">
                      <div className="checkout-detail-box">
                        {!accessToken && settingData?.activation?.guest_checkout && (
                          // Compra como invitado: las MISMAS tarjetas que el cliente con
                          // sesión (contacto, direcciones, entrega y pago). Iniciar
                          // sesión sigue disponible como atajo.
                          <div className="checkout-detail-box">
                            <div className="guest-login-hint mb-3">
                              <span className="text-content">{t("AlreadyHaveAccount")}</span>{" "}
                              <a className="theme-color fw-semibold" style={{ cursor: "pointer" }} onClick={() => setOpenAuthModal(true)}>
                                {t("Login")}
                              </a>
                            </div>
                            <ul>
                              <CheckoutForm values={values} setFieldValue={setFieldValue} errors={errors} modal={modal} setModal={setModal} />
                            </ul>
                          </div>
                        )}
                        {!accessToken && !settingData?.activation?.guest_checkout && (
                          <div className="checkout-form-section">
                            <div className="checkout-login-required theme-card text-center p-4">
                              <h4 className="mb-2">{t("LoginToContinue")}</h4>
                              <p className="mb-3">{t("LoginToContinueDescription")}</p>
                              <button type="button" className="btn btn-solid" onClick={() => setOpenAuthModal(true)}>
                                {t("Login")}
                              </button>
                            </div>
                          </div>
                        )}
                        {accessToken && (
                          <div className="checkout-detail-box">
                            <ul>
                              {!addToCartData?.is_digital_only && <DeliveryAddress key="shipping" type="shipping" title={"Shipping"} values={values} setFieldValue={setFieldValue} address={address} modal={modal} setModal={setModal} refetchAddresses={refetchAddresses} onAddressChange={onAddressChange} />}
                              <DeliveryAddress key="billing" type="billing" title={"Billing"} values={values} setFieldValue={setFieldValue} address={address} modal={modal} setModal={setModal} refetchAddresses={refetchAddresses} onAddressChange={onAddressChange} />
                              {!addToCartData?.is_digital_only && <DeliveryOptions values={values} setFieldValue={setFieldValue} />}
                              <PaymentOptions values={values} setFieldValue={setFieldValue} />
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>
                  <CheckoutSidebar addToCartData={addToCartData} values={values} setFieldValue={setFieldValue} errors={errors} sessionToken={accessToken} />
                </Row>
              </Form>
            )}
          </Formik>
        </div>
      </WrapperComponent>
    </Fragment>
  );
};

export default CheckoutContent;
