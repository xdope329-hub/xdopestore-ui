import NavTabTitles from "@/components/widgets/NavTabs";
import TextLimit from "@/utils/customFunctions/TextLimit";
import React, { useState } from "react";
import { Col, TabContent, TabPane } from "reactstrap";
import QnATab from "../common/QnATab";

const VerticalProductDetails = ({ productState }) => {
  let [showMore, setShowMore] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  // Review tab intentionally hidden storewide (kept QA) — matches
  // common/ProductDetailsTab.jsx. See git history to restore.
  const ProductDetailsTabTitle = [
    { id: 1, name: "Description" },
    { id: 3, name: "QA" },
  ];

  return (
    <>
      <Col xl="2">
        <NavTabTitles classes={{ navClass: "nav nav-tabs nav-material flex-column nav-border" }} titleList={ProductDetailsTabTitle} activeTab={activeTab} setActiveTab={setActiveTab} />
      </Col>
      <Col xl="10">
        <TabContent className="nav-material" activeTab={activeTab}>
          <TabPane className={activeTab == 1 ? "show fade active" : ""}>
            <div className={`product-description more-less-box ${showMore ? "more" : ""}`}>{showMore ? <TextLimit value={productState?.product?.description} /> : <TextLimit value={productState?.product?.description?.substring(0, 1600)} />}</div>
          </TabPane>
          <TabPane className={activeTab == 3 ? "show active" : ""}>
            <QnATab productState={productState} activeTab={activeTab} />
          </TabPane>
        </TabContent>
      </Col>
    </>
  );
};

export default VerticalProductDetails;
