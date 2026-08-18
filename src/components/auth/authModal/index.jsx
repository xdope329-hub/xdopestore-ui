import ThemeOptionContext from "@/context/themeOptionsContext";
import Btn from "@/elements/buttons/Btn";
import { Href, ImagePath, storageURL } from "@/utils/constants";
import Cookies from "js-cookie";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, ModalBody } from "reactstrap";
import ForgotPasswordForm from "./ForgotPasswordForm";
import LoginForm from "./LoginForm";
import OTPVerificationForm from "./OTPVerificationForm";
import RegisterForm from "./RegisterForm";

const AuthModal = () => {
  const [state, setState] = useState("login");
  const [title, setTitle] = useState("SignIn");
  const { t } = useTranslation("common");
  const [logOrNew, setLogOrNew] = useState(false);
  const { openAuthModal, setOpenAuthModal, themeOption } = useContext(ThemeOptionContext);
  const router = useRouter();

  const handleClick = () => {
    setState(state == "login" ? "register" : "login");
    setLogOrNew(!logOrNew);
  };

  useEffect(() => {
    if (state == "forgot") {
      setTitle("ForgotPassword");
    } else if (state == "otp") {
      setTitle("Otp");
    } else if (state == "register") {
      setTitle("CreateAccount");
    } else {
      setTitle("SignIn");
    }
  }, [state]);

  return (
    <Modal toggle={() => setOpenAuthModal(false)} className="auth-modal modal-dialog-centered d-block modal-xl fade show" isOpen={openAuthModal}>
      <div className="modal-dialog ">
        <div className="modal-content">
          <ModalBody>
            <div className="modal-content open">
              <div className="d-flex">
                <div className="right-content w-lg-50 w-100">
                  <div>
                    <div className="auth-title">
                      <h3>{t(title)}</h3>
                      <p>{state == "otp" ? t("OtpDescription") : t("AuthModalDescription")}</p>
                    </div>
                    {state == "register" && <RegisterForm />}
                    {state == "login" && <LoginForm setState={setState} />}
                    {state == "forgot" && <ForgotPasswordForm setState={setState} />}
                    {state == "otp" && <OTPVerificationForm setState={setState} />}
                    {state !== "forgot" && state !== "otp" && (
                      <>
                        <div className="divider">
                          <span>{t("OR")}</span>
                        </div>
                        <p className="create">
                          {state == "login" ? t("Don'thaveanaccount") : t("Alreadyhaveanaccount")} ?{" "}
                          <a href={Href} onClick={handleClick}>
                            {logOrNew ? t("Login") : t("Register")} {t("Here")}
                          </a>
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="left-img w-lg-50 d-lg-block d-none">
                  <Image height={600} width={600} src={themeOption?.popup?.auth?.image_url ? storageURL + themeOption.popup.auth.image_url : `${ImagePath}/placeholder/auth.png`} alt="login" className="img-fluid" />
                </div>
              </div>
            </div>
          </ModalBody>
        </div>
      </div>
    </Modal>
  );
};

export default AuthModal;
