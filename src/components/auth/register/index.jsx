"use client";
import Btn from "@/elements/buttons/Btn";
import CartContext from "@/context/cartContext";
import Breadcrumbs from "@/utils/commonComponents/breadcrumb";
import syncLocalCart from "@/utils/customFunctions/SyncLocalCart";
import { saveSession } from "@/utils/axiosUtils";
import { YupObject, emailSchema, nameSchema, passwordConfirmationSchema, passwordSchema, recaptchaSchema } from "@/utils/validation/ValidationSchema";
import CaptchaField, { RECAPTCHA_SITE_KEY } from "@/components/auth/common/CaptchaField";
import GoogleLoginButton from "@/components/auth/common/GoogleLoginButton";
import { ErrorMessage, Field, Form, Formik } from "formik";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useContext, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Col, Container, Row } from "reactstrap";

const API_URL = process.env.API_PROD_URL || "http://localhost:5000";

const RegisterContainer = () => {
  const { t } = useTranslation("common");
  const [showBoxMessage, setShowBoxMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refetch: cartRefetch } = useContext(CartContext) || {};
  const router = useRouter();
  const captchaRef = useRef(null);

  const resetCaptcha = (setFieldValue) => {
    if (!RECAPTCHA_SITE_KEY) return;
    captchaRef.current?.reset?.();
    setFieldValue && setFieldValue("recaptcha", "");
  };

  const handleSubmit = async (values, { setFieldValue }) => {
    setIsSubmitting(true);
    setShowBoxMessage("");
    try {
      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        recaptcha: values.recaptcha,
      };
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        // Store both access + refresh via shared helper.
        saveSession(data || {});
        if (data?.access_token || data?.token) {
          Cookies.set("account", JSON.stringify(data?.data || {}));
          localStorage.setItem("account", JSON.stringify(data?.data || {}));
          // Persist guest cart items into the new account before navigating.
          await syncLocalCart();
          cartRefetch && cartRefetch();
        }
        router.push("/account/dashboard");
      } else {
        setShowBoxMessage(data?.message || "Registration failed");
        resetCaptcha(setFieldValue);
      }
    } catch (err) {
      console.error("Register error:", err);
      setShowBoxMessage(`Registration failed: ${err.message}`);
      resetCaptcha(setFieldValue);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Breadcrumbs title={"Home"} subTitle={"CreateAccount"} />
      <section className="register-page section-t-space section-b-space">
        <Container>
          <Row>
            <Col lg="12">
              <h3>{t("CreateAccount")}</h3>
              <div className="theme-card">
                {showBoxMessage && (
                  <div role="alert" className="alert alert-danger login-alert mb-3">
                    <i className="ri-error-warning-line"></i> {showBoxMessage}
                  </div>
                )}
                <Formik
                  initialValues={{
                    name: "",
                    email: "",
                    password: "",
                    password_confirmation: "",
                    recaptcha: "",
                  }}
                  validationSchema={YupObject({
                    name: nameSchema,
                    email: emailSchema,
                    password: passwordSchema,
                    password_confirmation: passwordConfirmationSchema,
                    ...(RECAPTCHA_SITE_KEY ? { recaptcha: recaptchaSchema } : {}),
                  })}
                  onSubmit={handleSubmit}
                >
                  {({ errors, touched, setFieldValue, submitCount }) => (
                    <Form className="theme-form">
                      <Row className="form-row">
                        <Col md="4">
                          <label htmlFor="fname">{t("FullName")}</label>
                          <Field className="form-control" name="name" type="text" id="fname" placeholder="First name" required />
                          {errors.name && touched.name && <ErrorMessage name="name" render={() => <div className="invalid-feedback d-block">{errors.name}</div>} />}
                        </Col>
                        <Col md="4">
                          <label htmlFor="email">{t("Email")}</label>
                          <Field className="form-control" name="email" type="text" id="email" placeholder="Email" required />
                          {errors.email && touched.email && <ErrorMessage name="email" render={() => <div className="invalid-feedback d-block">{errors.email}</div>} />}
                        </Col>
                      </Row>
                      <Row className="form-row">
                        <Col md="6">
                          <label htmlFor="password">{t("Password")}</label>
                          <Field className="form-control" type="password" name="password" id="password" placeholder="Enter your password" required />
                          {errors.password && touched.password && <ErrorMessage name="password" render={() => <div className="invalid-feedback d-block">{errors.password}</div>} />}
                        </Col>
                        <Col md="6">
                          <label htmlFor="password_confirmation">{t("ConfirmPassword")}</label>
                          <Field className="form-control" name="password_confirmation" type="password" id="password_confirmation" placeholder="Confirm your password" required />
                          {errors.password_confirmation && touched.password_confirmation && <ErrorMessage name="password_confirmation" render={() => <div className="invalid-feedback d-block">{errors.password_confirmation}</div>} />}
                        </Col>

                        <Col md="12">
                          <CaptchaField innerRef={captchaRef} onChange={(token) => setFieldValue("recaptcha", token)} />
                          {submitCount > 0 && errors.recaptcha && (
                            <div className="invalid-feedback d-block mb-2">{errors.recaptcha}</div>
                          )}
                        </Col>

                        <Btn loading={isSubmitting} type="submit" disabled={isSubmitting} className="btn-solid w-auto">
                          {isSubmitting ? "Creating..." : t("CreateAccount")}
                        </Btn>
                        <GoogleLoginButton onError={setShowBoxMessage} />
                      </Row>
                    </Form>
                  )}
                </Formik>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default RegisterContainer;
