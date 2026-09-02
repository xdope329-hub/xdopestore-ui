import AccountContext from "@/context/accountContext";
import { logout } from "@/utils/axiosUtils";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { Nav, NavItem, NavLink } from "reactstrap";
import ConfirmationModal from "./ConfirmationModal";

const NavTabTitles = ({ classes = {}, activeTab, setActiveTab, titleList, isLogout, callBackFun }) => {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const { setAccountData } = useContext(AccountContext);
  const { t } = useTranslation("common");
  const checkType = (value, index) => {
    if (typeof activeTab == "object") {
      return activeTab.id == value.id;
    } else {
      return activeTab == String(index + 1);
    }
  };

  const handleLogout = async () => {
    // Cierre de sesión compartido con el header: revoca el refresh en el
    // servidor (sin bloquear la UI) y borra ambos tokens, cookies auxiliares
    // y el localStorage de la cuenta.
    logout();
    setAccountData();
    setModal(false);
    router.push(`/`);
  };

  const onNavClick = (elem, i) => {
    setActiveTab((prev) => (typeof prev == "object" ? elem : String(i + 1)));
    elem.path && router.push(`${elem.path}`);
    callBackFun && callBackFun();
  };
  return (
    <>
      <Nav className={classes?.navClass}>
        {titleList.map((elem, i) => (
          <NavItem key={i}>
            <NavLink className={checkType(elem, i) ? "active" : ""} href={elem.path || "#"} onClick={(e) => { e.preventDefault(); onNavClick(elem, i); }}>
              {elem.icon && elem.icon}
              {t(elem?.title) || t(elem?.name)}
            </NavLink>
          </NavItem>
        ))}
        {isLogout && (
          <NavItem className="logout-cls">
            <a className="btn loagout-btn" onClick={() => setModal(true)}>
              <RiLogoutBoxRLine className="me-2" />
              {t("LogOut")}
            </a>
          </NavItem>
        )}
      </Nav>
      <ConfirmationModal modal={modal} setModal={setModal} confirmFunction={handleLogout} />
    </>
  );
};

export default NavTabTitles;
