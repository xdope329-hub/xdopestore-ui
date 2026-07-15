import ProductIdsContext from "@/context/productIdsContext";
import { Href, getMediaSrc, storageURL } from "@/utils/constants";
import useIsMobile from "@/utils/hooks/useIsMobile";
import Image from "next/image";
import Link from "next/link";
import { useContext, useState } from "react";

// Resolve image src: prefer image_url (local storage), then original_url (absolute), then placeholder
const resolveImg = (imgUrl, placeholder, isMobile) => {
  if (isMobile && imgUrl?.image_url_mobile) return storageURL + imgUrl.image_url_mobile;
  if (imgUrl?.image_url) return storageURL + imgUrl.image_url;
  if (imgUrl?.original_url) return imgUrl.original_url;
  return placeholder;
};

const ImageLink = ({ classes = {}, imgUrl, placeholder, link, height, width, homeBanner = true, bgImg = false }) => {
  const [bgImage, setBgImage] = useState(bgImg);
  const isMobile = useIsMobile();
  const { filteredProduct } = useContext(ProductIdsContext);
  const redirectToProduct = (productId) => {
    const product = filteredProduct.find((elem) => elem?.id == productId);
    return product?.slug ? `product/${product.slug}` : null;
  };

  const productRoute = imgUrl?.redirect_link?.link_type === "product" ? redirectToProduct(imgUrl?.redirect_link?.link) : null;

  return (
    <>
      {imgUrl?.redirect_link?.link_type === "external_url" ? (
        <Link className="h-100" href={imgUrl?.redirect_link?.link || "/"} target="_blank">
          {bgImage ? <div className={`bg-size ${classes}`} style={{ backgroundImage: "url(" + (resolveImg(imgUrl, placeholder, isMobile)) + ")" }}></div> : <Image src={resolveImg(imgUrl, placeholder, isMobile)} className="bg-img w-100 img-fluid" alt="banner" height={height} width={width} unoptimized style={{ objectFit: "cover", width: "100%", height: "100%" }} />}
        </Link>
      ) : imgUrl?.redirect_link?.link_type === "collection" && !homeBanner ? (
        <Link className="h-100" href={imgUrl?.redirect_link?.link || Href} target="_blank">
          {bgImage ? <div className={`bg-size ${classes}`} style={{ backgroundImage: "url(" + (resolveImg(imgUrl, placeholder, isMobile)) + ")" }}></div> : <Image src={resolveImg(imgUrl, placeholder, isMobile)} className="bg-img w-100 img-fluid" alt="banner" height={height} width={width} unoptimized style={{ objectFit: "cover", width: "100%", height: "100%" }} />}
        </Link>
      ) : imgUrl?.redirect_link?.link_type === "collection" && homeBanner ? (
        <Link className="h-100" href={imgUrl?.redirect_link?.link ? `/category/${imgUrl?.redirect_link?.link}` : Href}>
          {bgImage ? <div className={`bg-size ${classes}`} style={{ backgroundImage: "url(" + (resolveImg(imgUrl, placeholder, isMobile)) + ")" }}></div> : <Image src={resolveImg(imgUrl, placeholder, isMobile)} className="bg-img w-100 img-fluid" alt="banner" height={height} width={width} unoptimized style={{ objectFit: "cover", width: "100%", height: "100%" }} />}
        </Link>
      ) : imgUrl?.redirect_link?.link_type === "product" && productRoute ? (
        <Link className="h-100" href={`/${productRoute}`}>
          {bgImage ? <div className={`bg-size ${classes}`} style={{ backgroundImage: `url(${resolveImg(imgUrl, placeholder, isMobile)}` }}></div> : <Image src={resolveImg(imgUrl, placeholder, isMobile)} className="bg-img w-100 img-fluid" alt="banner" height={height} width={width} unoptimized style={{ objectFit: "cover", width: "100%", height: "100%" }} />}
        </Link>
      ) : bgImage ? (
        <div className={`bg-size ${classes}`} style={{ backgroundImage: `url(${resolveImg(imgUrl, placeholder, isMobile)}` }}></div>
      ) : (
        (imgUrl?.image_url || placeholder) && <Image src={resolveImg(imgUrl, placeholder, isMobile)} className="bg-img w-100 img-fluid" alt="banner" height={height} width={width} unoptimized style={{ objectFit: "cover", width: "100%", height: "100%" }} />
      )}
    </>
  );
};

export default ImageLink;
