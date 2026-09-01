import NoDataFound from "@/components/widgets/NoDataFound";
import CategoryContext from "@/context/categoryContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import { FilterItemIds } from "@/utils/customFunctions/FilterItemIds";
import Link from "next/link";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";

const FooterCategories = () => {
  const { themeOption } = useContext(ThemeOptionContext);
  const { filterCategory } = useContext(CategoryContext);
  const categoryData = filterCategory("product");
  const filteredCategories = FilterItemIds({ neededData: themeOption?.footer?.footer_categories, mainData: categoryData });
  const { t } = useTranslation("common");

  return (
    <div className="footer-content">
      {filteredCategories?.length ? (
        <ul>
          {filteredCategories?.map((category) => (
            <li key={category.id}>
              <Link href={`/collections?category=${category?.slug}`} className="text-content">
                {t(category?.name)}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        null
      )}
    </div>
  );
};

export default FooterCategories;
