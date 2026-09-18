"use client";
import request from "@/utils/axiosUtils";
import { ThemeOptionsAPI } from "@/utils/axiosUtils/API";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import React, { useEffect, useState } from "react";
import ThemeOptionContext from ".";

const ThemeOptionProvider = (props) => {
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [openOffCanvas, setOpenOffCanvas] = useState(false);
  const [paginationDetails, setPaginationDetails] = useState({});
  const [cartCanvas, setCartCanvas] = useState(false);
  const [mobileSideBar, setMobileSideBar] = useState(false);
  const [collectionMobile, setCollectionMobile] = useState(false);
  const [themeOption, setThemeOption] = useState({});
  const [variant, setVariant] = useState("");
  // Producto en pantalla (ficha): el botón flotante de WhatsApp incluye su
  // referencia en el mensaje. null fuera de la ficha.
  const [whatsappProduct, setWhatsappProduct] = useState(null);

  const { data, isLoading, refetch } = useFetchQuery([ThemeOptionsAPI], () => request({ url: ThemeOptionsAPI }), {
    enabled: false,
    refetchOnWindowFocus: false,
    select: (res) => res?.data,
  });

  useEffect(() => {
    refetch();
  }, []);
  useEffect(() => {
    if (data) {
      setThemeOption(data?.options);
    }
  }, [isLoading]);

  return (
    <>
      <ThemeOptionContext.Provider value={{ ...props, setVariant, variant, isLoading, openAuthModal, setOpenAuthModal, themeOption, openOffCanvas, paginationDetails, setPaginationDetails, setOpenOffCanvas, cartCanvas, setCartCanvas, mobileSideBar, setMobileSideBar, collectionMobile, setCollectionMobile, whatsappProduct, setWhatsappProduct }}>{props.children}</ThemeOptionContext.Provider>
    </>
  );
};

export default ThemeOptionProvider;
