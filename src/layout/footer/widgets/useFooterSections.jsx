import CategoryContext from "@/context/categoryContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import { FilterItemIds } from "@/utils/customFunctions/FilterItemIds";
import { useContext } from "react";

/**
 * Qué secciones del footer tienen contenido real. Los cuatro layouts de
 * footer usan esto para OCULTAR por completo (título incluido) las secciones
 * vacías — nada de cajas "no se encontró…". Cada sección reaparece sola
 * cuando se configura en el admin (Theme Option → Footer).
 */
const useFooterSections = () => {
  const { themeOption } = useContext(ThemeOptionContext) || {};
  const { filterCategory } = useContext(CategoryContext) || {};
  const footerCategories = FilterItemIds({
    neededData: themeOption?.footer?.footer_categories,
    mainData: filterCategory ? filterCategory("product") : [],
  });
  return {
    hasCategories: (footerCategories?.length || 0) > 0,
    hasUsefulLinks: (themeOption?.footer?.useful_link?.length || 0) > 0,
    hasHelpCenter: (themeOption?.footer?.help_center?.length || 0) > 0,
  };
};

export default useFooterSections;
