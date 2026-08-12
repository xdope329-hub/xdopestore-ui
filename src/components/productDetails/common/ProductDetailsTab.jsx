import NavTabTitles from "@/components/widgets/NavTabs";
import TextLimit from "@/utils/customFunctions/TextLimit";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Col, TabContent, TabPane } from "reactstrap";
import QnATab from "./QnATab";
import { RiArrowDownSLine } from "react-icons/ri";
import Btn from "@/elements/buttons/Btn";

const ProductDetailsTab = ({ productState }) => {
  const { t } = useTranslation("common");
  let [showMore, setShowMore] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  // Review tab intentionally hidden storewide (kept QA). To restore it, add
  // { id: 2, name: "Review" } back here and re-add the matching TabPane below
  // (renders <CustomerReview /> — see git history).
  const ProductDetailsTabTitle = [
    { id: 1, name: "Description" },
    { id: 3, name: "QA" },
  ];

  const seeMore = () => {
    setShowMore(!showMore);
  };
  return (
    <Col sm={12} lg={12}>
      <NavTabTitles classes={{ navClass: "nav nav-tabs nav-material" }} titleList={ProductDetailsTabTitle} activeTab={activeTab} setActiveTab={setActiveTab} />
      <TabContent className="nav-material" activeTab={activeTab}>
        <TabPane className={activeTab == 1 ? "show active" : ""}>
          <div className={`product-description more-less-box ${showMore ? "more" : ""}`}>
            {productState?.product?.description?.length > 1500 ? showMore ? <TextLimit classes={'more-text'} value={productState?.product?.description} /> : <TextLimit classes={'more-text'} value={productState?.product?.description?.substring(0, productState?.product?.description?.length / 2)} /> : <TextLimit classes={'more-text'} value={productState?.product?.description} />}
            {productState?.product?.description?.length > 1500 && <Btn className="btn-solid hover-solid bg-theme btn-md scroll-button btn-sm mt-3 more-lest-btn" onClick={seeMore}>
              {showMore ? t("ShowLess") : t("ShowMore")}
              <RiArrowDownSLine />
            </Btn>}
          </div>
        </TabPane>

        <TabPane className={activeTab == 3 ? "show active" : ""}>
          <QnATab productState={productState} activeTab={activeTab} />
        </TabPane>
      </TabContent>
    </Col>
  );
};

export default ProductDetailsTab;
