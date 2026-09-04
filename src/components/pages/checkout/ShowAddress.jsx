import { ReactstrapRadio } from "@/components/widgets/reactstrapFormik";
import { Field } from "formik";
import { useTranslation } from "react-i18next";
import { RiEditLine } from "react-icons/ri";
import { Col, Label } from "reactstrap";

const ShowAddress = ({ item, type, index, onEdit }) => {
  const { t } = useTranslation("common");
  const value = item?.id || item?._id;
  return (
    <Col xxl={6} lg={12} md={6}>
      <Label className="m-0 h-100" htmlFor={`address-${type}-${index}`}>
        <div className="delivery-address-box">
          <div>
            <div className="form-check">
              <Field component={ReactstrapRadio} id={`address-${type}-${index}`} className="form-check-input" type="radio" name={`${type}_address_id`} value={value} />
            </div>
            <ul className="delivery-address-detail">
              <li className="d-flex align-items-start justify-content-between gap-2">
                <h4 className="fw-semibold">
                  {item?.title}
                  {item?.is_default && (
                    <span className="badge bg-dark ms-2" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>{t("Default") || "Default"}</span>
                  )}
                </h4>
                {onEdit && (
                  // Editar la dirección guardada sin salir del checkout. Se
                  // evita la activación del <label> para no cambiar la selección.
                  <button
                    type="button"
                    className="btn btn-sm p-0 border-0 bg-transparent theme-color fw-semibold d-inline-flex align-items-center gap-1 address-edit-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(item);
                    }}
                    aria-label={`${t("EditAddress")}: ${item?.title || ""}`}
                  >
                    <RiEditLine /> {t("Edit")}
                  </button>
                )}
              </li>
              <li>
                <p className="text-content">
                  <span className="text-title">{t("Address")} : </span>
                  {item?.street}{item?.city ? `, ${item.city}` : ''}{item?.state?.name ? `, ${item.state.name}` : ''}{item?.country?.name ? `, ${item.country.name}` : ''}
                </p>
              </li>
              {item?.pincode ? (
                <li>
                  <h6 className="text-content">
                    <span className="text-title">{t("PinCode")} :</span> {item?.pincode}
                  </h6>
                </li>
              ) : null}
              <li>
                <h6 className="text-content mb-0">
                  <span className="text-title">{t("Phone")} :</span> {item?.country_code && `+${item?.country_code}`} {item?.phone}
                </h6>
              </li>
            </ul>
          </div>
        </div>
      </Label>
    </Col>
  );
};

export default ShowAddress;
