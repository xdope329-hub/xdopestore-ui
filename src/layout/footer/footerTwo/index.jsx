import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Col, Container, Row } from "reactstrap";
import FooterAbout from "../widgets/FooterAbout";
import FooterCategories from "../widgets/FooterCategories";
import FooterHelpCenter from "../widgets/FooterHelpCenter";
import FooterLogo from "../widgets/FooterLogo";
import FooterNewsLetter from "../widgets/FooterNewsLetter";
import FooterStoreInformation from "../widgets/FooterStoreInformation";
import FooterUsefulLinks from "../widgets/FooterUsefulLinks";
import SubFooter from "../widgets/SubFooter";
import useFooterSections from "../widgets/useFooterSections";

const FooterTwo = () => {
  const { t } = useTranslation("common");
  const { hasCategories, hasUsefulLinks, hasHelpCenter } = useFooterSections();
  const [openClose, setOpenClose] = useState({
    helpCenter: false,
    categories: false,
    useFulLinks: false,
    storeInfo: false,
  });

  const toggle = (toggleKey) => {
    setOpenClose((prevState) => ({
      ...prevState,
      [toggleKey]: !prevState[toggleKey],
    }));
  };

  return (
    <footer>
      <div className="dark-layout">
        <Container>
          <section className="section-b-space border-b section-t-space">
            <Row className="footer-theme2">
              <Col lg="3">
                <div className="footer-content">
                  <FooterLogo />
                  <FooterAbout />
                </div>
              </Col>
              {/* Boletín oculto — FooterNewsLetter retorna null; la columna
                  se elimina para no dejar el hueco del layout. */}
              <Col lg="3">
                <FooterStoreInformation icon={false} />
              </Col>
            </Row>
          </section>
        </Container>
      </div>
      <div className="dark-layout">
        <Container>
          <section className="small-section section-t-space">
            <Row className=" footer-theme2">
              <Col className="p-set">
                {hasCategories && (
                  <div className="footer-link" onClick={() => toggle("categories")}>
                    <div className={`footer-title ${openClose?.categories ? "show" : ""}`}>
                      <h4>{t("Categories")}</h4>
                    </div>
                    <FooterCategories />
                  </div>
                )}
                {hasUsefulLinks && (
                  <div className="footer-link-b" onClick={() => toggle("useFulLinks")}>
                    <div className={`footer-title ${openClose?.useFulLinks ? "show" : ""}`}>
                      <h4>{t("UsefulLinks")}</h4>
                    </div>
                    <FooterUsefulLinks />
                  </div>
                )}
                {hasHelpCenter && (
                  <div className="footer-link-b" onClick={() => toggle("helpCenter")}>
                    <div className={`footer-title ${openClose?.helpCenter ? "show" : ""}`}>
                      <h4>{t("HelpCenter")}</h4>
                    </div>
                    <FooterHelpCenter />
                  </div>
                )}
              </Col>
            </Row>
          </section>
        </Container>
      </div>
      <SubFooter classes={{ sectionClass: "darker-subfooter" }} />
    </footer>
  );
};

export default FooterTwo;
