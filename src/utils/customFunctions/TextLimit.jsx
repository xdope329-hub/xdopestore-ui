import React from "react";
import { trustedHtml } from "@/utils/security/sanitizeHtml";

const TextLimit = ({ value, maxLength, tag, classes }) => {
  if (!value) {
    return "";
  }

  let summarizedValue = value.substring(0, maxLength);

  if (value.length > maxLength) {
    summarizedValue += "...";
  }

  if (containsHtmlTags(value)) {
    const sanitizedValue = sanitizeAndTrustHtml(summarizedValue);

    if (tag == "p") {
      return <p className={classes ? classes : ""} dangerouslySetInnerHTML={sanitizedValue} />;
    } else {
      return <div className={classes ? classes : ''} dangerouslySetInnerHTML={sanitizedValue} />;
    }
  } else {
    if (tag == "p") {
      return <p className={classes ? classes : ""}>{summarizedValue}</p>;
    } else {
      return <div className={classes ? classes : ''}>{summarizedValue}</div>;
    }
  }
};

const containsHtmlTags = (value) => {
  const htmlRegex = /<[a-z][\s\S]*>/i;
  return htmlRegex.test(value);
};

// Product descriptions are CMS HTML: sanitised with DOMPurify (and never
// emitted raw during SSR). Truncating with substring can leave broken tags -
// the sanitiser also repairs those.
const sanitizeAndTrustHtml = (htmlString) => trustedHtml(htmlString);

export default TextLimit;
