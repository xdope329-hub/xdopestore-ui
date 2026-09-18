"use client";
import ReCAPTCHA from "react-google-recaptcha";

// Inlined at build time. When the key is absent the captcha is disabled and
// this component renders nothing, so dev keeps working without Google keys.
export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

/**
 * reCAPTCHA v2 "I'm not a robot" checkbox.
 * `onChange` receives the widget token ("" when it expires or is reset).
 * Pass `innerRef` to be able to reset the widget after a failed submit.
 */
const CaptchaField = ({ onChange, innerRef, className }) => {
  if (!RECAPTCHA_SITE_KEY) return null;
  return (
    <div className={className || "auth-box mb-3 captcha-box"} data-testid="captcha">
      <ReCAPTCHA
        ref={innerRef}
        sitekey={RECAPTCHA_SITE_KEY}
        onChange={(token) => onChange(token || "")}
        onExpired={() => onChange("")}
        onErrored={() => onChange("")}
      />
    </div>
  );
};

export default CaptchaField;
