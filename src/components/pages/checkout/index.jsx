"use client";
import WrapperComponent from "@/components/widgets/WrapperComponent";
import AccountContext from "@/context/accountContext";
import SettingContext from "@/context/settingContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import Loader from "@/layout/loader";
import request from "@/utils/axiosUtils";
import { AddToCartAPI, AddressAPI } from "@/utils/axiosUtils/API";
import Breadcrumbs from "@/utils/commonComponents/breadcrumb";
import useCreate from "@/utils/hooks/useCreate";
import { addressObjectSchema, emailSchema, idCreateAccount, nameSchema, phoneSchema } from "@/utils/validation/ValidationSchema";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import { Form, Formik } from "formik";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Fragment, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Col, Row } from "reactstrap";
import * as Yup from "yup";
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

  const { data: addressData, refetch: refetchAddresses } = useFetchQuery(
    [AddressAPI],
    () => request({ url: AddressAPI }, router),
    { enabled: false, select: (res) => res?.data?.data ?? [] }
  );

  useEffect(() => {
    if (accessToken) refetchAddresses();
  }, [accessToken]);

  useEffect(() => {
    if (addressData?.length > 0) setAddress(addressData);
  }, [addressData]);

  const { mutate, isLoading } = useCreate(AddressAPI, false, false, "AddressAddedSuccessfully", (resDta) => {
    refetchAddresses();
    refetch();
    setModal("");
  });

  // Calling Add to Cart API
  const { data: addToCartData, isLoading: addToCartLoader, refetch: addToCartRefetch } = useFetchQuery([AddToCartAPI], () => request({ url: AddToCartAPI }, router), { enabled: false, refetchOnWindowFocus: false, cacheTime: 0, select: (res) => res?.data });

  useEffect(() => {
    if (accessToken && !addToCartLoader) {
      addToCartRefetch();
    }
  }, [addToCartLoader, accessToken]);

  // Validación de dirección compartida (mismas reglas que el modal y la
  // página de cuenta): título, dirección, ciudad, teléfono con formato,
  // código postal numérico opcional, país y departamento.
  const addressSchema = addressObjectSchema;

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
            validationSchema={Yup.object().shape({
              name: nameSchema,
              email: emailSchema,
              phone: phoneSchema,
              password: idCreateAccount,
              shipping_address: addressSchema,
              billing_address: addressSchema,
            })}
            onSubmit={mutate}
          >
            {({ values, setFieldValue, errors }) => (
              <Form className="checkout-form">
                <Row className="g-sm-4 g-3">
                  <Col lg="7">
                    <div className="left-sidebar-checkout">
                      <div className="checkout-detail-box">
                        {!accessToken && settingData?.activation?.guest_checkout && (
                          <div className="checkout-form-section">
                            {/* Compra como invitado: datos de contacto + direcciones
                                inline. Iniciar sesión sigue disponible como atajo. */}
                            <div className="guest-login-hint mb-3">
                              <span className="text-content">{t("AlreadyHaveAccount")}</span>{" "}
                              <a className="theme-color fw-semibold" style={{ cursor: "pointer" }} onClick={() => setOpenAuthModal(true)}>
                                {t("Login")}
                              </a>
                            </div>
                            <ul>
                              <CheckoutForm values={values} setFieldValue={setFieldValue} errors={errors} />
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
                              {!addToCartData?.is_digital_only && <DeliveryAddress key="shipping" type="shipping" title={"Shipping"} values={values} updateId={values["consumer_id"]} setFieldValue={setFieldValue} address={address} modal={modal} mutate={mutate} isLoading={isLoading} setModal={setModal} refetchAddresses={refetchAddresses} />}
                              <DeliveryAddress key="billing" type="billing" title={"Billing"} values={values} updateId={values["consumer_id"]} setFieldValue={setFieldValue} address={address} modal={modal} mutate={mutate} isLoading={isLoading} setModal={setModal} refetchAddresses={refetchAddresses} />
                              {!addToCartData?.is_digital_only && <DeliveryOptions values={values} setFieldValue={setFieldValue} />}
                              <PaymentOptions values={values} setFieldValue={setFieldValue} />
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>
                  <CheckoutSidebar addToCartData={addToCartData} values={values} setFieldValue={setFieldValue} errors={errors} />
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
