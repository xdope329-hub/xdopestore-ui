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
import { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Col, Row } from "reactstrap";
import VariantDropDown from "./VariantDropDown";
import { selectedBundleVariation, variationId, variationLabel } from "./variantOptions";
import { lineUnitPrice, mergeCartLines, packageLines, packageMissingVariant, packageTotal } from "./crossSellPackage";

// FrequentlyBoughtTogether tiene dos modos:
// 1) Producto normal ("Frecuentemente comprados juntos"): el paquete es el
//    producto de la ficha, con la variante elegida en la página, más los
//    cross_sell_products marcados. El total suma todas esas líneas y al
//    comprar cada una entra al carrito con su propio precio, así el checkout
//    cobra el paquete completo (reglas puras en crossSellPackage.js).
// 2) Producto tipo bundle (type === 'bundle'): lista los bundle_items del
//    producto padre, restringe las variantes a las permitidas por el admin
//    y cobra el precio FIJO del bundle (product.sale_price). Se agrega al
//    carrito como una sola línea de bundle vía CartContext.addBundleToCart.
const ProductBundleContent = ({ productState, compact = false }) => {
  const analytics = useAnalytics();
  const { t } = useTranslation("common");
  const isLogin = Cookies.get("uat");
  const { cartProducts, setCartProducts, addBundleToCart, refetch } = useContext(CartContext);
  const { convertCurrency, capacityReached } = useContext(SettingContext);
  const { filteredProduct } = useContext(ProductIdsContext);

  const parent = productState?.product;
  const isBundle = parent?.type === "bundle";
  const bundlePrice = Number(parent?.sale_price ?? parent?.price ?? 0);
  // Variante del producto de la ficha: la elige el selector de atributos de la página.
  const parentVariation = productState?.selectedVariation || null;
  const parentHasVariants = Array.isArray(parent?.variations) && parent.variations.length > 0;

  const { mutateAsync } = useCreate(AddToCartAPI, false, false, "No");
  const [busy, setBusy] = useState(false);

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
  const [checkedProductIds, setCheckedIds] = useState([]);
  const checkedIds = isBundle ? items.map((it) => String(it.product.id))
    : checkedProductIds.filter((id) => items.some((it) => String(it.product.id) === id));
  const [variationByProduct, setVariationByProduct] = useState({});
  const selectedVariations = Object.fromEntries(items.map((it) => {
    const pid = String(it.product.id);
    return [pid, selectedBundleVariation(it, variationByProduct[pid])];
  }));

  const onProductCheck = (event) => {
    event.stopPropagation();
    const productId = String(event?.target?.value);
    if (event.target.checked) setCheckedIds((prev) => Array.from(new Set([...prev, productId])));
    else setCheckedIds((prev) => prev.filter((id) => id !== productId));
  };
  const onVariantSelected = (productId, variation) => {
    setVariationByProduct((prev) => ({ ...prev, [String(productId)]: variationId(variation) }));
  };

  // Paquete (cross-sell): la ficha primero y luego cada relacionado marcado.
  const packageInput = { parent, parentVariation, items, checkedIds, selectedVariations };
  const lines = isBundle ? [] : packageLines(packageInput);

  // ¿Faltan variantes por elegir? Bundle: en cada item. Paquete: en la ficha
  // o en algún relacionado marcado.
  const missingVariant = isBundle
    ? items.some((it) => Array.isArray(it.product.variations) && it.product.variations.length > 0 && !selectedVariations[String(it.product.id)])
    : packageMissingVariant(packageInput);

  // Total mostrado: bundle -> precio fijo; paquete -> ficha + marcados.
  const total = isBundle ? (checkedIds.length ? bundlePrice : 0) : packageTotal(lines);

  const canBuy = checkedIds.length > 0 && !missingVariant;

  const addBundle = async () => {
    if (!canBuy) {
      ToastNotification("error", i18next.t(isBundle ? "Elige las variantes de cada producto del bundle" : "SelectVariantFirst"));
      return;
    }
    // Sin cupo hoy la tienda vende solo por WhatsApp (misma regla que handleIncDec).
    if (capacityReached) {
      ToastNotification("error", i18next.t("CapacityReachedToast"));
      return;
    }
    if (isBundle) {
      const selections = items.map((it) => {
        const pid = String(it.product.id);
        const variation = selectedVariations[pid];
        return { product_id: pid, variation_id: variation ? String(variation.id || variation._id) : null };
      });
      addBundleToCart?.(parent, selections);
      return;
    }
    // Paquete: la ficha y cada relacionado marcado son líneas independientes
    // (una línea igual ya en el carrito suma cantidad). Si alguna supera el
    // stock no se agrega nada.
    const { stockError } = mergeCartLines(cartProducts, lines);
    if (stockError) {
      ToastNotification("error", i18next.t("StockLimitMessage", { qty: stockError.qty }));
      return;
    }
    setCartProducts((prev) => mergeCartLines(prev, lines).cart);
    if (!isLogin) {
      analytics?.ecommerce("add_to_cart", lines);
      ToastNotification("success", i18next.t("AddedToCart"));
      return;
    }
    // Con sesión el carrito vive en el servidor: una petición por línea, en
    // orden; la última respuesta (carrito completo) reemplaza el estado local.
    setBusy(true);
    try {
      const added = [];
      let serverCart = null;
      let failure = null;
      for (const line of lines) {
        const response = await mutateAsync({ product_id: line.product_id, variation_id: line.variation_id, quantity: line.quantity })
          .catch((error) => ({ ok: false, data: error?.response?.data }));
        if (!response?.ok) {
          failure = response;
          break;
        }
        added.push(line);
        if (Array.isArray(response?.data?.items)) serverCart = response.data.items;
      }
      if (serverCart) setCartProducts(serverCart);
      else if (failure) refetch?.();
      if (added.length) analytics?.ecommerce("add_to_cart", added);
      if (failure) ToastNotification("error", failure?.data?.message || i18next.t("PackageAddFailed"));
      else ToastNotification("success", i18next.t("AddedToCart"));
    } finally {
      setBusy(false);
    }
  };

  if (!items.length) return null;

  const colProps = { xl: compact ? 12 : 6, lg: "12", sm: compact ? 12 : 6 };
  const productLink = (product, children) => <Link href={`/product/${product?.slug || ""}`}>{children}</Link>;
  const card = ({ product, checkbox = null, label = null, variant = null, price = null, linked = true }) => {
    const image = <Avatar customClass={"img-fluid"} data={product?.product_thumbnail} name={product?.name} placeHolder={placeHolderImage} height={70} width={70} />;
    const title = <h4>{product?.name}</h4>;
    return (
      <div className="bundle-box">
        {checkbox && <div className="form-check">{checkbox}</div>}
        <div className="bundle-image">{linked ? productLink(product, image) : image}</div>
        <div className="bundle-content">
          {label && <span className="text-content d-block">{label}</span>}
          <div>{linked ? productLink(product, title) : title}</div>
          {variant}
          {price !== null && <h3>{convertCurrency(price)}</h3>}
        </div>
      </div>
    );
  };

  return (
    <div className="bordered-box pt-2">
      <h4 className="sub-title">{t(isBundle ? "Contenido del bundle" : "FrequentlyBoughtTogether")}</h4>
      <div className="bundle">
        <Row className="bundle-image-box g-3">
          {!isBundle && (
            <Col {...colProps}>
              {card({
                product: parent,
                linked: false,
                label: t("ThisProduct"),
                checkbox: <input type="checkbox" className="form-check-input checkbox_animated" id="crosssell-this-product" checked disabled readOnly aria-label={t("ThisProduct")} />,
                variant: parentHasVariants ? <p className="text-content mb-0">{parentVariation ? variationLabel(parentVariation) : t("SelectVariantFirst")}</p> : null,
                price: lineUnitPrice(parent, parentVariation),
              })}
            </Col>
          )}
          {items.map((it) => {
            const pid = String(it.product.id);
            const hasVariants = Array.isArray(it.product.variations) && it.product.variations.length > 0;
            const filteredProductForVariants = it.allowedIds.length
              ? { ...it.product, variations: (it.product.variations || []).filter((v) => it.allowedIds.includes(String(v.id || v._id))) }
              : it.product;
            const variation = selectedVariations[pid];
            return (
              <Col {...colProps} key={pid}>
                {card({
                  product: it.product,
                  checkbox: isBundle ? null : <input type="checkbox" className="form-check-input checkbox_animated" id={`crosssell-${pid}`} value={pid} checked={checkedIds.includes(pid)} onChange={onProductCheck} />,
                  variant: hasVariants ? <VariantDropDown product={filteredProductForVariants} value={variationId(variation)} selectedOption={(v) => onVariantSelected(pid, v)} /> : null,
                  price: isBundle ? null : lineUnitPrice(it.product, variation),
                })}
              </Col>
            );
          })}
        </Row>
        <h4 className="bundle-title">{t(isBundle ? "Precio del bundle:" : "ProductSelectedFor")}</h4>
        <h4 className="theme-color total-price">{convertCurrency(total)}</h4>
        <Btn loading={busy} size="xs" disabled={!canBuy || busy} className=" btn-solid bundle-btn mt-0 mt-sm-2 " onClick={addBundle}>
          {t("BuyThisBundle")}
        </Btn>
      </div>
    </div>
  );
};

// Navigating to another product must never reuse the previous size choices.
const ProductBundle = (props) => <ProductBundleContent key={props.productState?.product?.id || props.productState?.product?._id} {...props} />;

export default ProductBundle;
