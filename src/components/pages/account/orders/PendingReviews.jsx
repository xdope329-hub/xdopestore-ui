import Avatar from "@/components/widgets/Avatar";
import { placeHolderImage } from "@/components/widgets/Placeholder";
import Btn from "@/elements/buttons/Btn";
import request from "@/utils/axiosUtils";
import { ReviewPendingAPI } from "@/utils/axiosUtils/API";
import useFetchQuery from "@/utils/hooks/useFetchQuery";
import Cookies from "js-cookie";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiStarSmileLine } from "react-icons/ri";
import { Card, CardBody } from "reactstrap";
import RateProductModal from "./RateProductModal";
import { itemsForOrder, summarizePending } from "./pendingReviewsRules";

/**
 * Aviso "Califica tu compra": productos de pedidos ENTREGADOS que el cliente
 * aún no ha reseñado. Sin `orderNumber` muestra todos (Mis pedidos); con él,
 * solo los de ese pedido (detalle del pedido). Desaparece cuando no queda
 * nada por calificar.
 */
const PendingReviews = ({ orderNumber }) => {
  const { t } = useTranslation("common");
  const [selected, setSelected] = useState(null);
  const isLogin = !!Cookies.get("uat");
  const { data, refetch } = useFetchQuery([ReviewPendingAPI], () => request({ url: ReviewPendingAPI }), {
    enabled: isLogin,
    refetchOnWindowFocus: false,
    select: (res) => (res?.status === 200 ? res?.data?.data || [] : []),
  });

  const items = useMemo(() => itemsForOrder(data || [], orderNumber), [data, orderNumber]);
  const summary = summarizePending(items);
  if (!items.length) return null;

  return (
    <>
      <Card className="dashboard-table mt-0 mb-4 pending-reviews-card">
        <CardBody>
          <div className="d-flex align-items-center gap-2 mb-2">
            <RiStarSmileLine size={22} style={{ color: "var(--theme-color2, #ffa200)" }} />
            <h4 className="fw-bold mb-0">{t("RateYourPurchase")}</h4>
          </div>
          <p className="text-content mb-3">
            {t("RateYourPurchaseDescription", { count: summary.count })}
            {!orderNumber && summary.orderNumbers.length ? (
              <>
                {" "}
                ({t("Order")}: {summary.orderNumbers.map((n) => `#${n}`).join(", ")})
              </>
            ) : null}
          </p>
          <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
            {items.map((item) => (
              <li key={`${item.order_id}-${item.product.id}`} className="d-flex align-items-center gap-3 flex-wrap">
                <Avatar data={item.product?.product_thumbnail} placeHolder={placeHolderImage} name={item.product?.name} height={48} width={48} customImageClass="img-fluid rounded" />
                <div className="flex-grow-1">
                  <h6 className="mb-0">{item.product?.name}</h6>
                  {!orderNumber && item.order_number ? (
                    <span className="text-content" style={{ fontSize: "13px" }}>
                      {t("Order")} #{item.order_number}
                    </span>
                  ) : null}
                </div>
                <Btn className="btn-solid btn-sm" title="Rate" onClick={() => setSelected(item)} />
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
      <RateProductModal item={selected} onClose={() => setSelected(null)} onSubmitted={() => refetch()} />
    </>
  );
};

export default PendingReviews;
