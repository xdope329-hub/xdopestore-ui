import SettingContext from "@/context/settingContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import Link from "next/link";
import React, { useContext } from "react";
import { RiFacebookFill, RiInstagramFill, RiPinterestFill, RiTwitterFill } from "react-icons/ri";

// Settings -> Social Networks is the source of truth (independent of the
// selected theme/footer style); theme options' footer URLs remain a legacy
// fallback for stores configured before social settings existed.
const FooterSocial = () => {
  const { themeOption } = useContext(ThemeOptionContext);
  const { settingData } = useContext(SettingContext) || {};
  const social = settingData?.social || {};
  const links = [
    { url: social.facebook || themeOption?.footer?.facebook, Icon: RiFacebookFill, label: "Facebook" },
    { url: social.twitter || themeOption?.footer?.twitter, Icon: RiTwitterFill, label: "Twitter" },
    { url: social.instagram || themeOption?.footer?.instagram, Icon: RiInstagramFill, label: "Instagram" },
    { url: social.pinterest || themeOption?.footer?.pinterest, Icon: RiPinterestFill, label: "Pinterest" },
  ].filter((l) => l.url);

  if (!links.length) return null;
  return (
    <div className="footer-social">
      <ul>
        {links.map(({ url, Icon, label }) => (
          <li key={label}>
            <Link href={url} target="_blank" aria-label={label}>
              <Icon />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterSocial;
