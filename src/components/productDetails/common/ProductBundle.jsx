import Avatar from "@/components/widgets/Avatar";
import { useAnalytics } from "@/components/analytics/GoogleAnalytics";
import { placeHolderImage } from "@/components/widgets/Placeholder";
import CartContext from "@/context/cartContext";
import ProductIdsContext from "@/context/productIdsContext";
import SettingContext from "@/context/settingContext";
import Btn from "@/elements/buttons/Btn";
import { AddToCartAPI } from "@/utils/axiosUtils/API";
import useCreate from "@/utils/hooks/useCreate";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import i18next from "i18next";
import Cookies from "js-cookie";
import Link from "next/link";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Col, Row } from "reactstrap";
import VariantDropDown from "./VariantDropDown";

// FrequentlyBoughtTogether tiene dos modos:
// 1) Producto normal: lista los cross_sell_products del catálogo y arma un
//    total con la suma de sale_price de las variantes/productos elegidos.
// 2) Producto tipo bundle (type === 'bundle'): lista los bundle_items del
//    producto padre, restringe las variantes a las permitidas por el admin
//    y cobra el precio FIJO del bundle (product.sale_price). Se agrega al
//    carrito como una sola línea de bundle vía CartContext.addBundleToCart.
const ProductBundle = ({ productState, setProductState }) => {
  const analytics = useAnalytics();
  const { t } = useTranslation("common");
  const isLogin = Cookies.get("uat");
  const { cartProducts, setCartProducts, addBundleToCart } = useContext(CartContext);
  const { convertCurrency } = useContext(SettingContext);
  const { filteredProduct } = useContext(ProductIdsContext);

  const parent = productState?.product;
  const isBundle = parent?.type === "bundle";
  const bundlePrice = Number(parent?.sale_price ?? parent?.price ?? 0);

  const { data: addData, mutate, isLoading } = useCreate(AddToCartAPI, false, false, "No", (response, variables) => {
    if (response?.ok) analytics?.ecommerce("add_to_cart", [variables]);
  });

  // Items en pantalla (con producto poblado y variantes permitidas).
  const items = useMemo(() => {
    if (isBundle) {
      return (parent?.bundle_items || [])
        .filter((it) => it && it.product_id && typeof it.product_id === "object")
        .map((it) => ({ product: it.product_id, allowedIds: (it.allowed_variation_ids || []).map(String) }));
    }
    const ids = (parent?.cross_sell_products || []).map(String);
    return (filteredProduct || [])
      .filter((p) => p && ids.includes(String(p.id)))
      .map((p) => ({ product: p, allowedIds: [] }));
  }, [isBundle, parent, filteredProduct]);

  // Bundle: en modo bundle cada item forma parte de la compra por defecto.
  // Cross-sell: el cliente elige con el checkbox qué agregar.
  const [checkedIds, setCheckedIds] = useState([]);
  useEffect(() => {
    if (isBundle) setCheckedIds(items.map((it) => String(it.product.id)));
  }, [isBundle, items]);
  const [variationByProduct, setVariationByProduct] = useState({});

  const onProductCheck = (event) => {
    event.stopPropagation();
    const productId = String(event?.target?.value);
    if (event.target.checked) setCheckedIds((prev) => Array.from(new Set([...prev, productId])));
    else setCheckedIds((prev) => prev.filter((id) => id !== productId));
  };
  const onVariantSelected = (productId, raw) => {
    let variation = raw;
    try { if (typeof raw === "string") variation = JSON.parse(raw); } catch (_) {}
    setVariationByProduct((prev) => ({ ...prev, [String(productId)]: variation || null }));
  };

  // ¿Faltan variantes por elegir en los items marcados?
  const missingVariant = items.some((it) => {
    const pid = String(it.product.id);
    if (!checkedIds.includes(pid)) return false;
    const hasVariants = Array.isArray(it.product.variations) && it.product.variations.length > 0;
    return hasVariants && !variationByProduct[pid];
  });

  // Total mostrado: bundle -> precio fijo; cross-sell -> suma de precios
  // (usa el precio de la variante elegida cuando aplica).
  const total = useMemo(() => {
    if (!checkedIds.length) return 0;
    if (isBundle) return bundlePrice;
    return items.reduce((sum, it) => {
      const pid = String(it.product.id);
      if (!checkedIds.includes(pid)) return sum;
      const variation = variationByProduct[pid];
      const unit = Number(variation?.sale_price ?? variation?.price ?? it.product?.sale_price ?? it.product?.price ?? 0);
      return sum + unit;
    }, 0);
  }, [items, checkedIds, variationByProduct, isBundle, bundlePrice]);

  const canBuy = checkedIds.length > 0 && !missingVariant;

  const addBundle = () => {
    if (!canBuy) {
      ToastNotification("error", i18next.t("Elige las variantes de cada producto del bundle"));
      return;
    }
    if (isBundle) {
      const selections = items.map((it) => {
        const pid = String(it.product.id);
        const variation = variationByProduct[pid];
        return { product_id: pid, variation_id: variation ? String(variation.id || variation._id) : null };
      });
      addBundleToCart?.(parent, selections);
      return;
    }
    // Cross-sell: agrega cada producto marcado con su variante.
    const cloneCart = [...cartProducts];
    items.forEach((it) => {
      const pid = String(it.product.id);
      if (!checkedIds.includes(pid)) return;
      const variation = variationByProduct[pid] || null;
      const unit = Number(variation?.sale_price ?? variation?.price ?? it.product?.sale_price ?? it.product?.price ?? 0);
      const variationId = variation ? String(variation.id || variation._id) : null;
      const index = cloneCart.findIndex((c) => String(c?.product_id) === pid && String(c?.variation_id || "") === String(variationId || ""));
      if (index !== -1) {
        const stockQty = variation?.quantity ?? cloneCart[index]?.product?.quantity;
        if (stockQty < cloneCart[index]?.quantity + 1) {
          ToastNotification("error", i18next.t("StockLimitMessage", { qty: stockQty }));
          return;
        }
        const next = { ...cloneCart[index], quantity: cloneCart[index].quantity + 1, sub_total: (cloneCart[index].quantity + 1) * unit };
        setCartProducts((prev) => prev.map((c, i) => (i === index ? next : c)));
      } else {
        const params = { product: it.product, product_id: it.product.id, variation, variation_id: variationId, quantity: 1, sub_total: unit };
        setCartProducts((prev) => [...prev, params]);
      }
      const obj = { product: it.product, product_id: it.product.id, quantity: 1, sub_total: unit, variation_id: variationId };
      if (isLogin) mutate(obj); else analytics?.ecommerce("add_to_cart", [obj]);
    });
  };

  if (!items.length) return null;

  return (
    <div className="bordered-box pt-2">
      <h4 className="sub-title">{t(isBundle ? "Contenido del bundle" : "FrequentlyBoughtTogether")}</h4>
      <div className="bundle">
        <Row className="bundle-image-box g-3">
          {items.map((it, i) => {
            const pid = String(it.product.id);
            const hasVariants = Array.isArray(it.product.variations) && it.product.variations.length > 0;
            const filteredProductForVariants = it.allowedIds.length
              ? { ...it.product, variations: (it.product.variations || []).filter((v) => it.allowedIds.includes(String(v.id || v._id))) }
              : it.product;
            const variation = variationByProduct[pid];
            const displayPrice = Number(variation?.sale_price ?? variation?.price ?? it.product?.sale_price ?? it.product?.price ?? 0);
            const checked = checkedIds.includes(pid);
            return (
              <Col xl="6" lg="12" sm="6" key={i}>
                <div className="bundle-box">
                  {!isBundle && (
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input checkbox_animated" id={`crosssell-${pid}`} value={pid} checked={checked} onChange={onProductCheck} />
                    </div>
                  )}
                  <div className="bundle-image">
                    <Link href={`/product/${it.product?.slug || ""}`}>
                      <Avatar customClass={"img-fluid"} data={it.product?.product_thumbnail} name={it.product?.name} placeHolder={placeHolderImage} height={70} width={70} />
                    </Link>
                  </div>
                  <div className="bundle-content">
                    <div>
                      <Link href={`/product/${it.product?.slug || ""}`}>
                        <h4>{it.product?.name}</h4>
                      </Link>
                    </div>
                    {hasVariants && (it.product.attributes?.length > 0 || isBundle) ? (
                      <VariantDropDown product={filteredProductForVariants} selectedOption={(v) => onVariantSelected(pid, v)} />
                    ) : null}
                    {!isBundle && <h3>{convertCurrency(displayPrice)}</h3>}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
        <h4 className="bundle-title">{t(isBundle ? "Precio del bundle:" : "ProductSelectedFor")}</h4>
        <h4 className="theme-color total-price">{convertCurrency(total)}</h4>
        <Btn loading={isLoading} size="xs" disabled={!canBuy} className=" btn-solid bundle-btn mt-0 mt-sm-2 " onClick={addBundle}>
          {t("BuyThisBundle")}
        </Btn>
      </div>
    </div>
  );
};

export default ProductBundle;
