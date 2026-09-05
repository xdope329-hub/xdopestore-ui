import request from "@/utils/axiosUtils";
import useFetchQuery from "@/utils/hooks/useFetchQuery";
import { useEffect, useState } from "react";
import MenuList from "./MenuList";
import { visibleMenuItems } from "./menuRules";

const MainHeaderMenu = () => {
  const [isOpen, setIsOpen] = useState([]);
  const {
    data: headerMenu,
    refetch,
    isLoading,
    fetchStatus,
  } = useFetchQuery(["menu"], () => request({ url: "/menu" }), {
    select: (res) => {
      const originalData = res?.data?.data;
      if (!Array.isArray(originalData)) return [];
      // Sin las secciones que esta tienda no tiene (p. ej. "Blog" → /blogs, 404).
      return visibleMenuItems(originalData).map((item) => ({
        ...item,
        class: "0",
        link_type: item.link_type ?? "link",
        is_target_blank: item.is_target_blank ?? 0,
      }));
    },
    refetchOnWindowFocus: true,
    enabled: false,
  });

  useEffect(() => {
    refetch();
  }, []);

  return (
    <>
      {isLoading ? (
        <ul className="skeleton-menu navbar-nav">
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
        </ul>
      ) : (
        <ul className="navbar-nav">
          {headerMenu?.map((menu, i) => (
            <MenuList menu={menu} key={i} customClass={`${!menu?.path ? "dropdown" : ""} nav-item `} level={0} isOpen={isOpen} setIsOpen={setIsOpen} />
          ))}
        </ul>
      )}
    </>
  );
};

export default MainHeaderMenu;
