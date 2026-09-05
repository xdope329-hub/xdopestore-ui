import DetailStatus from "@/components/pages/account/orders/details/DetailStatus";
import DetailsConsumer from "@/components/pages/account/orders/details/DetailsConsumer";
import DetailsTable from "@/components/pages/account/orders/details/DetailsTable";
import SubOrdersTable from "@/components/pages/account/orders/details/SubOrdersTable";
import Loader from "@/layout/loader";
import { useTranslation } from "react-i18next";

// Seguimiento público (número de pedido + correo/teléfono): reutiliza las
// mismas piezas que el detalle del pedido en Mi cuenta, en modo solo lectura
// (sin reembolsos), con la forma que devuelve GET /trackOrder. Las piezas
// propias de esta página esperaban otra forma (pivot, state_id...) y salían
// vacías.

const TrackOrderDetails = ({ data, isLoading, orderNumber }) => {
  const { t } = useTranslation("common");
  
  if (isLoading) return <Loader />;
  return (
    <>
      <div className="title-header mb-3">
        <h5>{`${t("OrderNumber")}: #${data?.order_number ?? orderNumber}`}</h5>
      </div>
      <DetailStatus data={data} />
      <DetailsTable data={data} readOnly />
      <DetailsConsumer data={data} />
      {data?.sub_orders?.length ? <SubOrdersTable data={data?.sub_orders} /> : null}
      
    </>
  );
};

export default TrackOrderDetails;
