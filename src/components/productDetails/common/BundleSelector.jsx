"use client";
import Avatar from "@/components/widgets/Avatar";
import { placeHolderImage } from "@/components/widgets/Placeholder";
import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import Btn from "@/elements/buttons/Btn";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import Link from "next/link";
import { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiShoppingCartLine } from "react-icons/ri";
import { Col, Row } from "reactstrap";

// Selector de bundle: para cada item del bundle muestra el producto hijo y
// un select con sus variantes permitidas (o todas si el admin no restringió).
// Al agregar al carrito envía la composición completa; el precio fijo del
// bundle proviene del propio producto (sale_price / price).
const BundleSelector = ({ productState }) => {
  const { t } = useTranslation("common");
  const product = productState?.product;
  const items = useMemo(() => (Array.isArray(product?.bundle_items) ? product.bundle_items : []), [product]);
  const { addBundleToCart } = useContext(CartContext);
  const { convertCurrency } = useContext(SettingContext);
  const { setCartCanvas } = useContext(ThemeOptionContext);

  // Selección inicial: primera variante permitida (o primera del catálogo)
  // para no obligar al cliente a abrir cada select cuando solo hay una opción.
  const [selections, setSelections] = useState(() =>
    items.map((it) => {
      const child = it.product_id;
      const variations = Array.isArray(child?.variations) ? child.variations : [];
      const allowed = Array.isArray(it.allowed_variation_ids) ? it.allowed_variation_ids.map(String) : [];
      const options = allowed.length ? variations.filter((v) => allowed.includes(String(v.id || v._id))) : variations;
      return {
        product_id: child?.id || child?._id,
        variation_id: options[0] ? String(options[0].id || options[0]._id) : null,
        hasVariants: options.length > 0,
      };
    })
  );

  const updateVariation = (idx, variationId) => {
    setSelections((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], variation_id: variationId || null };
      return next;
    });
  };

  const price = Number(product?.sale_price ?? product?.price) || 0;
  const canAdd = selections.every((s) => (s.hasVariants ? !!s.variation_id : true));

  const onAdd = () => {
    if (!canAdd) {
      ToastNotification("error", t("Elige las variantes de cada producto del bundle"));
      return;
    }
    addBundleToCart(product, selections.map((s) => ({ product_id: s.product_id, variation_id: s.variation_id })));
    setCartCanvas?.(true);
  };

  if (!items.length) return null;

  return (
    <div className="bundle-selector bordered-box pt-3 mt-3">
      <h4 className="sub-title">{t("Contenido del bundle")}</h4>
      <Row className="g-3">
        {items.map((it, idx) => {
          const child = it.product_id;
          const variations = Array.isArray(child?.variations) ? child.variations : [];
          const allowed = Array.isArray(it.allowed_variation_ids) ? it.allowed_variation_ids.map(String) : [];
          const options = allowed.length ? variations.filter((v) => allowed.includes(String(v.id || v._id))) : variations;
          const sel = selections[idx];
          return (
            <Col xl="6" lg="12" sm="6" key={String(child?.id || idx)}>
              <div className="bundle-box d-flex gap-2 align-items-center p-2 border rounded">
                <div className="bundle-image">
                  <Link href={`/product/${child?.slug || ""}`}>
                    <Avatar customClass="img-fluid" data={child?.product_thumbnail || child?.product_thumbnail_id} name={child?.name} placeHolder={placeHolderImage} height={70} width={70} />
                  </Link>
                </div>
                <div className="flex-grow-1">
                  <Link href={`/product/${child?.slug || ""}`}>
                    <h5 className="mb-1">{child?.name}</h5>
                  </Link>
                  {options.length > 0 ? (
                    <select
                      className="form-select form-select-sm"
                      value={sel?.variation_id || ""}
                      onChange={(e) => updateVariation(idx, e.target.value)}
                    >
                      {options.map((v) => {
                        const vid = String(v.id || v._id);
                        const label = v.name || (v.attribute_values || []).map((av) => av.value).join(" / ") || vid;
                        return <option key={vid} value={vid}>{label}</option>;
                      })}
                    </select>
                  ) : (
                    <span className="text-muted small">{t("Sin variantes")}</span>
                  )}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
      <div className="d-flex justify-content-between align-items-center mt-3">
        <h4 className="theme-color mb-0">{t("Precio del bundle")}: {convertCurrency(price)}</h4>
        <Btn color="transparent" className="btn-animation btn-solid hover-solid" onClick={onAdd} disabled={!canAdd}>
          <RiShoppingCartLine className="me-2" /> {t("AddToCart")}
        </Btn>
      </div>
    </div>
  );
};

export default BundleSelector;
