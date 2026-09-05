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
import { refundButtonState } from "./refundRules";

// `readOnly`: seguimiento público sin sesión → sin columna ni modal de reembolso.
const DetailsTable = ({ data, refetch, readOnly = false }) => {
  const { t } = useTranslation("common");
  const { convertCurrency } = useContext(SettingContext);
  const [modal, setModal] = useState("");
  const [storeData, setStoreData] = useState("");
  const onModalOpen = (product) => {
    setStoreData(product);
    // Las líneas del pedido no tienen `id` propio: con `product.id` el modal
    // recibía undefined y nunca se abría.
    setModal(product?.product_id || product?.id || "refund");
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
                    {!readOnly && <th scope="col">{t("RefundStatus")}</th>}
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
                          {!readOnly && (
                          <td>
                            {(() => {
                              // Regla en refundRules.js: antes se comparaba `is_return === 1`
                              // y el API mandaba `true`, así que el botón nunca se habilitaba.
                              const refund = refundButtonState({ product, order: data });
                              if (refund.state === "refund") {
                                return (
                                  <a className="btn btn-solid" href={Href} onClick={() => onModalOpen(product)}>
                                    {t("Refund")}
                                  </a>
                                );
                              }
                              if (refund.state === "non_refundable") return <span>{t("NonRefundable")}</span>;
                              if (refund.state === "requested") {
                                return (
                                  <div className={`status-${refund.status}`}>
                                    <span>{t(`Refund_${refund.status}`, { defaultValue: CapitalizeMultiple(refund.status) })}</span>
                                  </div>
                                );
                              }
                              return (
                                <>
                                  <div className="black-tooltip" id={"refunded" + i}>
                                    <Btn className="btn-solid disabled"> {t("Refund")}</Btn>
                                  </div>
                                  <Tooltip isOpen={tooltipOpen[i]} target={"refunded" + i} toggle={() => toggle(i)}>
                                    {t("EnableAfterDelivery")}
                                  </Tooltip>
                                </>
                              );
                            })()}
                          </td>
                          )}
                        </tr>
                      ))
                    : null}
                </tbody>
              </Table>
            </div>
          </div>
        </CardBody>
      </Card>
      {!readOnly && <RefundModal modal={modal} setModal={setModal} storeData={storeData} orderId={data?.id} onSubmitted={refetch} />}
    </>
  );
};

export default DetailsTable;
