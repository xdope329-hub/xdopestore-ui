import Avatar from "@/components/widgets/Avatar";
import { placeHolderImage } from "@/components/widgets/Placeholder";
import SettingContext from "@/context/settingContext";
import { useContext, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, Table, Tooltip } from "reactstrap";
import RefundModal from "./RefundModal";
import { Href } from "@/utils/constants";
import Btn from "@/elements/buttons/Btn";
import { CapitalizeMultiple } from "@/utils/customFunctions/Capitalize";

const DetailsTable = ({ data }) => {
  const { t } = useTranslation("common");
  const { convertCurrency } = useContext(SettingContext);
  const [modal, setModal] = useState("");
  const [storeData, setStoreData] = useState("");
  const onModalOpen = (product) => {
    setStoreData(product);
    setModal(product?.id);
  };
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const toggle = (index) =>
    setTooltipOpen((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));

  const ref = useRef(null);
  return (
    <>
      <Card className="dashboard-table">
        <CardBody className="p-0">
          <div className="wallet-table">
            <div className="tracking-wrapper table-responsive">
              <Table className="product-table order-table">
                <thead>
                  <tr>
                    <th scope="col">{t("Image")}</th>
                    <th scope="col">{t("Name")}</th>
                    <th scope="col">{t("Price")}</th>
                    <th scope="col">{t("Quantity")}</th>
                    <th scope="col">{t("Subtotal")}</th>
                    <th scope="col">{t("RefundStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.products?.length > 0
                    ? data?.products?.map((product, i) => (
                        <tr key={i}>
                          <td className="product-image">
                            <Avatar data={product?.pivot?.variation && product?.pivot?.variation?.variation_image ? product?.pivot?.variation?.variation_image : product?.product_thumbnail ? product?.product_thumbnail : placeHolderImage} name={product?.pivot?.variation ? product?.pivot?.variation?.name : product?.name} customImageClass="img-fluid" />
                          </td>
                          <td>
                            <h6>{product?.pivot?.variation ? product?.pivot?.variation?.name : product?.name}</h6>
                            {/* Variante comprada (Color, Talla…) y SKU, guardados en el pedido. */}
                            {product?.variation_attributes?.length > 0 && (
                              <div className="text-content" style={{ fontSize: "13px" }}>
                                {product.variation_attributes.map((attr, i) => (
                                  <span key={i} className="me-2"><strong>{attr?.name}:</strong> {attr?.value}</span>
                                ))}
                              </div>
                            )}
                            {product?.sku && <div className="text-content" style={{ fontSize: "13px" }}><strong>SKU:</strong> {product.sku}</div>}
                          </td>
                          <td>
                            <h6>{convertCurrency(product?.pivot?.single_price)}</h6>
                          </td>
                          <td>
                            <h6>{product?.pivot?.quantity}</h6>
                          </td>
                          <td>
                            <h6>{convertCurrency(product?.pivot?.subtotal)}</h6>
                          </td>
                          <td>
                            {product?.is_return === 1 && ["completed", "paid"].includes(String(data?.payment_status || "").toLowerCase()) && data.order_status && data.order_status.slug == "delivered" && !product?.pivot?.refund_status ? (
                              <a className="btn btn-solid" href={Href} onClick={() => onModalOpen(product)}>
                                {t("Refund")}
                              </a>
                            ) : product.is_return === 0 ? (
                              <span>{t("NonRefundable")}</span>
                            ) : product?.pivot?.refund_status ? (
                              <div className={`status-${product?.pivot?.refund_status?.toLowerCase()}`}>
                                <span>{CapitalizeMultiple(product?.pivot?.refund_status)}</span>
                              </div>
                            ) : (
                              <>
                              <div className="black-tooltip" id={"refunded" + i}>
                                {!product?.pivot?.refund_status && <Btn className="btn-solid disabled"> {t("Refund")}</Btn>}
                              </div>
                                <Tooltip isOpen={tooltipOpen[i]} target={"refunded" + i} toggle={() => toggle(i)}>
                                {t("EnableAfterDelivery")}
                              </Tooltip>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </Table>
            </div>
          </div>
        </CardBody>
      </Card>
      <RefundModal modal={modal} setModal={setModal} storeData={storeData} />
    </>
  );
};

export default DetailsTable;
