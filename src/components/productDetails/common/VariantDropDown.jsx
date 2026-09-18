import { useTranslation } from "react-i18next";
import { variationAvailable, variationId, variationLabel } from "./variantOptions";

const VariantDropDown = ({ product, value = "", selectedOption }) => {
  const { t } = useTranslation("common");
  const variations = product?.variations || [];
  const selected = variations.find((variation) => variationId(variation) === value && variationAvailable(variation));
  return (
    <select
      className="form-control form-select select-dropdown"
      aria-label={`${t("SelectVariantFirst")}: ${product?.name || ""}`}
      value={selected ? value : ""}
      onChange={(event) => selectedOption(variations.find((variation) => variationId(variation) === event.target.value && variationAvailable(variation)) || null)}
    >
      <option value="">{t("SelectVariantFirst")}</option>
      {variations.map((variation) => (
        <option key={variationId(variation)} value={variationId(variation)} disabled={!variationAvailable(variation)}>
          {variationLabel(variation)}
        </option>
      ))}
    </select>
  );
};

export default VariantDropDown;
