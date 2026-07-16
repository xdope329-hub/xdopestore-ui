"use client";
import SearchableSelectInput from "@/components/widgets/inputFields/SearchableSelectInput";
import CartContext from "@/context/cartContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import { AllCountryCode } from "@/data/CountryCode";
import Btn from "@/elements/buttons/Btn";
import syncLocalCart from "@/utils/customFunctions/SyncLocalCart";
import { saveSession } from "@/utils/axiosUtils";
import { YupObject, emailSchema, nameSchema, passwordConfirmationSchema, passwordSchema, phoneSchema, recaptchaSchema } from "@/utils/validation/ValidationSchema";
import CaptchaField, { RECAPTCHA_SITE_KEY } from "@/components/auth/common/CaptchaField";
import GoogleLoginButton from "@/components/auth/common/GoogleLoginButton";
import { ErrorMessage, Field, Form, Formik } from "formik";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import React, { useContext, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "reactstrap";

const API_URL = process.env.API_PROD_URL || "http://localhost:5000";

const RegisterForm = () => {
  const [showBoxMessage, setShowBoxMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const { t } = useTranslation("common");
  const { setOpenAuthModal } = useContext(ThemeOptionContext);
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
      // Backend expects { name, email, password, phone, country_code }.
      // password_confirmation is client-side only.
      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        country_code: values.country_code,
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
          // Carry guest cart items over to the brand-new account.
          await syncLocalCart();
          cartRefetch && cartRefetch();
        }
        setOpenAuthModal && setOpenAuthModal(false);
        const callbackUrl = Cookies.get("CallBackUrl");
        if (callbackUrl) {
          Cookies.remove("CallBackUrl");
          router.push(callbackUrl);
        } else {
          router.refresh();
        }
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
    <Formik
      initialValues={{
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        country_code: "57",
        phone: "",
        recaptcha: "",
      }}
      validationSchema={YupObject({
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
        password_confirmation: passwordConfirmationSchema,
        phone: phoneSchema,
        ...(RECAPTCHA_SITE_KEY ? { recaptcha: recaptchaSchema } : {}),
      })}
      onSubmit={handleSubmit}
    >
      {({ errors, touched, setFieldValue, submitCount }) => (
        <Form className="auth-form-box">
          {showBoxMessage && (
            <div role="alert" className="alert alert-danger login-alert">
              <i className="ri-error-warning-line"></i> {t(showBoxMessage, { defaultValue: showBoxMessage })}
            </div>
          )}
          <div className="auth-box mb-3 form-box">
            <label htmlFor="fname">{t("FullName")}</label>
            <Field className="form-control" name="name" type="text" id="fname" placeholder={t("FirstName")} required />
            {errors.name && touched.name && <ErrorMessage name="name" render={() => <div className="invalid-feedback d-block">{errors.name}</div>} />}
          </div>
          <div className="auth-box form-box mb-3">
            <label htmlFor="email">{t("Email")}</label>
            <Field className="form-control" name="email" type="text" id="email" placeholder={t("Email")} required />
            {errors.email && touched.email && <ErrorMessage name="email" render={() => <div className="invalid-feedback d-block">{errors.email}</div>} />}
          </div>

          <div className="auth-box form-box mb-3 phone-field">
            <div className="form-box">
              <label htmlFor="phone">{t("Phone")}</label>
              <SearchableSelectInput nameList={[{ name: "country_code", notitle: "true", inputprops: { name: "country_code", id: "country_code", options: AllCountryCode } }]} />
              <Field className="form-control" name="phone" placeholder={t("EnterPhoneNumber")} type="number" />
              {errors.phone && touched?.phone && <ErrorMessage render={() => <div className="invalid-feedback d-block">{errors.phone}</div>} />}
            </div>
          </div>

          <div className="auth-box form-box mb-3">
            <label htmlFor="password">{t("Password")}</label>
            <Field className="form-control" type="password" name="password" id="password" placeholder={t("EnterYourPassword")} required />
            {errors.password && touched.password && <ErrorMessage name="password" render={() => <div className="invalid-feedback d-block">{errors.password}</div>} />}
          </div>
          <div className="mb-3">
            <div className="form-box">
              <label htmlFor="password_confirmation">{t("ConfirmPassword")}</label>
              <Field className="form-control" name="password_confirmation" type="password" id="password_confirmation" placeholder={t("ConfirmYourPassword")} required />
              {errors.password_confirmation && touched.password_confirmation && <ErrorMessage name="password_confirmation" render={() => <div className="invalid-feedback d-block">{errors.password_confirmation}</div>} />}
            </div>
          </div>
          <div className="auth-box form-box mb-3">
            <div className="forgot-box">
              <div className="form-check ps-0 m-0 custom-check-box">
                <Input type="checkbox" id="flexCheckDefault" className="checkbox_animated check-box" onChange={(e) => setCheckboxChecked(e.target.checked)} />
                <label htmlFor="flexCheckDefault" className="form-check-label text-red">
                  {t("IAgreeWithTermsAndPrivacy")}
                </label>
              </div>
            </div>
          </div>

          <CaptchaField innerRef={captchaRef} onChange={(token) => setFieldValue("recaptcha", token)} />
          {submitCount > 0 && errors.recaptcha && (
            <div className="invalid-feedback d-block mb-2">{errors.recaptcha}</div>
          )}
          <Btn loading={isSubmitting} type="submit" disabled={isSubmitting || !checkboxChecked} className={`btn ${checkboxChecked ? "" : "disabled"}`}>
            {isSubmitting ? "Creating..." : t("CreateAccount")}
          </Btn>
          <GoogleLoginButton onError={setShowBoxMessage} />
        </Form>
      )}
    </Formik>
  );
};

export default RegisterForm;
