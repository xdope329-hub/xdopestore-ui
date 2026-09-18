"use client";
import request from "@/utils/axiosUtils";
import Cookies from "js-cookie";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const OrderSuccess = () => {
  const { t } = useTranslation("common");
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [status, setStatus] = useState("loading");
  const [orderNumber, setOrderNumber] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  useEffect(() => { setIsGuest(!Cookies.get("uat")); }, []);

  useEffect(() => {
    if (!orderId) { setStatus("error"); return; }
    request({ url: `/payment/verify/${orderId}` })
      .then((res) => {
        const ps = res?.data?.payment_status;
        if (ps === "completed" || ps === "pending") setStatus("success");
        else setStatus("failed");
        setOrderNumber(res?.data?.order_number || null);
      })
      .catch(() => setStatus("success")); // COD won't fail here
  }, [orderId]);

  if (status === "loading") {
    return (
      <section className="section-b-space">
        <div className="container text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3">{t("verifying_payment") || "Verificando pago..."}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-b-space">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center py-5">
            {status === "success" ? (
              <>
                <div style={{ fontSize: 64 }}>✓</div>
                <h2 className="mt-3">{t("order_placed") || "¡Pedido realizado!"}</h2>
                <p className="text-muted">
                  {orderNumber ? `${t("order_number") || "Número de pedido"}: #${orderNumber}` : ""}
                </p>
                <p>{t("order_success_msg") || "Tu pedido fue recibido y está siendo procesado."}</p>
                {isGuest && (
                  <div className="theme-card p-3 mt-3">
                    <p className="mb-2 fw-semibold">{t("GuestCreateAccountTitle")}</p>
                    <p className="text-muted mb-3" style={{ fontSize: "14px" }}>{t("GuestCreateAccountDescription")}</p>
                    <Link href="/auth/register" className="btn btn-outline">
                      {t("CreateAccount")}
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: 64 }}>✗</div>
                <h2 className="mt-3">{t("payment_failed") || "Pago fallido"}</h2>
                <p>{t("payment_failed_msg") || "No pudimos procesar tu pago. Por favor intenta de nuevo."}</p>
              </>
            )}
            <div className="mt-4 d-flex gap-3 justify-content-center">
              <Link href="/account/order" className="btn btn-solid">
                {t("My_Orders") || "Mis pedidos"}
              </Link>
              <Link href="/" className="btn btn-outline">
                {t("continue_shopping") || "Seguir comprando"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderSuccess;
