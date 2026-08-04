"use client";
import Btn from "@/elements/buttons/Btn";
import Breadcrumbs from "@/utils/commonComponents/breadcrumb";
import useHandleLogin from "@/utils/hooks/useLogin";
import { YupObject, emailSchema, passwordSchema, recaptchaSchema } from "@/utils/validation/ValidationSchema";
import CaptchaField, { RECAPTCHA_SITE_KEY } from "@/components/auth/common/CaptchaField";
import GoogleLoginButton from "@/components/auth/common/GoogleLoginButton";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Col, Container, FormGroup, Row } from "reactstrap";

const LoginContainer = () => {
  const { mutate } = useHandleLogin();
  const { t } = useTranslation("common");
  const captchaRef = useRef(null);
  return (
    <>
      <Breadcrumbs title={"Home"} subTitle={"Login"} />
      <section className="login-page section-t-space section-b-space">
        <Container>
          <Row>
            <Col lg="6">
              <h3>{t("Login")}</h3>
              <div className="theme-card">
                <Formik
                  initialValues={{
                    email: "",
                    password: "",
                    recaptcha: "",
                  }}
                  validationSchema={YupObject({
                    email: emailSchema,
                    password: passwordSchema,
                    ...(RECAPTCHA_SITE_KEY ? { recaptcha: recaptchaSchema } : {}),
                  })}
                  onSubmit={(values) => {
                    mutate(values, {
                      onSettled: () => {
                        // A used captcha token is single-use — always reset.
                        captchaRef.current?.reset?.();
                      },
                    });
                  }}
                >
                  {({ values, errors, touched, setFieldValue, submitCount }) => (
                    <Form className="theme-form">
                      <FormGroup>
                        <label htmlFor="email">{t("Email")}</label>
                        <Field name="email" className="form-control" id="email" placeholder={t("EnterEmail")} required />
                        {errors.email && touched.email && <ErrorMessage name="email" render={(msg) => <div className="invalid-feedback d-block">{errors.email}</div>} />}
                      </FormGroup>
                      <FormGroup>
                        <label htmlFor="review">{t("Password")}</label>
                        <Field name="password" type="password" className="form-control" id="review" placeholder={t("EnterYourPassword")} required />
                        {errors.password && touched.password && <ErrorMessage name="password" render={(msg) => <div className="invalid-feedback d-block">{errors.password}</div>} />}
                      </FormGroup>
                      <CaptchaField innerRef={captchaRef} onChange={(token) => setFieldValue("recaptcha", token)} />
                      {submitCount > 0 && errors.recaptcha && (
                        <div className="invalid-feedback d-block mb-2">{errors.recaptcha}</div>
                      )}
                      <Btn  type="submit" className="btn-solid">
                        {t("Login")}
                      </Btn>
                      <GoogleLoginButton recaptchaToken={values.recaptcha} onCaptchaConsumed={() => { captchaRef.current?.reset?.(); setFieldValue("recaptcha", ""); }} />
                    </Form>
                  )}
                </Formik>
              </div>
            </Col>
            <Col lg="6" className="right-login">
              <h3>{t("NewCustomer")}</h3>
              <div className="theme-card authentication-right">
                <h6 className="title-font">{t("CreateAAccount")}</h6>
                <p>{t("SignUpDescription")}</p>
                <a href="#" className="btn btn-solid">
                  {t("CreateAccount")}
                </a>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default LoginContainer;
