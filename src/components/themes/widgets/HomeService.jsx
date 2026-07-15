import { getMediaSrc } from "@/utils/constants";
import useIsMobile from "@/utils/hooks/useIsMobile";
import Image from "next/image";
import React, { Fragment, useEffect, useState } from "react";
import { Row } from "reactstrap";

const HomeServices = ({ services, type }) => {
  const [filteredServices, setFilteredServices] = useState([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (services) {
      const filtered = services.filter((service) => service.status);
      setFilteredServices(filtered);
    }
  }, [services]);

  const pickImg = (s) => (isMobile && s?.image_url_mobile) || s?.image_url;
  const pickTitle = (s) => (isMobile && s?.title_mobile) || s?.title;
  const pickDesc = (s) => (isMobile && s?.description_mobile) || s?.description;
  const fontStyle = (s, prefix) => {
    const family = (isMobile && s?.[`${prefix}_font_family_mobile`]) || s?.[`${prefix}_font_family`];
    const size = (isMobile && s?.[`${prefix}_font_size_mobile`]) || s?.[`${prefix}_font_size`];
    const style = {};
    if (family) style.fontFamily = family;
    if (size) style.fontSize = `${size}px`;
    return Object.keys(style).length ? style : undefined;
  };
  return (
    <>
      <Row className="g-sm-4 g-3">
        {filteredServices.map((service, index) => (
          <Fragment key={index}>
            {type === "simple" ? (
              <div className={` ${filteredServices.length === 4 ? "col-xl-3 col-md-6" : filteredServices.length === 3 ? "col-md-4" : filteredServices.length === 2 ? "col-md-6" : "col-12"}`}>
                <div className="service-block1">
                  <Image height={59} width={59} src={getMediaSrc(pickImg(service))} alt={pickTitle(service)} />
                  <div className="service-skeleton-img"></div>
                  <h4 style={fontStyle(service, "title")}>{pickTitle(service)}</h4>
                  <h4 className="skeleton-content-h4"></h4>
                  <p style={fontStyle(service, "description")}>{pickDesc(service)}</p>
                  <p className="skeleton-content-p"></p>
                </div>
              </div>
            ) : (
              <div className={`${filteredServices.length === 4 ? "col-xl-3 col-sm-6" : filteredServices.length === 3 ? "col-lg-4 col-sm-6" : filteredServices.length === 2 ? "col-sm-6" : "col-12"}`}>
                <div className="service-block">
                  <div className="media">
                    <Image height={59} width={59} src={getMediaSrc(pickImg(service))} alt={pickTitle(service)} />
                    <div className="skeleton-img-box"></div>
                    <div className="media-body">
                      <h4 style={fontStyle(service, "title")}>{pickTitle(service)}</h4>
                      <h4 className="skeleton-content-h4"></h4>
                      <p style={fontStyle(service, "description")}>{pickDesc(service)}</p>
                      <p className="skeleton-content-p"></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Fragment>
        ))}
      </Row>

      {!filteredServices.length && <app-no-data className="no-data-added" text="no_service" />}
    </>
  );
};

export default HomeServices;
