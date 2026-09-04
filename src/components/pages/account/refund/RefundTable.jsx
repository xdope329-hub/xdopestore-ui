import NoDataFound from "@/components/widgets/NoDataFound";
import Pagination from "@/components/widgets/Pagination";
import Loader from "@/layout/loader";
import request from "@/utils/axiosUtils";
import { RefundAPI } from "@/utils/axiosUtils/API";
import Capitalize from "@/utils/customFunctions/Capitalize";
import { showMonthWiseDate } from "@/utils/customFunctions/DateFormat";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, Table } from "reactstrap";
import AccountHeading from "../common/AccountHeading";

const RefundTable = () => {
  const { t } = useTranslation("common");
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useFetchQuery([RefundAPI], () => request({ url: RefundAPI, params: { page, paginate: 10 } }), {
    enabled: false,
    refetchOnWindowFocus: false,
    select: (res) => res?.data,
  });
  useEffect(() => {
    refetch();
  }, [page]);

  if (isLoading)
    return (
      <div className="box-loader">
        <Loader classes={"blur-bg"} />
      </div>
    );
  return (
    <Card className="dashboard-table mt-0">
      <CardBody className="p-0">
        <AccountHeading title="Refund" classes={"top-sec"} />
        {data?.data?.length > 0 ? (
          <>
            <div className="total-box mt-0">
              <div className="wallet-table mt-0">
                <div className="table-responsive">
                  <Table className="table cart-table order-table">
                    <thead>
                      <tr>
                        <th>{t("Order")}</th>
                        <th>{t("Status")}</th>
                        <th>{t("Reason")}</th>
                        <th>{t("CreatedAt")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.data?.map((refund, i) => (
                        <tr key={i}>
                          <td>
                            <span className="fw-bolder">#{refund?.order?.order_number}</span>
                          </td>
                          <td>
                            <div className={`${refund.status.toLowerCase() === "pending" ? "badge bg-pending" : ["completed", "approved"].includes(refund.status.toLowerCase()) ? "badge bg-completed" : "badge bg-cancelled"} custom-badge rounded-pill`}>
                              <span>{t(`Refund_${refund.status.toLowerCase()}`, { defaultValue: Capitalize(refund.status) })}</span>
                            </div>
                          </td>

                          <td>{refund?.reason}</td>
                          <td>{showMonthWiseDate(refund?.created_at)}</td>
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
          <NoDataFound customClass="no-data-added" imageUrl={'/assets/images/svg/empty-items.svg'} title="NoRefundsFound" description="YouHaveNoRefundsProcessedYet" height="300" width="300" />
        )}
      </CardBody>
    </Card>
  );
};

export default RefundTable;
