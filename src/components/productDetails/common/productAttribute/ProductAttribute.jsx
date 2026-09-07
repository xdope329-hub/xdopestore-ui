import CartContext from "@/context/cartContext";
import { useContext, useEffect, useState } from "react";
import ColorAttribute from "./ColorAttribute";
import DropdownAttribute from "./DropdownAttribute";
import ImageOtherAttributes from "./Image&OtherAttributes";
import RadioAttribute from "./RadioAttribute";
import { pickDefaultVariation } from "./defaultVariation";

const ProductAttribute = ({ productState, setProductState, stickyAddToCart, noHoverEffect }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [soldOutAttributesIds, setSoldOutAttributesIds] = useState([]);
  const { cartProducts } = useContext(CartContext);
  const [cartItem, setCartItem] = useState();
  const [initial, setInitial] = useState();

  const checkVariantAvailability = (productObj) => {
    productObj?.variations?.forEach((variation) => {
      if (!variation.status) {
        variation?.attribute_values?.forEach((attribute_value) => {
          if (productState?.statusIds?.indexOf(attribute_value?.id) === -1) {
            setProductState((prev) => {
              return {
                ...prev,
                statusIds: Array.from(new Set([...prev.statusIds, attribute_value?.id])),
              };
            });
          }
        });
      }
      variation?.attribute_values?.filter((attribute_value) => {
        if (productState.attributeValues?.indexOf(attribute_value?.id) === -1) {
          setProductState((prev) => {
            return {
              ...prev,
              attributeValues: Array.from(new Set([...prev.attributeValues, attribute_value?.id])),
            };
          });
        }
      });
    });

    // Variación predeterminada: la vendible más barata, la misma que da el
    // precio "desde" y el descuento de la tarjeta (defaultVariation.js).
    // Antes era la primera con stock, y la ficha abría con un descuento
    // distinto al que anunciaba la tarjeta.
    const firstAvailableVariant = pickDefaultVariation(productObj?.variations);

    if (firstAvailableVariant) {
      (firstAvailableVariant.attribute_values || []).forEach((attribute_val) => {
        // Enrich with attribute_id from the product's attributes definition,
        // since variation.attribute_values don't store attribute_id directly.
        const attrDef = productObj?.attributes?.find((attr) =>
          attr.attribute_values?.some((av) => String(av.id) === String(attribute_val.id || attribute_val._id))
        );
        const enriched = {
          ...attribute_val,
          attribute_id: attrDef?.id ?? attribute_val.attribute_id ?? attribute_val.name,
        };
        setVariant(productObj?.variations, enriched, "default");
      });
    }

    // Set Variation Image
    if (productObj?.attributes?.length) {
      productObj.variations?.forEach((variation) => {
        let attrValues = variation?.attribute_values?.map((attribute_value) => attribute_value?.id);
        productObj.attributes.forEach((attribute) => {
          if (attribute.style == "image") {
            attribute.attribute_values?.forEach((attribute_value) => {
              if (productState?.attributeValues?.includes(attribute_value.id)) {
                if (attrValues?.includes(attribute_value.id)) {
                  attribute_value.variation_image = variation.variation_image;
                }
              }
            });
          }
        });
      });
    }
  };

  const checkStockAvailable = () => {
    if (productState?.selectedVariation) {
      setProductState((prevState) => {
        const tempSelectedVariation = { ...prevState.selectedVariation };
        tempSelectedVariation.stock_status = tempSelectedVariation.quantity < prevState.productQty ? "out_of_stock" : "in_stock";
        return {
          ...prevState,
          selectedVariation: tempSelectedVariation,
        };
      });
    } else {
      setProductState((prevState) => {
        const tempProduct = { ...prevState.product };
        tempProduct.stock_status = tempProduct.quantity < prevState.productQty ? "out_of_stock" : "in_stock";
        return {
          ...prevState,
          product: tempProduct,
        };
      });
    }
  };

  useEffect(() => {
    let timer = setTimeout(() => {
      checkVariantAvailability(productState?.product);
    }, 0);
    return () => clearTimeout(timer);
  }, [productState?.attributeValues, cartItem, selectedOptions]);

  useEffect(() => {
    productState?.product && setCartItem(cartProducts?.find((elem) => elem?.product?.id == productState?.product?.id));
  }, [cartProducts, productState]);

  const setVariant = (variations, value, action = "click") => {
    let tempVal;
    if (value?.id != initial?.id && action == "hover") {
      tempVal = value;
    } else if (action == "click" || action == "default") {
      setInitial(value);
      tempVal = value;
    } else {
      tempVal = initial;
    }

    let tempSelected = selectedOptions;
    let tempSoldOutAttributesIds = [];
    setSoldOutAttributesIds((prev) => tempSoldOutAttributesIds);

    const index = tempSelected?.findIndex((item) => String(item.attribute_id) === String(tempVal?.attribute_id));
    if (index === -1) {
      tempSelected.push({ id: tempVal?.id, attribute_id: tempVal?.attribute_id });
      setSelectedOptions(tempSelected);
    } else {
      tempSelected[index].id = tempVal?.id;
      setSelectedOptions(tempSelected);
    }

    variations?.forEach((variation) => {
      let attrValues = variation?.attribute_values?.map((attribute_value) => attribute_value?.id);
      let tempVariantIds = tempSelected?.map((variants) => variants?.id);
      setProductState((prev) => {
        return { ...prev, variantIds: tempVariantIds };
      });
      let doValuesMatch = attrValues.length === tempSelected.length && attrValues.every((value) => tempVariantIds.includes(value));
      if (doValuesMatch) {
        setProductState((prev) => {
          return { ...prev, selectedVariation: variation, variation_id: variation?.id, variation: variation };
        });
        checkStockAvailable();
      }

      if (variation?.stock_status == "out_of_stock") {
        variation?.attribute_values.filter((attr_value) => {
          if (attrValues.some((value) => tempVariantIds.includes(value))) {
            if (attrValues.every((value) => tempVariantIds.includes(value))) {
              tempSoldOutAttributesIds.push(attr_value.id);
              setSoldOutAttributesIds((prev) => [...tempSoldOutAttributesIds]);
            } else if (!tempVariantIds.includes(attr_value.id)) {
              tempSoldOutAttributesIds.push(attr_value.id);
              setSoldOutAttributesIds((prev) => [...tempSoldOutAttributesIds]);
            }
          } else if (attrValues.length == 1 && attrValues.includes(attr_value.id)) {
            tempSoldOutAttributesIds.push(attr_value.id);
            setSoldOutAttributesIds((prev) => [...tempSoldOutAttributesIds]);
          }
        });
      }
    });

    // Set Attribute Value
    productState?.product?.attributes?.filter((attribute) => {
      attribute?.attribute_values?.filter((a_value) => {
        if (a_value.id == tempVal?.id) {
          attribute.selected_value = a_value.value;
        }
      });
    });
  };
  return (
    <>
      {productState?.product?.attributes?.map((elem, i) => (
        <div className="variation-box" key={i}>
          {elem?.name && <h4 className="sub-title">{elem?.name}:</h4>}
          {stickyAddToCart ? <DropdownAttribute elem={elem} setVariant={setVariant} soldOutAttributesIds={soldOutAttributesIds} i={i} productState={productState} /> : <>{elem?.style == "radio" ? <RadioAttribute elem={elem} setVariant={setVariant} soldOutAttributesIds={soldOutAttributesIds} i={i} productState={productState} /> : elem?.style == "dropdown" ? <DropdownAttribute elem={elem} setVariant={setVariant} soldOutAttributesIds={soldOutAttributesIds} i={i} productState={productState} /> : elem?.style == "color" ? <ColorAttribute elem={elem} setVariant={setVariant} soldOutAttributesIds={soldOutAttributesIds} productState={productState} noHoverEffect={noHoverEffect} /> : <ImageOtherAttributes elem={elem} setVariant={setVariant} soldOutAttributesIds={soldOutAttributesIds} productState={productState} noHoverEffect={noHoverEffect} />}</>}
        </div>
      ))}
    </>
  );
};

export default ProductAttribute;
