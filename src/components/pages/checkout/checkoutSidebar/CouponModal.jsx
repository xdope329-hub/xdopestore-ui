import Btn from "@/elements/buttons/Btn";
import { couponBenefitLabel } from "@/utils/customFunctions/couponLabel";
import SettingContext from "@/context/settingContext";
import { Href } from "@/utils/constants";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { RiCloseLine } from "react-icons/ri";
import { Col, Modal, ModalBody, ModalHeader, Row } from "reactstrap";

const CouponModal = ({ couponData, onCopyCode, setToggle, toggle }) => {
  const { t } = useTranslation("common");
  const { convertCurrency } = useContext(SettingContext) || {};
  return (
    <Modal size="lg" className="modal-dialog modal-dialog-centered coupon-modal theme-modal-2" toggle={() => setToggle(!toggle)} isOpen={toggle}>
      <div className="modal-content">
        <ModalHeader>
          {t("ApplyCoupon")}
          <Btn color="transparent" className=" btn-close" id="address_modal_close_btn" onClick={() => setToggle(false)}>
            <RiCloseLine />
          </Btn>
        </ModalHeader>
        <ModalBody>
          <Row className="g-3">
            {couponData?.map((item, i) => (
              <Col md="6" key={i}>
                <div className="coupon-box">
                  <div className="coupon-name">
                    <div className="card-name">
                      <div>
                        <h5 className="fw-semibold dark-text">{item?.title}</h5>
                      </div>
                    </div>
                  </div>
                  <div className="coupon-content">
                    <p className="coupon-benefit fw-semibold mb-1">{couponBenefitLabel(item, { t, format: convertCurrency || String })}</p>
                    <p>{item?.description}</p>
                    <div className="coupon-apply">
                      <h6 className="coupon-code success-color">{item?.code}</h6>
                      <a href={Href} className="btn theme-btn p-0 border-btn copy-btn mt-0" onClick={() => onCopyCode(item?.code)}>
                        {t("CopyCode")}
                      </a>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </ModalBody>
      </div>
    </Modal>
  );
};

export default CouponModal;
