import NoDataFound from "@/components/widgets/NoDataFound";
import Pagination from "@/components/widgets/Pagination";
import SettingContext from "@/context/settingContext";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { RiEyeLine } from "react-icons/ri";
import { Card, CardBody, Table } from "reactstrap";
import request from "@/utils/axiosUtils";
import { OrderAPI } from "@/utils/axiosUtils/API";
import { showMonthWiseDateAndTime } from "@/utils/customFunctions/DateFormat";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import { useTranslation } from "react-i18next";
import AccountHeading from "../common/AccountHeading";
import Loader from "@/layout/loader";
import Capitalize from "@/utils/customFunctions/Capitalize";
import PendingReviews from "./PendingReviews";

const MyOrders = () => {
  const [page, setPage] = useState(1);
  const { t } = useTranslation("common");
  const { convertCurrency } = useContext(SettingContext);
  const { data, isLoading, refetch } = useFetchQuery([page], () => request({ url: OrderAPI, params: { page: page, paginate: 10 } }), {
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (res) => res?.data,
  });

  useEffect(() => {
    isLoading && refetch();
  }, [isLoading]);

  if (isLoading)
    return (
      <div className="box-loader">
        <Loader classes={"blur-bg"} />
      </div>
    );
  return (
    <>
    {/* Productos entregados pendientes de calificar (se oculta si no hay). */}
    <PendingReviews />
    <Card className="dashboard-table mt-0">
      <CardBody className="p-0">
        <AccountHeading title="MyOrders" classes={"top-sec"} />
        {data?.data?.length > 0 ? (
          <>
            <div className="total-box mt-0">
              <div className="wallet-table mt-0">
                <div className="table-responsive">
                  <Table className="table cart-table order-table">
                    <thead>
                      <tr className="table-head">
                        <th>{t("OrderNumber")}</th>
                        <th>{t("Date")}</th>
                        <th>{t("Amount")}</th>
                        <th>{t("PaymentStatus")}</th>
                        <th>{t("PaymentMethod")}</th>
                        <th>{t("Option")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.data?.map((order, i) => (
                        <tr key={i}>
                          <td>
                            <span className="fw-bolder">#{order.order_number}</span>
                          </td>
                          <td>{showMonthWiseDateAndTime(order?.created_at)}</td>
                          <td>{convertCurrency(order?.total)} </td>
                          <td>
                            <div className={`${order.payment_status.toLowerCase() === "pending" ? "badge bg-pending" : order.payment_status.toLowerCase() === "completed" ? "badge bg-completed" : "badge bg-cancelled custom-badge rounded-0"} custom-badge rounded-0`}>
                              <span>{Capitalize(order?.payment_status)}</span>
                            </div>
                          </td>

                          <td>{order.payment_method.toUpperCase()}</td>
                          <td>
                            <Link href={`/account/order/details/${order.order_number}`}>
                              <RiEyeLine />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
            <div className="product-pagination">
              <div className="theme-pagination-block">
                <nav>
                  <Pagination current_page={data?.current_page} total={data?.total} per_page={data?.per_page} setPage={setPage} />
                </nav>
              </div>
            </div>
          </>
        ) : (
          <NoDataFound customClass="no-data-added" imageUrl={`/assets/svg/empty-items.svg`} title="NoOrdersFound" description="NoOrdersHaveBeenMadeYet" height="300" width="300" />
        )}
      </CardBody>
    </Card>
    </>
  );
};

export default MyOrders;
