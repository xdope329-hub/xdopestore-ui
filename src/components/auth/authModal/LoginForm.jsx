"use client";
import Btn from "@/elements/buttons/Btn";
import { Href } from "@/utils/constants";
import CartContext from "@/context/cartContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import syncLocalCart from "@/utils/customFunctions/SyncLocalCart";
import { saveSession } from "@/utils/axiosUtils";
import { YupObject, emailSchema, passwordSchema, recaptchaSchema } from "@/utils/validation/ValidationSchema";
import CaptchaField, { RECAPTCHA_SITE_KEY } from "@/components/auth/common/CaptchaField";
import GoogleLoginButton from "@/components/auth/common/GoogleLoginButton";
import { ErrorMessage, Field, Form, Formik } from "formik";
import Cookies from "js-cookie";
import React, { useContext, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "reactstrap";
import { useRouter } from "next/navigation";

const API_URL = process.env.API_PROD_URL || "http://localhost:5000";

const LoginForm = ({ setState }) => {
  const [showBoxMessage, setShowBoxMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (res.ok) {
        // Store both access + refresh via the shared helper so this modal
        // and the page-based login stay in lock-step.
        saveSession(data || {});
        Cookies.set("account", JSON.stringify(data?.data || {}));
        localStorage.setItem("account", JSON.stringify(data?.data || {}));

        // Merge the guest cart into the now-authenticated user's cart
        // before we close the modal / navigate, so items persist.
        await syncLocalCart();
        cartRefetch && cartRefetch();

        setOpenAuthModal && setOpenAuthModal(false);
        const callbackUrl = Cookies.get("CallBackUrl");
        if (callbackUrl) {
          Cookies.remove("CallBackUrl");
          router.push(callbackUrl);
        } else {
          router.refresh();
        }
      } else {
        setShowBoxMessage(data?.message || "InvalidCredentials");
        resetCaptcha(setFieldValue);
      }
    } catch (err) {
      console.error("Login error:", err);
      setShowBoxMessage("LoginFailed");
      resetCaptcha(setFieldValue);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, setFieldValue, submitCount }) => (
        <Form className="auth-form-box">
          {showBoxMessage && (
            <div role="alert" className="alert alert-danger login-alert">
              <i className="ri-error-warning-line"></i> {t(showBoxMessage, { defaultValue: showBoxMessage })}
            </div>
          )}
          {/* Google sign-in first — the fastest path for most shoppers. */}
          <GoogleLoginButton onError={setShowBoxMessage} />
          <div className="auth-divider" aria-hidden="true">
            <span>{t("OrContinueWithEmail")}</span>
          </div>
          <div className="auth-box mb-3">
            <Label htmlFor="email">{t("Email")}</Label>
            <Field name="email" className="form-control" id="email" placeholder={t("Email")} />
            {errors.email && touched.email && (
              <div className="invalid-feedback d-block">{errors.email}</div>
            )}
          </div>
          <div className="auth-box mb-3">
            <Label htmlFor="password">{t("Password")}</Label>
            <Field name="password" type="password" className="form-control" id="password" placeholder={t("EnterYourPassword")} />
            {errors.password && touched.password && (
              <div className="invalid-feedback d-block">{errors.password}</div>
            )}
            <a href={Href} className="forgot" onClick={() => setState("forgot")}>
              {t("ForgotYourPassword")}
            </a>
          </div>
          <CaptchaField innerRef={captchaRef} onChange={(token) => setFieldValue("recaptcha", token)} />
          {submitCount > 0 && errors.recaptcha && (
            <div className="invalid-feedback d-block mb-2">{errors.recaptcha}</div>
          )}
          <Btn loading={isSubmitting} type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("LoggingIn") : t("Login")}
          </Btn>
        </Form>
      )}
    </Formik>
  );
};

export default LoginForm;
